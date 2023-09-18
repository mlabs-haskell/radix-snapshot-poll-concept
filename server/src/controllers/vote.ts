import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";
import { SnapshotPollingServices } from "../loaders/services";
import Logger from "../loaders/logger";
import { DbKeys } from "../services/db-store";

export default (dbStore: SnapshotPollingServices['dbStore'], rolaService: SnapshotPollingServices['rolaService']) => async (p: { pollId: string, vote: 'yes' | 'no', signedChallenge: SignedChallenge }) => {
  const { challenge } = p.signedChallenge;
  const r = await rolaService(p.signedChallenge); // verify signed challenge, returns derived address of signer
  if (r.isErr()) {
    Logger.debug("error verifying", r);
    throw Error(r.error.reason);
  }
  const poll = dbStore.get(DbKeys.Polls).find((p: any) => p.id === p.pollId);
  if (poll.closed) throw Error("Poll is closed");
  if (poll.votes.find((v: any) => v.voter === r.value)) throw Error("Already voted");

  // push vote to poll
  dbStore.set(
    DbKeys.Polls,
    dbStore.get(DbKeys.Polls).map((p: any) =>
      p.id === p.pollId
        ? {
            ...p,
            votes: [
              ...p.votes,
              {
                id: challenge,
                voter: r.value,
                vote: p.vote,
              },
            ],
          }
        : p,
    ),
  );

  return
}
