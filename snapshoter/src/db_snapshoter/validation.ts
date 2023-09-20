import { Row, RowList } from "postgres";
import { BalanceInfo, TokenAddress } from "../types";

export interface ValidRecord {
  owner_address: string,
  from_state_version: number,
  balance: number,
  token_id: number,
  resource_entity_id: number
}

export const validateRecords = (rows: RowList<Row[]>): ValidRecord[] => {
  let resourceEntityId: number | undefined = undefined;
  const result: ValidRecord[] = [];

  rows.forEach(r => {
    /* check that all queried balances refers to the same resource_entity_id
     in the aggregator database
    */
    if (resourceEntityId === undefined && result.length === 0) {
      resourceEntityId = r.resource_entity_id;
      result.push(mkBalanceRecord(r));
    } else if (resourceEntityId === r.resource_entity_id) {
      result.push(mkBalanceRecord(r));
    } else {
      throw new Error(
        `Inconsistent snapshot state. While adding balances info resource ID was set to ${resourceEntityId},
        but one of the balances has resource with ID ${r.resource_entity_id}`);
    }
  })

  return result;
}

const mkBalanceRecord = (row: Row): ValidRecord => {
  return {
    owner_address: row.owner_address,
    from_state_version: row.from_state_version,
    balance: row.balance,
    token_id: row.token_id,
    resource_entity_id: row.resource_entity_id,
  }
}
