import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";
import { SnapshotPollingServices } from "../loaders/services";
import Logger from "../loaders/logger";

export default (rolaService: SnapshotPollingServices['rolaService']) => async (c: SignedChallenge) => {
  const r = await rolaService(c);
  if (r.isErr()) {
    Logger.debug("error verifying", r);
    Logger.silly(r);
    throw Error(r.error.reason);
  }
  return
}
