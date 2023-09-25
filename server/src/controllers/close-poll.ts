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
    console.log('poll to close', poll);
    if (poll && poll.closes < currentMillis) {
      const r = await verifyVoters(poll.voteTokenResource, poll.votes);
      console.log('verified voters', r)
      if (r.isErr()) {
        throw Error(r.error.reason);
        // return res.send({ success: false, message: r.error.reason });
      }
      const closedPoll = closePoll(poll, r.value);
      pollsRepo.update(closedPoll);
      return closedPoll;
    }
    throw Error("Poll can't be closed");
  };
