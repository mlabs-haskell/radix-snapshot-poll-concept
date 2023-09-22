import { secureRandom } from "../helpers/crypto";

export interface Poll {
  id: string;
  orgName: string;
  title: string;
  description: string;
  voteTokenResource: string;
  closes: number;
  closed: boolean;
  votes: Vote[];
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

export interface Vote {
  id: string,
  voter: string,
  vote: 'yes' | 'no'
}

export const addVote = (poll: Poll, vote: Vote): Poll => {
  return {
    ...poll,
    votes: [
      ...poll.votes,
      {
        id: vote.id,
        voter: vote.voter,
        vote: vote.vote,
      },
    ],
  }
}
