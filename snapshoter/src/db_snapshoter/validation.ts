import { Row, RowList } from "postgres";

export interface ValidRecord {
  from_state_version: string,
  owner_address: string,
  token_id: string,
  balance: string,
}

export const validateRecords = (rows: RowList<Row[]>): ValidRecord[] => {
  let resourceEntityId: number | undefined = undefined;
  const result: ValidRecord[] = [];

  rows.forEach(r => {
    /* check that all queried balances refers to the same resource_entity_id
     in the aggregator database
    */
    if (resourceEntityId === undefined && result.length === 0) {
      resourceEntityId = r.token_id;
      result.push(mkBalanceRecord(r));
    } else if (resourceEntityId === r.token_id) {
      result.push(mkBalanceRecord(r));
    } else {
      throw new Error(
        `Inconsistent data was returned from the database.
         While adding balances info resource ID was set to ${resourceEntityId},
         but one of the balances has resource with ID ${r.resource_entity_id}`);
    }
  })

  return result;
}

const mkBalanceRecord = (row: Row): ValidRecord => {
  return {
    from_state_version: row.from_state_version,
    owner_address: row.owner_address,
    token_id: row.token_id,
    balance: row.balance,
  }
}
