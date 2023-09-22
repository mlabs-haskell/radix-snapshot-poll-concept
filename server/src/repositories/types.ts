import { Poll } from "../domain/types"

export interface PollsRepo {
  getById(pollId: string): Poll | undefined
  addPoll(newPoll: Poll): void
  getAll(): Poll[]
}