import { Poll } from "../domain/types"

export interface PollsRepo {
  getById(pollId: string): Poll | undefined
  addPoll(newPoll: Poll): void
  getAll(): Poll[]
  update(poll: Poll): void
}

export interface ChallengesRepo {
  newChallenge(): string
  existsAndValid(input: string): boolean
}
