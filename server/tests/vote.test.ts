import fs from "fs";
import { PollsJsonRepo } from "../src/repositories/json-repos";
import voteController from "../src/controllers/vote";
import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";
import { ResultAsync, okAsync } from "neverthrow";
import { RolaError } from "../src/services/rola/rola";
import { mkEmptyPoll, mkTestPoll, testShapshoter } from "./common-mocks";
import { closePoll } from "../src/domain/types";
import { VerifyVoters } from "../src/services/verify-voters";

const DB_PATH = "./test_db.json";

const killJsonDb = () => {
  fs.unlinkSync(DB_PATH)
}

describe('Vote tests', () => {

  afterAll(() => {
    killJsonDb();
  });

  test('Vote', async () => {
    const pollsRepo = PollsJsonRepo(DB_PATH);
    const emptyPoll = mkEmptyPoll(closingTime);
    const pollParams = mkParams(emptyPoll.id);

    pollsRepo.addPoll(emptyPoll);
    const dummyRola = (_challenge: SignedChallenge): ResultAsync<string, RolaError> => {
      return okAsync(rolaResponse)
    };

    await voteController(pollsRepo, dummyRola)(pollParams);
    const votedPoll = pollsRepo.getById(emptyPoll.id)!;
    expect(votedPoll.votes.length).toBe(1);
    expect(votedPoll.votes[0].id).not.toBe(undefined);
    expect(votedPoll.votes[0].voter).toBe(pollParams.signedChallenge.address);
    expect(votedPoll.votes[0].vote).toBe(pollParams.vote);
  });

  test('Vote on closed poll fails', async () => {
    const pollsRepo = PollsJsonRepo(DB_PATH);
    const newPoll = mkTestPoll(1);
    const pollParams = mkParams(newPoll.id);
    const mockVerifyVoters = (await VerifyVoters(testShapshoter)(newPoll))._unsafeUnwrap();
    const closedPoll = closePoll(newPoll, mockVerifyVoters);
    pollsRepo.addPoll(closedPoll);
    const dummyRola = (_challenge: SignedChallenge): ResultAsync<string, RolaError> => {
      return okAsync(rolaResponse)
    };

    voteController(pollsRepo, dummyRola)(pollParams)
      .catch(e => expect(e.message).toMatch(`Poll is closed`));
  });
});

// currently it is possible to vote till poll is closed explicitly,
// even if closing time is reached, but close function was not called
const closingTime = 1;

const rolaResponse = 'account_tdx_e_some_hash';
const mkParams = (pollId: string) =>
  JSON.parse(
    `{
  "pollId": "${pollId}",
  "vote": "yes",
  "signedChallenge": {
    "proof": {
      "publicKey": "some_hash",
      "signature": "some_signature",
      "curve": "curve25519"
    },
    "address": "${rolaResponse}",
    "challenge": "some_challenge",
    "type": "account"
  }
}`);
