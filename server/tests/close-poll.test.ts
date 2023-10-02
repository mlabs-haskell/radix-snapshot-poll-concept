import createPoll, { CreatePollData } from "../src/controllers/create-poll";
import fs from "fs";
import { PollsJsonRepo } from "../src/repositories/json-repos";
import { VerifyVoters } from "../src/services/verify-voters";
import { testShapshoter } from "./common-mocks";
import closePollController from "../src/controllers/close-poll";

const DB_PATH = "./test_db.json"

const killJsonDb = () => {
  fs.unlinkSync(DB_PATH)
}

describe('Close poll controller tests', () => {

  afterAll(() => {
    killJsonDb();
  });

  test('Close poll', async () => {
    const { pollsRepo, verifyVoters } = setupServices();

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

    await closePollController(pollsRepo, verifyVoters)(poll.id);

    const expectedToBeClosePoll = pollsRepo.getById(poll.id)!;
    expect(expectedToBeClosePoll.closed).toBe(true);
  });

  test('Can not close poll before closing time', async () => {
    const { pollsRepo, verifyVoters } = setupServices();

    const pollData: CreatePollData = {
      orgName: "Test org",
      title: "Test title",
      description: "Test description",
      voteTokenResource: "token_resource_address",
      voteTokenWeight: 1,
      powerFormula: 'linear',
      closes: Date.now() + 1000000000
    };
    const poll = createPoll(pollsRepo)(pollData);
    expect(poll.closed).toBe(false);

    closePollController(pollsRepo, verifyVoters)(poll.id)
      .catch(e => expect(e.message).toMatch(new RegExp('^Poll can\'t be closed')));
  });

  test('Can not close poll twice', async () => {
    const { pollsRepo, verifyVoters } = setupServices();

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

    await closePollController(pollsRepo, verifyVoters)(poll.id);
    closePollController(pollsRepo, verifyVoters)(poll.id)
      .catch(e => expect(e.message).toMatch(new RegExp('^Poll is already closed')));
  });
});

const setupServices = () => {
  const pollsRepo = PollsJsonRepo("./test_db.json");
  const verifyVoters = VerifyVoters(testShapshoter);
  return { pollsRepo, verifyVoters };
}
