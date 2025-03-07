import createPoll, { CreatePollData } from "../src/controllers/create-poll";
import fs from "fs";
import { PollsJsonRepo } from "../src/repositories/json-repos";

const DB_PATH = "./test_db.json"

const killJsonDb = () => {
  fs.unlinkSync(DB_PATH)
}

describe('Create poll controller tests', () => {

  afterAll(() => {
    killJsonDb();
  });

  test('Create poll', () => {
    const pollsRepo = PollsJsonRepo("./test_db.json")
    const pollData: CreatePollData = {
      orgName: "Test org",
      title: "Test title",
      description: "Test description",
      voteTokenResource: "token_resource_address",
      voteTokenWeight: 1,
      powerFormula: 'linear',
      closes: Date.now() - 1000
    };
    const poll = createPoll(pollsRepo)(pollData);
    expect(poll.closed).toBe(false);
    expect(pollsRepo.getById(poll.id)).toBe(poll);
    expect(pollsRepo.getAll().length).toBe(1);
  });
});
