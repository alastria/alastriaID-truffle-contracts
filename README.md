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

### 3.- Libs

The previous contracts use some libraries which are:

|Contract |	What it does |
| ------------- |:-------------:|
|Eidas.sol|	It manages Eidas level of assurance for credentials |
|Owned.sol|	It assures that just the account which deployed a contract can update the version |

## Deploy Contracts
In this section it will be possible to see how to work with Smart Contracts in different environments which are: Remix, Ganache + Truffle and in a test environment

### Remix
To work with remix, first of all you need to have installed remixd in your system, for this, you have to write the following command:
`` npm i -g @remix-project/remixd `` doing this you have remixd installed. Once is done you have to write the next command to run the daemon pointing to the directory where the smart contracts are: 
``
remixd -s /home/ubuntu/Escritorio/temp-alastriaID-truffle-contracts/contracts/ http://remix.ethereum.org
``
