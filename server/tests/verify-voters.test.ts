import { VerifyVoters } from "../src/services/verify-voters";
import { mkTestPoll, testShapshoter, testState } from "./common-mocks";

describe('Verify voters tests', () => {

  test('Verify voters', async () => {
    const verifyVoters = VerifyVoters(testShapshoter);
    const result = await verifyVoters(mkTestPoll(1));
    expect(result.isOk()).toBe(true);
    const verifiedVotes = result._unsafeUnwrap();
    expect(verifiedVotes.verifiedAt).toBe(testState);
    expect(verifiedVotes.votes[0].voter).toBe('a0');
    expect(verifiedVotes.votes[0].balance).toBe(1);
    expect(verifiedVotes.votes[1].voter).toBe('a3');
    expect(verifiedVotes.votes[1].balance).toBe(13000);
  });
});
