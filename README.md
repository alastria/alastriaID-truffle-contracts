# WIP  temp-alastriaID-truffle-contracts --- 

## **What is does?**

Smart Contracts are the key point to work with the Alastria Identity Ecosystem. Without this part the whole ecosystem will not work, so it is very important to be sure that this repository is installed and the Smart Contracts are deployed properly on the blockchain.

All contracts which are placed here are the following ones:

### 1.- IdentityManager

| Contract |	What it does |
| ------------- |:-------------:|
|AlastriaIdentityManager.sol|It generates access tokens, creates identities, deploys an AlastriaProxy for each identity and sends transactions through the proxy of the sender |
|AlastriaProxy.sol |It is the Alastria ID itself. Only receives transactions from the IdentityManager and resends them to the target |
|AlastriaIdentityIssuer.sol |It keeps a registry of the issuers identities |
|AlastriaIdentityServiceProvider.sol |It keeps a registry of the service providers identities |
|AlastriaIdentityEntity.sol |It keeps a registry of the entities |

### 2.- Registry

|Contract |	What it does |
| ------------- |:-------------:|
|AlastriaCredentialRegistry.sol|	It manages all the credentials and keeps the registry and the status |
|AlastriaPresentationRegistry.sol |	It manages all the presentations and keeps the registry and the status |
|AlastriaPublicKeyRegistry.sol |	It manages all the public keys and keeps the registry |
