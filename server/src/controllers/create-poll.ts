import { Poll, newPoll } from "../domain/types";
import { PollsRepo } from "../repositories/types";

export default (pollsRepo: PollsRepo) =>
  ({
    orgName,
    title,
    description,
    voteTokenResource,
    closes,
  }: {
    orgName: string;
    title: string;
    description: string;
    voteTokenResource: string;
    closes: number;
  }): Poll => {
    const poll = newPoll(orgName, title, description, voteTokenResource, closes);
    pollsRepo.addPoll(poll);
    return poll;
  };
