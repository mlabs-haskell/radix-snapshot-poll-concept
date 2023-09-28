import fs from "fs";
import { PollsJsonRepo } from "../src/repositories/json-repos";
import voteController from "../src/controllers/vote";
import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";
import { ResultAsync, okAsync } from "neverthrow";
import { RolaError } from "../src/services/rola/rola";
import { Poll, newPoll } from "../src/domain/types";

const DB_PATH = "./test_db.json";
const ROLA_RESPONSE = 'account_tdx_e_some_hash';

const killJsonDb = () => {
  fs.unlinkSync(DB_PATH)
}

describe('Vote tests', () => {

  afterAll(() => {
    killJsonDb();
  });

  test('Vote', async () => {
    const pollsRepo = PollsJsonRepo(DB_PATH);
    pollsRepo.addPoll(TEST_POLL);
    const dummyRola = (_challenge: SignedChallenge): ResultAsync<string, RolaError> => {
      return okAsync(ROLA_RESPONSE)
    }

    await voteController(pollsRepo, dummyRola)(POLL_PARAMS);
    const votedPoll = pollsRepo.getById(TEST_POLL.id)!;
    expect(votedPoll.votes.length).toBe(1);
    expect(votedPoll.votes[0].id).not.toBe(undefined);
    expect(votedPoll.votes[0].voter).toBe(POLL_PARAMS.signedChallenge.address);
    expect(votedPoll.votes[0].vote).toBe(POLL_PARAMS.vote);
  });
});

const TEST_POLL: Poll = newPoll(
  "Org",
  "Title",
  "Description",
  { resourceAddress: "resource_address", weight: 1 },
  1
)


const POLL_PARAMS =
  JSON.parse(
    `{
  "pollId": "${TEST_POLL.id}",
  "vote": "yes",
  "signedChallenge": {
    "proof": {
      "publicKey": "some_hash",
      "signature": "some_signature",
      "curve": "curve25519"
    },
    "address": "${ROLA_RESPONSE}",
    "challenge": "some_challenge",
    "type": "account"
  }
}`);
