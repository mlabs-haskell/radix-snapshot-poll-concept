import { SnapshotPollingServices } from "../loaders/services";
import { DbKeys } from "../services/db-store";
import Logger from "../loaders/logger";

export default (
    dbStore: SnapshotPollingServices["dbStore"],
    verifyVoters: SnapshotPollingServices["verifyVoters"],
  ) =>
  async (id: string) => {
    const poll = dbStore.get(DbKeys.Polls).find((p: any) => p.id === id);
    if (poll.closed) {
      throw Error("Poll is closed");
    }

    const r = await verifyVoters(poll.voteTokenResource, poll.votes);
    if (r.isErr()) {
      Logger.error("Failed to verify voters");
      throw Error(r.error.reason);
    }
    return {
      ...poll,
      verifiedVotes: r.value,
    };
  };
