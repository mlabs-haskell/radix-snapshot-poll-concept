import { Poll, Vote, addVote, newPoll } from "../src/domain/types";

describe('Domain models tests', () => {

  test('Build new poll', () => {
    const poll = newPoll("Test org", "Test title", "Test description", "token_resource_addrerss", 42);
    expect(poll.closed).toBe(false);
    expect(poll.votes).toStrictEqual([]);
    expect(poll.id).not.toBe("");
    expect(poll.id).not.toBe(undefined);
  });

  test('Add vote', () => {
    const poll: Poll = newPoll("Test org", "Test title", "Test description", "token_resource_addrerss", 42);

    const voteOne: Vote = { id: "challenge-1", voter: "address-1", vote: 'yes' };
    const votedPoll = addVote(poll, voteOne);
    expect(poll).not.toBe(votedPoll);
    expect(votedPoll.votes.length).toBe(1);
    expect(votedPoll.votes[0]).toStrictEqual(voteOne);

    const voteTwo: Vote = { id: "challenge-2", voter: "address-2", vote: 'no' };
    const votedAgainPoll = addVote(votedPoll, voteTwo);
    expect(votedAgainPoll).not.toBe(votedPoll);
    expect(votedAgainPoll).not.toBe(poll);
    expect(votedAgainPoll.votes.length).toBe(2);
    expect(votedAgainPoll.votes[0]).toStrictEqual(voteOne);
    expect(votedAgainPoll.votes[1]).toStrictEqual(voteTwo);
  });
});

