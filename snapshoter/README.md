# Snapshot data querying

Library to make balance snapshots.

Current setup relies on data aggregator and its database from the [Babylon Gateway](https://github.com/radixdlt/babylon-gateway) tech stack.

[Deployment documentation](./deploy/README.md) has an example of how to run already pre-configured required services using `docker compose`.

## Working with own hosted database directly

Currently snapshot package provides two queries to make snapshots:

<details>
  <summary>To get all owners and balances of some token for specified state version by token name</summary>

  ```sql
  with token_res_id as (select id
                        from entities
                        where address = ?),
       required_state as (select entity_id,
                                max(from_state_version) as state_version
                         from entity_resource_aggregated_vaults_history,
                              token_res_id
                         where resource_entity_id = token_res_id.id
                           and from_state_version <= ?
                         group by entity_id)
  select eravh.from_state_version,
         eravh.entity_id,
         eravh.resource_entity_id,
         eravh.balance,
         es.address
  from entity_resource_aggregated_vaults_history eravh,
       entities es,
       required_state,
       token_res_id
  where eravh.entity_id = required_state.entity_id
    and eravh.from_state_version = required_state.state_version
    and eravh.resource_entity_id = token_res_id.id
    and eravh.entity_id = es.id
  order by from_state_version desc;
  ```

  Where in place of `?` resource address and desired state version can be inserted accordingly. Filtering by address can be also added if needed, to reduce the amount of data to fetch.

  Query breakdown:

  - `token_res_id` sub-query is used to get internal database ID of the resource by specified address
  - `required_state` sub-query is used to get the latest state of the balances of all token holders up to the state version specified by the user. As I understood, `entity_resource_aggregated_vaults_history` tracks all balance changes for each `address + token` pair. `entity_id` - is internal DB ID of the token holder address, and `resource_entity_id` is internal DB ID of the token address. Query gets all balances for all states for desired token, groups them by holder address (`entity_id`) and then for each group gets the result with maximum state version which should be the current state of the balance for the state version provided by the user.
  - The rest of the query serves the purpose to enrich the data received from the `required_state` sub-query. It uses `address + token` pair from `required_state` to identify exact row in  `entity_resource_aggregated_vaults_history` and adds token holders addresses based on `entity_resource_aggregated_vaults_history.entity_id`
</details>

<details>
  <summary>To get owners and balances of some token for specified state version by token name and list of account addresses</summary>

  ```sql
  with accounts_ids as (select id, address
                        from entities
                        where address in ?
  ),
       token_res_id as (select id
                        from entities
                        where address = ?),
       required_state as (select entity_id,
                                 max(from_state_version) as state_version
                          from entity_resource_aggregated_vaults_history,
                               token_res_id
                          where resource_entity_id = token_res_id.id
                            and from_state_version <= ?
                            and entity_id in (select id from accounts_ids)
                          group by entity_id)
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
  ;
  ```
  Where in place of `?` list of account addresses, resource address and desired state version can be inserted accordingly. Filtering by address can be also added if needed, to reduce the amount of data to fetch.
</details>


At the moment, prototype application uses second query when counting votes.

## Making snapshots using Gateway API

The idea was discarded in favor of own DB queries describe above.

Reasons:

- Less communications layers between application and database for better performance
- The Gateway API method, suitable for querying snapshot data, has low limit (was 10 when we tried) on amount of addresses that can be queried at once.
