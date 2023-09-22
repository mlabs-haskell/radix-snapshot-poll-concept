import { secureRandom } from "../helpers/crypto";

export interface Poll {
  id: string;
  orgName: string;
  title: string;
  description: string;
  voteTokenResource: string;
  closes: number;
  closed: boolean;
  votes: [];
}

export const newPoll = (
  orgName: string,
  title: string,
  description: string,
  voteTokenResource: string,
  closes: number
  ): Poll => {
  const id = secureRandom(32);
  return {
    id,
    orgName,
    title,
    description,
    voteTokenResource,
    closes,
    closed: false,
    votes: [],
  }
}