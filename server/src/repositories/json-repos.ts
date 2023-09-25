/**
 * Lightweight repositories for development and prototyping backed by single JSON file
 */

import fs from "fs";
import { ChallengesRepo, PollsRepo } from "./types";
import { Poll } from "../domain/types";
import { secureRandom } from "../helpers/crypto";

export const PollsJsonRepo = (jsonPath: string): PollsRepo => {

  let inMemPolls: any = [];
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    inMemPolls = JSON.parse(rawData);
  } catch (error) {
    console.log("Couldn't load data from file, starting with an empty DB.");
  }

  const persistToDisk = () =>
    new Promise((resolve, reject) =>
      fs.writeFile(jsonPath, JSON.stringify(inMemPolls, null, 2), "utf-8", (err) => { }),
    );

  // const pollsRecords = () => inMemDb[POLLS_KEY] || [];

  return {
    getById: (pollId: string) => inMemPolls.find((p: Poll) => p.id === pollId),
    addPoll: (poll: Poll) => { inMemPolls = [...inMemPolls, poll], persistToDisk() },
    getAll: () => inMemPolls,
    update: (updated: Poll) => {
      const newRecords = inMemPolls
        .map((current: Poll) => current.id === updated.id ? updated : current);
      inMemPolls = [...newRecords];
      persistToDisk()
    }
  }
}

export const ChallengesJsonRepo = (jsonPath: string): ChallengesRepo => {

  const challenges = new Map<string, { expires: number }>();

  let inMemDb: any = [];
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    inMemDb = JSON.parse(rawData);
  } catch (error) {
    console.log("Couldn't load data from file, starting with an empty DB.");
  }

  const persistToDisk = () =>
    new Promise((resolve, reject) => {
      inMemDb = Object.fromEntries(challenges);
      fs.writeFile(jsonPath, JSON.stringify(inMemDb, null, 2), "utf-8", (err) => { })
    },
    );

  // store challenge with expiration
  const addEntry = (challenge: string, expires: number) => {
    challenges.set(challenge, { expires });
    persistToDisk();
  }

  // remove challenge after it has been used
  const removeEntry = (input: string) => {
    challenges.delete(input);
    persistToDisk();
  }

  return {
    newChallenge: () => {
      const challenge = secureRandom(32); // 32 random bytes as hex string
      const expires = Date.now() + 1000 * 60 * 1; // expires in 1 minutes
      addEntry(challenge, expires);
      return challenge;
    },
    existsAndValid: (input: string) => {
      const challenge = challenges.get(input);
      if (!challenge) return false;
      removeEntry(input);
      const isValid = challenge.expires > Date.now(); // check if challenge has expired
      return isValid;
    }
  }
}
