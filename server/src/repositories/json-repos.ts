/**
 * Lightweight repositories for development and prototyping backed by single JSON file
 */

import fs from "fs";
import { PollsRepo } from "./types";
import { Poll } from "../domain/types";

export const PollsJsonRepo = (jsonPath: string): PollsRepo => {
  const POLLS_KEY = "polls";

  let inMemDb: any = {};
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    inMemDb = JSON.parse(rawData);
  } catch (error) {
    console.log("Couldn't load data from file, starting with an empty DB.");
  }

  const persistToDisk = () =>
    new Promise((resolve, reject) => 
      fs.writeFile(jsonPath, JSON.stringify(inMemDb, null, 2), "utf-8", (err) => { }),
    ).then(() => console.log("PERSISTED"));

  const pollsRecords = () => inMemDb[POLLS_KEY] || [];

  return {
    getById: (pollId: string) => pollsRecords().find((p: Poll) => p.id === pollId),
    addPoll: (poll: Poll) => { inMemDb[POLLS_KEY] = [...pollsRecords(), poll], persistToDisk() },
    getAll: () => pollsRecords()
  }
}
