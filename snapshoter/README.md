# Snapshot data querying

Library to make balance snapshots.

## Current approach

The current approach is to use a bit customized setup of Network Gateway.

Official out-of-the box setup for dApp can be found on [this image](https://docs.radixdlt.com/main/node-and-gateway/_images/network-gateway-deployment.png) in [documentation](https://docs.radixdlt.com/main/node-and-gateway/network-gateway-setup.html). Parts that required for snapshot polling prototype are `Full Node`, `Data Aggregator` and `Postgres DB`. To query data from the database we decided to use own simple service/library instead of Gateway. The reasons are:
- Gateway API method, which can be used to query historical balance for the account, has limit on amount of addresses (about 10) that can be queried in a single request. Also it queries and returns a lot of data (first from database and then over the wire), that are not required to make snapshot polling to work
- Depending on how snapshot polling will be integrated into frontend, we can provide TS/JS SDK instead of REST API backend, to remove one layer of IO for better throughput

## Requirements

Hardware and software requirements are derived from [official requirements of Network Gateway](https://docs.radixdlt.com/main/node-and-gateway/network-gateway-setup-custom-requirements.html).

TLDR for production environment:
- `Node`: c5.2xlarge or equivalent, vCPU - 8, RAM - 16 GB, storage - SSD 200 GB, network - up to 10 Gbps, Ubuntu [20.04.2.0](https://releases.ubuntu.com/20.04/)
- `Data Aggregator` : vCPU - 2, RAM - 4 GB. 
    - Aggregator reads data from Node and writes to Postgres. Only single aggregator should perform writing at a time
- Postgres: vCPU 2, RAM - 30 GB, storage - 500 GB
    - It is recommended to run database on dedicated host
    - It is recommended to have separated replicas for aggregator and snapshot polling client (i.e. for writes and reads respectively). One write replica and necessary amount of read replicas
- Snapshot client: depends on the way it will be integrated. TS database query layer itself is very simple and performant - probably no more than 1 vCPU and 1 Gb of RAM under high load. It is stateless, so it is possible to run more than one if required.

For development purposes the whole stack can be run on the single machine with decent CPU under 40-60 Gb of space and 16 Gb RAM.

## Docker compose setup

`docker compose` setup to run all required parts that already preconfigured for tests and development can be found in [deploy](./deploy/) dir. Pleas see [deployment docs](./deploy/README.md) for instructions.



## Database queries

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

## Further considerations:
- Aggregator reads a lot of data from the node that takes space, but not required for snapshot polling. I suppose, it possible to save a lot of space by making own aggregator, but this task could be pretty time consuming