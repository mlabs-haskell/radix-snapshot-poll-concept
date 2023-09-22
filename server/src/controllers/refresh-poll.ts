import { SnapshotPollingServices } from "../loaders/services";
import Logger from "../loaders/logger";
import { PollsRepo } from "../repositories/types";

export default (
  pollsRepo: PollsRepo,
  verifyVoters: SnapshotPollingServices["verifyVoters"],
) =>
  async (id: string) => {
    const poll = pollsRepo.getById(id);
    if (!poll) {
      throw Error("Poll not found");
    }
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
