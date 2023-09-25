import snap from "snapshoter";
import { RolaFactory } from "../services/rola/rola";
import { SnapshotPollingConfig } from "../config";
import { VerifyVoters } from "../services/verify-voters";
import { PollsRepo } from "../repositories/types";
import { ChallengesJsonRepo, PollsJsonRepo } from "../repositories/json-repos";

export type SnapshotPollingServices = ReturnType<typeof services>;
export type Snapshoter = ReturnType<typeof snap>;

const services = (config: SnapshotPollingConfig) => {
  const pollsRepo: PollsRepo = PollsJsonRepo("storage_polls.json");
  const challengesRepo = ChallengesJsonRepo("storage_challenges.json");
  const snapshoter = snap({
    db: {
      db: config.db.db,
      host: config.db.host,
      user: config.db.user,
      pass: config.db.password,
      port: config.db.port,
    },
  });

  const rolaService = RolaFactory({
    snapshoter,
    challengesRepo,
    expectedOrigin: config.radix.expectedOrigin,
    dAppDefinitionAddress: config.radix.dAppDefinitionAddress,
    networkId: config.radix.networkId,
  });
  const verifyVoters = VerifyVoters(snapshoter);


  return {
    rolaService,
    verifyVoters,
    snapshoter,
    pollsRepo,
    challengesRepo,
  };
};

export default services;
