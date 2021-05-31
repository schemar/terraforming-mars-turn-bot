import path from "path";
import TelegramBot from "node-telegram-bot-api";

import { handle } from "./commands";
import { readFromDisk, writeToDisk } from "./disk";
import { Game } from "./game";
import { poll } from "./poll";
import { setServers } from "./servers";

/** Telegram bot token. */
const token = process.env.TMTB_TOKEN;

/** Allowed servers. */
const servers = process.env.TMTB_SERVERS?.split(",");

/** Timeout between game checks. */
const maxTimeout = 60_000;

/** Where game data is stored. */
const gamesFile = path.join(".", "games.json");

/**
 * All games that the bot tracks.
 *
 * Read from disk when starting up. Written on every update.
 */
let games: Game[] = [];

/** Run the bot. Will be executed at the end of the file. */
const run = async () => {
  if (!token) {
    console.error("Cannot run without a token. Set env variable TMTB_TOKEN.");
    console.error("You can get a token from Telegram's BotFather.");
    return;
  }
  if (!Array.isArray(servers)) {
    console.error(
      "Cannot run without a list of servers. Set env variable TMTB_SERVERS."
    );
    return;
  }

  games = readFromDisk(gamesFile);
  setServers(servers);

  // Create a bot that uses 'polling' to fetch new updates.
  const bot = new TelegramBot(token, { polling: true });

  /** Reactions to messages to the bot. */
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) {
      bot.sendMessage(chatId, "I only understand text messages.");
      return;
    }

    games = await handle(msg.text, games, bot, chatId);
    writeToDisk(games, gamesFile);
  });

  const polling = async () => {
    const startTime = Date.now();
    games = await poll(games, bot);
    writeToDisk(games, gamesFile);
    const elapsedTime = Date.now() - startTime;
    const timeout = Math.max(maxTimeout - elapsedTime, 0);
    setTimeout(polling, timeout);
  };

  polling();
};

run();
