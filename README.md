# [WIP] temp-alastriaID-truffle-contracts 

## What is does?

Smart Contracts are the key point to work with the Alastria Identity Ecosystem. Without this part the whole ecosystem will not work, so it is very important to be sure that this repository is installed and the Smart Contracts are deployed properly on the blockchain.

All contracts which are placed here are the following ones:

### 1.- IdentityManager

| Contract | What it does |
|:---      |:---          |
| AlastriaIdentityManager.sol| It generates access tokens, creates identities, deploys an AlastriaProxy for each identity and sends transactions through the proxy of the sender |
| AlastriaProxy.sol | It is the Alastria ID itself. Only receives transactions from the IdentityManager and resends them to the target |
| AlastriaIdentityIssuer.sol | It keeps a registry of the issuers identities |
| AlastriaIdentityServiceProvider.sol | It keeps a registry of the service providers identities |
| AlastriaIdentityEntity.sol | It keeps a registry of the entities |

### 2.- Registry

|Contract |	What it does |
|:---     |:---          |
| AlastriaCredentialRegistry.sol | It manages all the credentials and keeps the registry and the status |
| AlastriaPresentationRegistry.sol |	It manages all the presentations and keeps the registry and the status |
| AlastriaPublicKeyRegistry.sol | It manages all the public keys and keeps the registry |

### 3.- Libs

The previous contracts use some libraries which are:

| Contract | What it does |
|:---      |:---          |
| Eidas.sol | It manages Eidas level of assurance for credentials |
| Owned.sol | It assures that just the account which deployed a contract can update the version |


# Node Configuration

Let's allow connection from truffle to AlastriaT / AlastriaB networks.

*Note*: Please, keep in mind that connections to this ports should be controled in aplication or connection layer, using `nginx` or a `firewall`.

## AlastriaT

Enable de following args in `geth` command line:
```
[...]
--rpc --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul --rpcport 22000  --rpccorsdomain http://localhost:8000 --wsorigins * 
[...]
```

## AlastriaB

Enable the RPC connections from `truffle`, upgrading default configuration in `config.toml`:
```
[...]
rpc-http-api=["ADMIN","ETH","NET","WEB3"]
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port="8545"
rpc-http-cors-origins=["all"]
host-whitelist=["*"]
[...]
```

