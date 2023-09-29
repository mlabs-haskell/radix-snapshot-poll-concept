import { ChallengesRepo } from "../repositories/types";

export default (challengesRepo: ChallengesRepo) =>
  async () => {
    const challenge = challengesRepo.newChallenge();
    return challenge;
  };
