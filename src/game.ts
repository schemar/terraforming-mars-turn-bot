import axios from "axios";

import { getServers } from "./servers";

const gameLinkRegex = /\/player\?id=([a-zA-Z0-9]+)$/;

/** Each game is tracked for a specific player on a specific server. */
export interface Game {
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
  /** Trying to catch some edge cases where the game age doesn't increase. */
  wasWaiting?: boolean;
}

/** Remove a specific game from the games array. */
export const removeGame = (games: Game[], playerId: string): Game[] => {
  return games.filter((game) => game.playerId !== playerId);
};

/** Tries to get the game link and player id from a URL to a game. */
export const extractGameInfo = async (
  input: string
): Promise<{ error: string | null; id: string; url: string }> => {
  const match = input.match(gameLinkRegex);
  if (match === null) {
    return {
      error:
        "Not a valid game URL. Please track the URL including `/player?id=...`",
      id: "",
      url: "",
    };
  }

  const id = match[1];
  const url = input.replace(gameLinkRegex, "");

  if (!getServers().includes(url)) {
    return {
      error:
        "This bot is not configured for the game server where your game is running.\nAsk your admin to run their own Terra Forming Mars Turn Bot. They can get all the info at https://github.com/schemar/terraforming-mars-turn-bot",
      id: "",
      url: "",
    };
  }

  // Test it:
  try {
    await axios.get(`${url}/api/player?id=${id}`);
  } catch {
    return { error: "Cannot reach game server. Not tracking game.", id, url };
  }

  return { error: null, id, url };
};
