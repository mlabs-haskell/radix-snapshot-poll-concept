import { ResultAsync, errAsync, okAsync } from 'neverthrow'
import { BalanceInfo, OwnerAddress, Snapshot, Snapshots, StateVersion, TokenAddress } from './types'
import { Row, Sql } from 'postgres'

export const initDbSnapshots =
  (sql: Sql): Snapshots => {
    return {
      makeSnapshotV1: querySnapshotV1(sql),
      makeSnapshotV2: querySnapshotV2(sql),
      currentState: currentState(sql),
      ownerKeys: queryOwnerKeys(sql),
    }
  }

const querySnapshotV1 = (sql: Sql) => (tokenAddress: TokenAddress, stateVersion: StateVersion) => {
  const pendingQuery = sql`
      with token_res_id as (select id from entities where address = ${tokenAddress}),
           required_state as (select entity_id,
                              max(from_state_version) as state_version
                              from entity_resource_aggregated_vaults_history,
                                   token_res_id
                              where resource_entity_id = token_res_id.id
                                and from_state_version <= ${stateVersion} 
                              group by entity_id
                             )
      select eravh.from_state_version,
             eravh.entity_id,
             eravh.resource_entity_id,
             eravh.balance,
             es.address as owner_address
      from entity_resource_aggregated_vaults_history eravh,
           entities es,
           required_state,
           token_res_id
      where eravh.entity_id = required_state.entity_id
            and eravh.from_state_version = required_state.state_version
            and eravh.resource_entity_id = token_res_id.id
            and eravh.entity_id = es.id
      `
  const result = //TODO: maybe verify, that all rows have same `resource_entity_id`, which represents current token
    ResultAsync.fromPromise(pendingQuery, (e: unknown) => e as Error)
      .map((rowList) => rowList.map(dbRowToBalanceInfo(tokenAddress)))
      .map((bs) => Snapshot.fromBalances(stateVersion, bs))

  return result
}

const querySnapshotV2 =
  (sql: Sql) =>
    (tokenAddress: TokenAddress, stateVersion: StateVersion, owners: OwnerAddress[]) => {
      const pendingQuery = sql`
  with accounts_ids as (select id, address
                        from entities
                        where address in ${sql(owners)}
                       ),
       token_res_id as (select id
                        from entities
                        where address = ${tokenAddress}
                       ),
       required_state as (select entity_id,
                                 max(from_state_version) as state_version
                          from entity_resource_aggregated_vaults_history,
                               token_res_id
                          where resource_entity_id = token_res_id.id
                            and from_state_version <= ${stateVersion}
                            and entity_id in (select id from accounts_ids)
                          group by entity_id
                         )
       select eravh.from_state_version,
              eravh.entity_id          as owner_id,
              eravh.resource_entity_id as token_id,
              eravh.balance,
              accounts_ids.address as owner_address
       from required_state,
            entity_resource_aggregated_vaults_history eravh,
            token_res_id,
            accounts_ids
       where required_state.entity_id = eravh.entity_id
             and required_state.state_version = eravh.from_state_version
             and eravh.resource_entity_id = token_res_id.id
             and eravh.entity_id = accounts_ids.id
      `
      const result = //TODO: maybe verify, that all rows have same `resource_entity_id`, which represents current token
        ResultAsync.fromPromise(pendingQuery, (e: unknown) => e as Error)
          .map((rowList) => rowList.map(dbRowToBalanceInfo(tokenAddress)))
          .map((bs) => Snapshot.fromBalances(stateVersion, bs))

      return result
    }

const dbRowToBalanceInfo = (tokenAddress: TokenAddress) => (row: Row): BalanceInfo => {
  return {
    tokenAddress: tokenAddress,
    ownerAddress: row.owner_address,
    fromStateVersion: row.from_state_version,
    balance: row.balance
  }
}

/** Analogous to the way how official Gateway API gets current state.
 *  See https://github.com/radixdlt/babylon-gateway/blob/99d6506f9f1d9bfbfc73ce881f1b9057a5962900/src/RadixDlt.NetworkGateway.PostgresIntegration/DbQueryExtensions.cs#L73-L79
*/
const currentState =
  (sql: Sql) => () => {
    const pendingQuery = sql`
      select state_version, epoch, round_in_epoch
      from ledger_transactions
      order by state_version desc
      limit 1;
      `
    const result =
      ResultAsync.fromPromise(pendingQuery, (e: unknown) => e as Error)
        .andThen(rows => {
          const state = rows.pop();
          return state ?
            okAsync({
              stateVersion: state.state_version,
              epoch: state.epoch,
              roundInEpoch: state.round_in_epoch
            })
            : errAsync(new Error("Could not get latest state. It is possible only if DB table is empty."))
        })
    return result;
  }

const queryOwnerKeys = (sql: Sql) => (ownerAddress: OwnerAddress) => {
  const pendingQuery = sql`
    WITH eids AS (
        SELECT id 
        FROM entities 
        WHERE address = ${ownerAddress}
    )

    SELECT emh.* 
    FROM entity_metadata_history emh
    JOIN eids ON emh.entity_id = eids.id
    WHERE emh.key = 'owner_keys';
  `
  
  const result =
    ResultAsync.fromPromise(pendingQuery, (e: unknown) => e as Error)
      .andThen(rows => {
        const row = rows.pop();
        return row ?
          okAsync(new Uint8Array(row.value))
          : errAsync(new Error("Could not get owner keys."))
      })

  return result;
}
