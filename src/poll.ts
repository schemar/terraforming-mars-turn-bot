import axios from "axios";
import Bottleneck from "bottleneck";
import TelegramBot from "node-telegram-bot-api";

import { Game } from "./game";
import { ApiResponse, GameState, Phase } from "./game-state";

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 10,
});

/** Keep in checking per timeout. */
export const poll = async (
  games: Game[],
  bot: TelegramBot
): Promise<Game[]> => {
  const processedGames: (Game | null)[] = await Promise.all(
    games.map((game) => limiter.schedule(() => checkWaiting(game, bot)))
  );

  return processedGames.filter((game) => game !== null) as Game[];
};

const checkWaiting = async (
  game: Game,
  bot: TelegramBot
): Promise<Game | null> => {
  if (game === null) {
    return game;
  }

  const waitingforUrl = `${game.url}/api/waitingfor?id=${game.playerId}&gameAge=${game.gameAge}&undoCount=${game.undoCount}`;
  try {
    const waitingfor = await axios.get<{ result: "WAIT" | "GO" | "REFRESH" }>(
      waitingforUrl
    );
    const { result } = waitingfor.data;
    switch (result) {
      case "WAIT":
        // Nothing to do.
        break;
      case "GO":
        return go(game, bot);
      case "REFRESH":
        const refreshedGame = await refresh(game, bot);

        if (refreshedGame === null) {
          return null;
        } else {
          return checkWaiting(refreshedGame, bot);
        }
      default:
        console.error("Do not understand terraforming mars response", {
          url: waitingforUrl,
          result: waitingfor.data.result,
          game,
        });
    }
  } catch (error) {
    console.error("Could not reach game server for waitfor update", {
      error: error.message,
      game,
    });
  }

  return game;
};

const refresh = async (game: Game, bot: TelegramBot): Promise<Game | null> => {
  const playerUrl = `${game.url}/api/player?id=${game.playerId}`;
  try {
    const { data } = await axios.get<ApiResponse>(playerUrl);
    const { game: remoteGame } = data;

    if (remoteGame?.phase === Phase.END) {
      bot.sendMessage(
        game.chatId,
        `A game of Terraforming Mars has ended.\n${game.url}/player?id=${game.playerId}`
      );
      return null;
    }

    if (
      remoteGame?.gameAge === undefined ||
      remoteGame.undoCount === undefined
    ) {
      throw new Error(
        "Server did not respond with expected data. Missing properties."
      );
    }

    game.gameAge = remoteGame.gameAge;
    game.undoCount = remoteGame.undoCount;
  } catch (error) {
    console.error("Refresh: Could not reach game server for player update", {
      error: error.message,
      game,
    });
  }

  return game;
};

/** Use the game API to see if it is the user's turn. */
const go = async (game: Game, bot: TelegramBot): Promise<Game | null> => {
  const playerUrl = `${game.url}/api/player?id=${game.playerId}`;
  try {
    const { data } = await axios.get<ApiResponse>(playerUrl);
    const { game: remoteGame, needsToDraft, needsToResearch } = data;

    if (remoteGame?.phase === Phase.END) {
      bot.sendMessage(
        game.chatId,
        `A game of Terraforming Mars has ended.\n${game.url}/player?id=${game.playerId}`
      );
      return null;
    }

    // Best effort to notify a player whenever it is their turn but not twice for the same turn.
    // Difficult due to how research and drafting are provided by the API.
    // Game age does not change at all if all other players pass...
    if (
      game.lastGoGameAge < game.gameAge ||
      game.lastGoUndoCount < game.undoCount
    ) {
      let message =
        "It is your turn in a Terraforming Mars game.\n" +
        `${game.url}/player?id=${game.playerId}\n\n`;

      if (needsToDraft) {
        message += "It is time to draft.\n\n";
      }

      if (needsToResearch) {
        message += "It is time to research.\n\n";
      }

      message += remoteGameInfo(remoteGame);

      bot.sendMessage(game.chatId, message);

      game.lastGoGameAge = game.gameAge;
      game.lastGoUndoCount = game.undoCount;
    }
  } catch (error) {
    console.error("Go: Could not reach game server for player update", {
      error: error.message,
      game,
    });
  }

  return game;
};

const remoteGameInfo = (game: GameState | undefined): string => {
  if (game === undefined) {
    return "";
  }

  const venus = game.venusScaleLevel ? `Venus: ${game.venusScaleLevel}\n` : "";

  return (
    "Game Info:\n" +
    `Gen: ${game.generation}\n` +
    `Oxygen: ${game.oxygenLevel}\n` +
    `Temp: ${game.temperature}\n` +
    `Oceans: ${game.oceans}\n` +
    venus
  );
};
