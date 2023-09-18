import snap from "snapshoter";
import { DbStore } from "../services/db-store";
import { RolaFactory } from "../services/rola/rola";
import { GatewayService } from "../services/gateway/gateway";
import { ChallengeStore } from "../services/rola/challenge-store";
import { SnapshotPollingConfig } from "../config";
import { VerifyVoters } from "../services/verify-voters";

export type SnapshotPollingServices = ReturnType<typeof services>;
export type Snapshoter = ReturnType <typeof snap>

const services = (config: SnapshotPollingConfig) => {
  const dbStore = DbStore("db.json")
  const gatewayService = GatewayService("https://rcnet-v3.radixdlt.com");
  const challengeStore = ChallengeStore(dbStore);
  const rolaService = RolaFactory({
    gatewayService,
    expectedOrigin: config.radix.expectedOrigin,
    dAppDefinitionAddress: config.radix.dAppDefinitionAddress,
    networkId: config.radix.networkId,
  })
  const snapshoter = snap({
    db: {
      db: config.db.db,
      host: config.db.host,
      user: config.db.user,
      pass: config.db.password,
      port: config.db.port,
    }
  })
  const verifyVoters = VerifyVoters(snapshoter);

  return {
    dbStore,
    gatewayService,
    challengeStore,
    rolaService,
    verifyVoters,
    snapshoter,
  }
}

export default services;
