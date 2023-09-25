import snap from "snapshoter";
import { DbStore } from "../services/db-store";
import { RolaFactory } from "../services/rola/rola";
import { ChallengeStore } from "../services/rola/challenge-store";
import { SnapshotPollingConfig } from "../config";
import { VerifyVoters } from "../services/verify-voters";
import { PollsRepo } from "../repositories/types";
import { PollsJsonRepo } from "../repositories/json-repos";

export type SnapshotPollingServices = ReturnType<typeof services>;
export type Snapshoter = ReturnType<typeof snap>;

const services = (config: SnapshotPollingConfig) => {
  const pollsRepo: PollsRepo = PollsJsonRepo("storage_polls.json");
  const challengeStore = ChallengeStore(DbStore("storage_challenges.json"));
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
    expectedOrigin: config.radix.expectedOrigin,
    dAppDefinitionAddress: config.radix.dAppDefinitionAddress,
    networkId: config.radix.networkId,
  });
  const verifyVoters = VerifyVoters(snapshoter);


  return {
    challengeStore,
    rolaService,
    verifyVoters,
    snapshoter,
    pollsRepo
  };
};

export default services;
