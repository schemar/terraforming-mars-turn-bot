import axios from "axios";
import fs from "fs";
import path from "path";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TMTB_TOKEN;
const gameLinkRegex = /\/player\?id=(.*)$/;
// Timeout between game checks.
const timeout = 10_000;
const gamesFile = path.join(".", "games.json");

/** Each game is tracked for a specific player on a specific server. */
interface Game {
  /** Telegram chat id where to send messages to. */
  chatId: number;
  /** URL up to (but not including) /player?id... */
  url: string;
  /** The player id of the player on the server. */
  playerId: string;
  /** The game age from the last refresh. */
  gameAge: number;
  /** The undo count from the last refresh. */
  undoCount: number;
  /** The game age when the user was last informed that it is their turn. */
  lastGoGameAge: number;
  /** The undo count when the user was last informed that it is their turn. */
  lastGoUndoCount: number;
}

/**
 * All games that the bot tracks.
 *
 * Read from disk when starting up. Written on every update.
 */
let games: Game[] = [];

/** Reads into the games variable from the file on disk. */
const readFromDisk = (): void => {
  try {
    const fileContent = fs.readFileSync(gamesFile, "utf8");
    games = JSON.parse(fileContent);
  } catch {
    console.log(
      "No file to read from disk. Starting with empty list of games."
    );
  }
};

/** Writes what's currently inside the games variable to disk. */
const writeToDisk = (): void => {
  // Writing sync to ensure we are not writing simultaneously:
  fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2), "utf8");
};

/** Remove a specific game from the games array. */
const removeGame = (playerId: string): boolean => {
  const game = games.find((game) => game.playerId === playerId);
  if (game === undefined) {
    return false;
  }

  games = games.filter((game) => game.playerId !== playerId);

  return true;
};

/** Tries to get the game link and player id from a URL to a game. */
const extractGameInfo = async (
  input: string
): Promise<{ ok: boolean; id: string; url: string }> => {
  const match = input.match(gameLinkRegex);
  if (match === null) {
    return { ok: false, id: "", url: "" };
  }

  const id = match[1];
  const url = input.replace(gameLinkRegex, "");

  // Test it:
  try {
    await axios.get(`${url}/api/waitingfor?id=${id}`);
  } catch {
    return { ok: false, id, url };
  }

  return { ok: true, id, url };
};

/** Run the bot. Will be executed at the end of the file. */
const run = async () => {
  if (!token) {
    console.error("Cannot run without a token. Set env variable TMTB_TOKEN.");
    console.error("You can get a token from Telegram's BotFather.");
    return;
  }
  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: true });

  const printHelp = (chatId: number): void => {
    bot.sendMessage(
      chatId,
      "This bot will notify you when it is your turn in a game of the open " +
        "source version of Terraforming Mars.\n\n" +
        "To get informed, send a message to the bot that looks like this:\n" +
        "/track <link-to-game>\n\n" +
        "To stop getting messages, send a message like this:\n" +
        "/stop <link-to-game>\n\n" +
        "A link to a game looks like this:\n" +
        "https://tm.example.com/player?id=abc123\n\n" +
        "So an example would be:\n" +
        "/track https://tm.example.com/player?id=abc123"
    );
  };

  /** Track a new game from a message to the bot. Input is the URL from the user. */
  const track = async (input: string, chatId: number): Promise<void> => {
    const gameLink = await extractGameInfo(input);
    if (!gameLink.ok) {
      bot.sendMessage(
        chatId,
        "Could not get game at provided link. Please check your link."
      );
      return;
    }
    const game = games.find((game) => game.playerId === gameLink.id);
    if (game !== undefined) {
      bot.sendMessage(
        chatId,
        `Already tracking a game with id ${gameLink.id}.`
      );
      return;
    }

    games.push({
      chatId,
      playerId: gameLink.id,
      url: gameLink.url,
      gameAge: 0,
      undoCount: 0,
      lastGoGameAge: -1, // -1 to ensure initial message.
      lastGoUndoCount: -1, // -1 to ensure initial message.
    });

    bot.sendMessage(
      chatId,
      `Successfully started tracking game with id ${gameLink.id}.`
    );

    writeToDisk();
  };

  /** Stop tracking a game. */
  const stop = async (input: string, chatId: number): Promise<void> => {
    const gameLink = await extractGameInfo(input);
    if (!gameLink.id) {
      bot.sendMessage(
        chatId,
        "Invalid request. Please send the whole link to the game."
      );
      return;
    }

    if (!removeGame(gameLink.id)) {
      bot.sendMessage(
        chatId,
        "Could not find game at given player id. Please check your id.\nMaybe the game has already ended?"
      );
    } else {
      bot.sendMessage(chatId, "Stopped tracking.");
      writeToDisk();
    }
  };

  /** Reactions to messages to the bot. */
  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) {
      bot.sendMessage(chatId, "I only understand text messages.");
      return;
    }

    const messageMatch = msg.text.match(/\/(start|stop|help|track)(.*)/);
    if (messageMatch === null) {
      bot.sendMessage(
        chatId,
        "I did not get your message. Try /help if you need help"
      );
    } else {
      const command = messageMatch[1];
      const input = messageMatch[2].trim();

      switch (command) {
        case "start":
        case "help":
          printHelp(chatId);
          break;
        case "track":
          track(input, chatId);
          break;
        case "stop":
          stop(input, chatId);
          break;
        default:
          bot.sendMessage(
            chatId,
            "I did not get your message. Try /help if you need help"
          );
      }
    }
  });

  /** Get updated game data from the server. */
  const refreshData = async (game: Game): Promise<void> => {
    try {
      const refreshedData = await axios.get<{
        game: { gameAge: number; undoCount: number; phase: string };
      }>(`${game.url}/api/player?id=${game.playerId}`);
      if (refreshedData.data.game.phase === "end") {
        bot.sendMessage(
          game.chatId,
          `A Terraforming Mars game has ended.\n${game.url}/player?id=${game.playerId}`
        );
        removeGame(game.playerId);
      } else {
        game.gameAge = refreshedData.data.game.gameAge;
        game.undoCount = refreshedData.data.game.undoCount;
      }

      writeToDisk();
    } catch (error) {
      console.error("Could not refresh game", {
        error: error.message,
        game,
      });
    }
  };

  /** Use the quick "check" API to see if it is the user's turn. */
  const checkGame = async (game: Game): Promise<void> => {
    const url = `${game.url}/api/waitingfor?id=${game.playerId}&gameAge=${game.gameAge}&undoCount=${game.undoCount}`;
    try {
      const waitingfor = await axios.get<{ result: string }>(url);

      switch (waitingfor.data.result) {
        case "WAIT":
          // Nothing to do.
          break;
        case "GO":
          if (
            game.lastGoGameAge < game.gameAge ||
            game.lastGoUndoCount < game.undoCount
          ) {
            bot.sendMessage(
              game.chatId,
              `It is your turn in a Terraforming Mars game.\n${game.url}/player?id=${game.playerId}`
            );
            game.lastGoGameAge = game.gameAge;
            game.lastGoUndoCount = game.undoCount;

            writeToDisk();
          }
          break;
        case "REFRESH":
          await refreshData(game);
          // Re-check with refreshed data:
          checkGame(game);
          break;
        default:
          console.error("Do not understand terraforming mars response", {
            url,
            result: waitingfor.data.result,
            game,
          });
      }
    } catch (error) {
      console.error("Could not wait for game", {
        error: error.message,
        game,
      });
    }
  };

  readFromDisk();

  /** Keep in checking per timeout. */
  const checkGames = async () => {
    await Promise.all(games.map((game) => checkGame(game)));

    setTimeout(checkGames, timeout);
  };
  setTimeout(checkGames, timeout);
};

run();
