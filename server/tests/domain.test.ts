import {
  Poll,
  VerifiedVote,
  VerifiedVoters,
  Vote,
  VoteAggregator,
  VoteToken,
  addVote,
  closePoll,
  makeVerified,
  newPoll
} from "../src/domain/types";
import { PowerFormula } from "../src/domain/power-formula";

describe('Domain models tests', () => {

  test('Build new poll', () => {
    const poll = newPoll("Test org", "Test title", "Test description", voteTokenData, 42);
    expect(poll.closed).toBe(false);
    expect(poll.votes).toStrictEqual([]);
    expect(poll.id).not.toBe("");
    expect(poll.id).not.toBe(undefined);
  });

  test('Add vote', () => {
    const poll: Poll = newPoll("Test org", "Test title", "Test description", voteTokenData, 42);

    const voteOne: Vote = { id: "id-1", voter: "address-1", vote: 'yes' };
    const votedPoll = addVote(poll, voteOne);
    expect(poll).not.toBe(votedPoll);
    expect(votedPoll.votes.length).toBe(1);
    expect(votedPoll.votes[0]).toStrictEqual(voteOne);

    const voteTwo: Vote = { id: "id-2", voter: "address-2", vote: 'no' };
    const votedAgainPoll = addVote(votedPoll, voteTwo);
    expect(votedAgainPoll).not.toBe(votedPoll);
    expect(votedAgainPoll).not.toBe(poll);
    expect(votedAgainPoll.votes.length).toBe(2);
    expect(votedAgainPoll.votes[0]).toStrictEqual(voteOne);
    expect(votedAgainPoll.votes[1]).toStrictEqual(voteTwo);
  });

  test('Can not create poll with invalid token data', () => {
    expect(() => newPoll(
      "Test org", "Test title", "Test description",
      linearData("", 1),
      42))
      .toThrow(new Error('Resource address of vote token is empty'));

    expect(() => newPoll(
      "Test org", "Test title", "Test description",
      linearData("addr", 0),
      42))
      .toThrow(new RegExp('^Weight of vote token is missing or negative'));


    expect(() => newPoll(
      "Test org", "Test title", "Test description",
      linearData("addr", -1),
      42))
      .toThrow(new RegExp('^Weight of vote token is missing or negative'));
  });

  test('Close poll', () => {
    const poll: Poll = newPoll("Test org", "Test title", "Test description", voteTokenData, 42);
    const vote: Vote = { id: "id-1", voter: "address-1", vote: 'yes' };
    const verifiedVoters: VerifiedVoters = {
      verifiedAt: { epoch: 1, roundInEpoch: 1, stateVersion: 1 },
      aggregatedVotes: { yes: { count: 1, balance: 1, power: 1 }, no: { count: 1, balance: 1, power: 1 } },
      votes: [makeVerified(vote, 111, poll.voteToken)],
    };

    const closedPoll = closePoll(poll, verifiedVoters);
    expect(poll.verifiedVotes).toBe(undefined);
    expect(closedPoll.verifiedVotes).toBe(verifiedVoters);
    expect(closedPoll.closed).toBe(true);
  });

  test('Closing poll twice fails', () => {
    const poll: Poll = newPoll("Test org", "Test title", "Test description", voteTokenData, 42);
    const vote: Vote = { id: "id-1", voter: "address-1", vote: 'yes' };
    const verifiedVoters: VerifiedVoters = {
      verifiedAt: { epoch: 1, roundInEpoch: 1, stateVersion: 1 },
      aggregatedVotes: { yes: { count: 1, balance: 1, power: 1 }, no: { count: 1, balance: 1, power: 1 } },
      votes: [makeVerified(vote, 111, poll.voteToken)],
    };

    const closedPoll = closePoll(poll, verifiedVoters);
    expect(() => closePoll(closedPoll, verifiedVoters))
      .toThrow(`Can not close already closed poll`);
  });

  test('Votes aggregation', () => {
    const aggregator = new VoteAggregator();
    const testVoteYes: Vote = { id: "not_matter", voter: "not_matter", vote: "yes" };
    const testVoteNo: Vote = { id: "not_matter", voter: "not_matter", vote: "no" };
    const vVote1 = makeVerified(testVoteYes, 10, VoteToken.new("not_matter", 2, 'linear'));
    const vVote2 = makeVerified(testVoteNo, 10, VoteToken.new("not_matter", 2, 'linear'));
    const vVote3 = makeVerified(testVoteNo, 11, VoteToken.new("not_matter", 3, 'linear'));

    const expectedAggregated = {
      yes: { count: 1, balance: 10, power: 20 },
      no: { count: 2, balance: 21, power: 53 }
    };
    aggregator.add(vVote1);
    aggregator.add(vVote2);
    aggregator.add(vVote3);

    expect(aggregator.getAggregated()).toStrictEqual(expectedAggregated);
  });

  test('Building verified vote', () => {
    const vote: Vote = { id: "challenge-1", voter: "address-1", vote: 'yes' };
    const verifiedVote: VerifiedVote = makeVerified(vote, 111, testToken(2));

    expect(verifiedVote.balance).toBe(111);
    expect(verifiedVote.power).toBe(222);
    expect(verifiedVote.id).toBe(vote.id);
    expect(verifiedVote.vote).toBe(vote.vote);
    expect(verifiedVote.voter).toBe(vote.voter);
  });

  test('Building invalid verified vote fails', () => {
    const vote: Vote = { id: "challenge-1", voter: "address-1", vote: 'yes' };
    expect(() => makeVerified(vote, 0, testToken(1)))
      .toThrow(new RegExp('^Balance of verified vote cant be zero or negative'));

    expect(() => makeVerified(vote, -1, testToken(1)))
      .toThrow(new RegExp('^Balance of verified vote cant be zero or negative'));

    expect(() => makeVerified(vote, 111, testToken(0)))
      .toThrow(new RegExp('^Weight of vote token is missing or negative'));

    expect(() => makeVerified(vote, 111, testToken(-2)))
      .toThrow(new RegExp('^Weight of vote token is missing or negative'));
  });

  test('Make vote token', () => {
    expect(() => VoteToken.new("", 1, 'linear'))
      .toThrow(new RegExp('^Resource address of vote token is empty'));

    expect(() => VoteToken.new("addr", 0, 'linear'))
      .toThrow(new RegExp('^Weight of vote token is missing or negative'));

    expect(() => VoteToken.new("addr", -1, 'linear'))
      .toThrow(new RegExp('^Weight of vote token is missing or negative'));
  });
});

type TokenData = { resourceAddress: string, weight: number, powerFormula: PowerFormula }
const voteTokenData: TokenData =
{
  resourceAddress: "resource_address",
  weight: 1,
  powerFormula: 'linear'
};


const linearData = (resourceAddress: string, weight: number): TokenData => {
  return {
    resourceAddress: resourceAddress,
    weight: weight,
    powerFormula: 'linear'
  };
};

const testToken = (weight: number) => VoteToken.new("not_matter", weight, 'linear');
