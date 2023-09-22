import { DbStore, DbKeys } from "../src/services/db-store";
import createPoll from "../src/controllers/create-poll";
import fs from "fs";
import { PollsJsonRepo } from "../src/repositories/json-repos";
import closePollController from "../src/controllers/close-poll";
import voteController from "../src/controllers/vote";
import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";
import { ResultAsync, okAsync } from "neverthrow";
import { RolaError } from "../src/services/rola/rola";
import { Poll } from "../src/domain/types";

const DB_PATH = "./test_db.json"

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
      return okAsync("some_account_hash")
    }

    const vote = voteController(pollsRepo, dummyRola);
    const res = await vote(POLL_PARAMS);
    console.log("FFFF:", pollsRepo.getById(TEST_POLL.id))
    // const closedPoll = closePollController(dbStore, verifyVoters)
  });
});

const TEST_POLL: Poll = {
  id: "804e79cfb631b7e7c93ac34c0093fa981cf08da18ef8f371de45a8624f34cc5b",
  orgName: "Org",
  title: "Title",
  description: "Description",
  voteTokenResource: "token_res",
  closes: 1,
  closed: false,
  votes: [],

} 

const POLL_PARAMS =
  JSON.parse(
`{
  "pollId": "804e79cfb631b7e7c93ac34c0093fa981cf08da18ef8f371de45a8624f34cc5b",
  "vote": "yes",
  "signedChallenge": {
    "proof": {
      "publicKey": "1de8c90c0544a4aac614a15af83d78a327b4b470afbb6e8910cb793e70550809",
      "signature": "0b34f8b1cfefc035a3f6db75f99fc3da739d4524aa3b86686ecc1f42a47ce44ec40ed39eac2ef6142923f63b1ccf8cd022596490a9bb93b6bb91c6f85fd67c04",
      "curve": "curve25519"
    },
    "address": "account_tdx_e_1296csmtej2t0vfa0njsge5398wg0jkxx6cmree0zfr9a7rrhqv6ngf",
    "challenge": "1a44d7cbda95bf2283553985d81b643aa472756ea553cf9c1385c4863c6f93c1",
    "type": "account"
  }
}`);