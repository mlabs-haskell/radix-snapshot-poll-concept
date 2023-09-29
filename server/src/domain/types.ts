import { LedgerState } from "snapshoter/build/types";
import { secureRandom } from "../helpers/crypto";
import { PowerFormula, assertIsFormula, powerFormula } from "./power-formula";

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
  voteTokenData: { resourceAddress: string, weight: number, powerFormula: PowerFormula },
  closes: number
): Poll => {
  const id = secureRandom(32);
  return {
    id,
    orgName,
    title,
    description,
    voteToken: VoteToken.new(voteTokenData.resourceAddress, voteTokenData.weight, voteTokenData.powerFormula),
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

export class VoteToken {
  readonly resourceAddress: string;
  readonly weight: number;
  readonly powerFormula: PowerFormula;

  private constructor(tokenResource: string, weight: number, powerFormula: PowerFormula) {
    this.resourceAddress = tokenResource;
    this.weight = weight;
    this.powerFormula = powerFormula;
  };

  static new(resourceAddress: string, weight: number, powerFormula: PowerFormula) {
    if (!resourceAddress) {
      throw Error(`Resource address of vote token is empty`);
    }
    if (!weight || weight < 0) {
      throw Error(`Weight of vote token is missing or negative: ${weight}`);
    }
    assertIsFormula(powerFormula);
    return new VoteToken(resourceAddress, weight, powerFormula);
  };
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

export const makeVerified = (
  vote: Vote,
  verifiedBalance: number,
  voteToken: VoteToken
): VerifiedVote => {
  const weight = voteToken.weight;
  if (verifiedBalance <= 0) {
    throw Error(`Balance of verified vote cant be zero or negative. Balance: ${verifiedBalance}`)
  }
  return {
    ...vote,
    balance: verifiedBalance,
    power: powerFormula(voteToken.powerFormula).apply(verifiedBalance,weight) 
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
