import { PowerFormula } from "../domain/power-formula";
import { Poll, newPoll } from "../domain/types";
import { PollsRepo } from "../repositories/types";

export type CreatePollData = {
  orgName: string;
  title: string;
  description: string;
  voteTokenResource: string;
  voteTokenWeight: number;
  powerFormula: PowerFormula;
  closes: number;
}

export default (pollsRepo: PollsRepo) =>
  ({
    orgName,
    title,
    description,
    voteTokenResource,
    voteTokenWeight,
    powerFormula,
    closes,
  }: CreatePollData ): Poll => {
    const poll = newPoll(
      orgName,
      title,
      description,
      { resourceAddress: voteTokenResource, weight: voteTokenWeight, powerFormula: powerFormula },
      closes);
    pollsRepo.addPoll(poll);
    return poll;
  };
