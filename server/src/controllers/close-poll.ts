import { closePoll } from "../domain/types";
import { SnapshotPollingServices } from "../loaders/services";
import { PollsRepo } from "../repositories/types";

export default (
  pollsRepo: PollsRepo,
  verifyVoters: SnapshotPollingServices["verifyVoters"],
) =>
  async (id: string) => {
    const currentMillis = Date.now();
    const poll = pollsRepo.getById(id);
    if (poll && poll.closes < currentMillis) {
      const r = await verifyVoters(poll.voteToken, poll.votes);
      if (r.isErr()) {
        throw Error(r.error.reason);
      }
      const closedPoll = closePoll(poll, r.value);
      pollsRepo.update(closedPoll);
      return closedPoll;
    }
    throw Error("Poll can't be closed");
  };
