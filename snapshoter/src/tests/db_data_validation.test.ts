import { ValidRecord, validateRecords } from "../db_snapshoter/validation";
import { Row, RowList } from "postgres";

describe('Snapshot invariants', () => {

  test('validating correct database snapshot data', () => {
    const expectedValidRecords: ValidRecord[] = [
      {
        from_state_version: "1",
        owner_address: "a1",
        token_id: "11",
        balance: "1",
      },
      {
        from_state_version: "1",
        owner_address: "a2",
        token_id: "11",
        balance: "2",
      }
    ]
    expect(validateRecords(GOOD_ROWS)).toStrictEqual(expectedValidRecords);
  });

  test('validating bad database snapshot data', () => {
    expect(() => validateRecords(BAD_ROWS))
      .toThrow(new RegExp('^Inconsistent data was returned from the database'));
  });

});

const GOOD_ROWS: RowList<Row[]> = JSON.parse(`
[
  {
    "from_state_version": "1",
    "owner_id": "1",
    "token_id": "11",
    "balance": "1",
    "owner_address": "a1"
  },
  {
    "from_state_version": "1",
    "owner_id": "2",
    "token_id": "11",
    "balance": "2",
    "owner_address": "a2"
  }
]
`);

const BAD_ROWS: RowList<Row[]> = JSON.parse(`
[
  {
    "from_state_version": "1",
    "owner_id": "1",
    "token_id": "12",
    "balance": "1",
    "owner_address": "a1"
  },
  {
    "from_state_version": "1",
    "owner_id": "2",
    "token_id": "11",
    "balance": "2",
    "owner_address": "a2"
  }
]
`);
