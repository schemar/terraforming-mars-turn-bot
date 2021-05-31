import TelegramBot from "node-telegram-bot-api";

import { Game, extractGameInfo, removeGame } from "../game";

enum State {
  START,
  STOP,
}

/** Track the current bot state per chat (key is the chat id). */
const state: { [key: number]: State } = {};

export const handle = async (
  message: string,
  games: Game[],
  bot: TelegramBot,
  chatId: number
): Promise<Game[]> => {
  const messageMatch = message.match(/(\/(start|stop|cancel|help)|(.*))/);
  if (messageMatch === null) {
    bot.sendMessage(
      chatId,
      "I did not get your message. Try /help if you need help."
    );
  } else {
    const command = messageMatch[2]?.trim();
    const link = messageMatch[3]?.trim();

    if (command !== undefined) {
      handleCommand(command, bot, chatId);
    } else if (link !== undefined) {
      games = await handleLink(games, link, bot, chatId);
    } else {
      printHelp(bot, chatId);
    }
  }

  return games;
};

const handleCommand = (
  command: string,
  bot: TelegramBot,
  chatId: number
): void => {
  switch (command) {
    case "help":
      printHelp(bot, chatId);
      break;
    case "start":
      state[chatId] = State.START;
      bot.sendMessage(
        chatId,
        "OK. Send me the link to the game that you want to track."
      );
      break;
    case "stop":
      state[chatId] = State.STOP;
      bot.sendMessage(
        chatId,
        "OK. Send me the link to the game that you want to stop tracking."
      );
      break;
    case "cancel":
      delete state[chatId];
      bot.sendMessage(
        chatId,
        "OK. Use /start or /stop to start or stop tracking a game."
      );
      break;
    default:
      bot.sendMessage(
        chatId,
        "I did not get your message. Try /help if you need help."
      );
  }
};

const handleLink = async (
  games: Game[],
  link: string,
  bot: TelegramBot,
  chatId: number
): Promise<Game[]> => {
  switch (state[chatId]) {
    case State.START:
      games = await start(games, link, bot, chatId);
      delete state[chatId];
      break;
    case State.STOP:
      games = await stop(games, link, bot, chatId);
      delete state[chatId];
      break;
    default:
      printHelp(bot, chatId);
  }

  return games;
};

/** Stop tracking a game. */
const stop = async (
  games: Game[],
  input: string,
  bot: TelegramBot,
  chatId: number
): Promise<Game[]> => {
  const gameLink = await extractGameInfo(input);
  if (!gameLink.id) {
    bot.sendMessage(
      chatId,
      "Invalid request. Please send the whole link to the game that you used to start tracking."
    );
    return games;
  }

  const previousLength = games.length;
  games = removeGame(games, gameLink.id);

  if (previousLength !== games.length) {
    bot.sendMessage(
      chatId,
      `Success! Stopped tracking game with id ${gameLink.id}.`
    );
  } else {
    bot.sendMessage(
      chatId,
      "Could not find game at given player id. Please check your id.\nMaybe the game has already ended?"
    );
  }

  return games;
};

/** Track a new game from a message to the bot. Input is the URL from the user. */
const start = async (
  games: Game[],
  input: string,
  bot: TelegramBot,
  chatId: number
): Promise<Game[]> => {
  const gameLink = await extractGameInfo(input);
  if (gameLink.error !== null) {
    bot.sendMessage(chatId, "Could not track game.\n" + gameLink.error);
    return games;
  }
  const game = games.find((game) => game.playerId === gameLink.id);
  if (game !== undefined) {
    bot.sendMessage(chatId, `Already tracking a game with id ${gameLink.id}.`);
    return games;
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
    `Success! Started tracking game with id ${gameLink.id}.`
  );

  return games;
};

const printHelp = (bot: TelegramBot, chatId: number): void => {
  bot.sendMessage(
    chatId,
    "I can notify you when it is your turn in a game of the open " +
      "source version of Terraforming Mars.\n\n" +
      "You can control me by sending these commands:\n\n" +
      "/start - Start tracking a game\n" +
      "/stop - Stop tracking a game\n" +
      "/cancel - Cancel what you are currently doing\n" +
      "/help - Print this help message\n\n" +
      "A link to a game looks like this (note your player id at the end):\n" +
      "https://tm.example.com/player?id=abc123"
  );
};
