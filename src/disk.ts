import { Game } from "./game";
import fs from "fs";

/** Reads into the games variable from the file on disk. */
export const readFromDisk = (gamesFile: string): Game[] => {
  let games: Game[] = [];
  try {
    const fileContent = fs.readFileSync(gamesFile, "utf8");
    games = JSON.parse(fileContent);
  } catch {
    console.info(
      "No file to read from disk. Starting with empty list of games."
    );
  }

  return games;
};

/** Writes what's currently inside the games variable to disk. */
export const writeToDisk = (games: Game[], gamesFile: string): void => {
  // Writing sync to ensure we are not writing simultaneously:
  fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2), "utf8");
};
