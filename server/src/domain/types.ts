import { LedgerState } from "snapshoter/build/types";
import { secureRandom } from "../helpers/crypto";

export interface Poll {
  readonly id: string;
  readonly orgName: string;
  readonly title: string;
  readonly description: string;
  readonly voteToken: VoteToken;
  readonly closes: number;
  readonly closed: boolean;
  readonly votes: Vote[];
  readonly verifiedVotes?: VerifiedVoters;
};

export const newPoll = (
  orgName: string,
  title: string,
  description: string,
  voteTokenData: { resourceAddress: string, weight: number },
  closes: number
): Poll => {
  const id = secureRandom(32);
  return {
    id,
    orgName,
    title,
    description,
    voteToken: VoteToken.new(voteTokenData.resourceAddress, voteTokenData.weight),
    closes,
    closed: false,
    votes: [],
  }
};

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
};

export const closePoll = (poll: Poll, verifiedVotes: VerifiedVoters): Poll => {
  return {
    ...poll,
    closed: true,
    verifiedVotes: verifiedVotes
  }
};

class VoteToken {
  readonly resourceAddress: string;
  readonly weight: number;

  private constructor(tokenResource: string, weight: number) {
    this.resourceAddress = tokenResource;
    this.weight = weight;
  };

  static new(resourceAddress: string, weight: number) {
    if (!resourceAddress) {
      throw Error(`Error defining vote token: resource address is empty`);
    }
    if (!weight || weight < 0) {
      throw Error(`Error defining vote token: weight is missing or negative: ${weight}`);
    }

    return new VoteToken(resourceAddress, weight);
  }
};

export interface Vote {
  readonly id: string,
  readonly voter: string,
  readonly vote: 'yes' | 'no'
};

export interface VerifiedVote {
  readonly id: string,
  readonly voter: string,
  readonly vote: 'yes' | 'no',
  readonly balance: number,
  readonly power: number /** `vote token balance` * `vote token weight` */
};

export const makeVerified = (vote: Vote, verifiedBalance: number, weight: number): VerifiedVote => {
  if (verifiedBalance <= 0) {
    throw Error(`Balance of verified vote cant be zero or negative. Balance: ${verifiedBalance}`)
  }

  if (weight <= 0) {
    throw Error(`Wight of verified vote cant be zero or negative. Weight: ${weight}`)
  }

  return {
    ...vote,
    balance: verifiedBalance,
    power: verifiedBalance * weight
  }
};

export type VerifiedVoters = {
  readonly verifiedAt: LedgerState;
  /** It is possible to calculate final votes and power using "raw" data from
   * `VerifiedVoters.votes` array on the frontend side,
   * but during votes verification, backend traverses all votes anyway
   * and collecting aggregated data during this process do not introduce any significant overhead.
   * So already aggregated data was included into the backend response for easier integration.
   */
  readonly aggregatedVotes: AggregatedVotes
  readonly votes: VerifiedVote[];
};

export interface AggregatedVotes {
  readonly yes: { count: number, balance: number, power: number },
  readonly no: { count: number, balance: number, power: number },
};

export class VoteAggregator {
  private votes = {
    yes: { count: 0, balance: 0, power: 0 },
    no: { count: 0, balance: 0, power: 0 },
  }
  add(verifiedVote: VerifiedVote) {
    this.votes[verifiedVote.vote].balance += verifiedVote.balance;
    this.votes[verifiedVote.vote].power += verifiedVote.power;
    this.votes[verifiedVote.vote].count += 1;
  }

  getAggregated() {
    return this.votes;
  }
};
