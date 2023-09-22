import { newPoll } from "../src/domain/types";

describe('Domain models tests', () => {

  test('Build new poll', () => {
    const poll = newPoll("Test org", "Test title", "Test description","token_resource_addrerss", 42);
    expect(poll.closed).toBe(false);
    expect(poll.votes).toStrictEqual([]);
    expect(poll.id).not.toBe("");
    expect(poll.id).not.toBe(undefined);
  });

});