import { Poll, newPoll } from "../domain/types";
import { PollsRepo } from "../repositories/types";

export default (pollsRepo: PollsRepo) =>
  ({
    orgName,
    title,
    description,
    voteTokenResource,
    voteTokenWeight,
    closes,
  }: {
    orgName: string;
    title: string;
    description: string;
    voteTokenResource: string;
    voteTokenWeight: number;
    closes: number;
  }): Poll => {
    const poll = newPoll(
      orgName,
      title,
      description,
      { resourceAddress: voteTokenResource, weight: voteTokenWeight },
      closes);
    pollsRepo.addPoll(poll);
    return poll;
  };
