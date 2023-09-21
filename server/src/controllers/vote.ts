import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";
import { SnapshotPollingServices } from "../loaders/services";
import Logger from "../loaders/logger";
import { DbKeys } from "../services/db-store";

export default (
    dbStore: SnapshotPollingServices["dbStore"],
    rolaService: SnapshotPollingServices["rolaService"],
  ) =>
  async (pollParam: {
    pollId: string;
    vote: "yes" | "no";
    signedChallenge: SignedChallenge;
  }) => {
    const { challenge } = pollParam.signedChallenge;
    const r = await rolaService(pollParam.signedChallenge); // verify signed challenge, returns derived address of signer
    if (r.isErr()) {
      Logger.debug("error verifying", r);
      throw Error(r.error.reason);
    }
    const poll = dbStore
      .get(DbKeys.Polls)
      .find((p: any) => p.id === pollParam.pollId);
    if (!poll) throw Error("Poll not found");
    if (poll.closed) throw Error("Poll is closed");
    if (poll.votes.find((v: any) => v.voter === r.value))
      throw Error("Already voted");

    // push vote to poll
    dbStore.set(
      DbKeys.Polls,
      dbStore.get(DbKeys.Polls).map((p: any) =>
        p.id === pollParam.pollId
          ? {
              ...p,
              votes: [
                ...p.votes,
                {
                  id: challenge,
                  voter: r.value,
                  vote: pollParam.vote,
                },
              ],
            }
          : p,
      ),
    );

    return;
  };
