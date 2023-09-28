import { Poll, VerifiedVote, Vote, VoteAggregator, addVote, makeVerified, newPoll } from "../src/domain/types";

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
    const badData1 = { resourceAddress: "", weight: 1 };
    expect(() => newPoll("Test org", "Test title", "Test description", badData1, 42))
      .toThrow(new Error('Error defining vote token: resource address is empty'));

    const badData2 = { resourceAddress: "addr", weight: -1 };
    expect(() => newPoll("Test org", "Test title", "Test description", badData2, 42))
      .toThrow(new RegExp('^Error defining vote token: weight is missing or negative'));
  });

  test('Votes aggregation', () => {
    const aggregator = new VoteAggregator();
    const testVoteYes: Vote = { id: "not_matter", voter: "not_matter", vote: "yes" };
    const testVoteNo: Vote = { id: "not_matter", voter: "not_matter", vote: "no" };
    const vVote1 = makeVerified(testVoteYes, 10, 2);
    const vVote2 = makeVerified(testVoteNo, 10, 2);
    const vVote3 = makeVerified(testVoteNo, 11, 3);

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
    const verifiedVote: VerifiedVote = makeVerified(vote, 111, 2);
    expect(verifiedVote.balance).toBe(111);
    expect(verifiedVote.power).toBe(222);
    expect(verifiedVote.id).toBe(vote.id);
    expect(verifiedVote.vote).toBe(vote.vote);
    expect(verifiedVote.voter).toBe(vote.voter);
  });

  test('Building invalid verified vote fails', () => {
    const vote: Vote = { id: "challenge-1", voter: "address-1", vote: 'yes' };
    expect(() => makeVerified(vote, 0, 1))
      .toThrow(new RegExp('^Balance of verified vote cant be zero or negative'));
    expect(() => makeVerified(vote, -1, 1))
      .toThrow(new RegExp('^Balance of verified vote cant be zero or negative'));
    expect(() => makeVerified(vote, 111, 0))
      .toThrow(new RegExp('^Wight of verified vote cant be zero or negative'));
    expect(() => makeVerified(vote, 111, -2))
      .toThrow(new RegExp('^Wight of verified vote cant be zero or negative'));
    expect(() => makeVerified(vote, 0, 0))
      .toThrow(new RegExp('^Balance of verified vote cant be zero or negative'));
    expect(() => makeVerified(vote, -1, -1))
      .toThrow(new RegExp('^Balance of verified vote cant be zero or negative'));
  });
});

const voteTokenData = { resourceAddress: "resource_address", weight: 1 };
