import { SnapshotPollingServices } from "../loaders/services";
import { DbKeys } from "../services/db-store";

export default (
    dbStore: SnapshotPollingServices["dbStore"],
    verifyVoters: SnapshotPollingServices["verifyVoters"],
  ) =>
  async (id: string) => {
    const currentMillis = Date.now();
    const poll = dbStore.get(DbKeys.Polls).find((p: any) => p.id === id);
    console.log('poll to close', poll);
    if (poll && poll.closes < currentMillis) {
      const r = await verifyVoters(poll.voteTokenResource, poll.votes);
      console.log('verified voters', r)
      if (r.isErr()) {
        throw Error(r.error.reason);
        // return res.send({ success: false, message: r.error.reason });
      }
      poll.closed = true;
      // update poll's votes array by keeping only verified votes. Store original unverified votes in unverifiedVotes
      dbStore.set(
        DbKeys.Polls,
        dbStore.get(DbKeys.Polls).map((p: any) =>
          p.id === id
            ? {
                ...poll,
                votes: p.votes,
                verifiedVotes: r.value,
              }
            : p,
        ),
      );
      return poll;
    }
    throw Error("Poll can't be closed");
  };
