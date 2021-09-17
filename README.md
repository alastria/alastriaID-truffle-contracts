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

### 4.- NameService
|Contract |	What it does |
| ------------- |:-------------:|
|AlastriaNameService.sol|	It creates the first entity to work with the rest of functionalities of Alastria Identity |


## Deploy Contracts
In this section it will be possible to see how to work with Smart Contracts in different environments which are: Remix, Ganache + Truffle and in a test environment. It will be explained for cases where you want to use your own scripts and in case you want to use the scripts you can find in the package.json file

### Own Scripts

#### Remix
To work with remix, first of all you need to have installed remixd in your system, for this, you have to write the following command:
`` npm i -g @remix-project/remixd `` doing this you have remixd installed. Once is done you have to write the next command to run the daemon pointing to the directory where the smart contracts are: 
``
remixd -s /home/ubuntu/Escritorio/temp-alastriaID-truffle-contracts/contracts/ http://remix.ethereum.org
``
Once it is done the previous step, in your browser you have to type remix.ethereum.org and you have to connect the Remixd plugin

![Remixd Plugin](https://github.com/cmoralesdiego/images/blob/main/CaptureRemixdplugin.JPG)

Done this step, you have to verify if in your console appears remix logs like this ones

````
[WARN] You can only connect to remixd from one of the supported origins.
[WARN] Any application that runs on your computer can potentially read from and write to all files in the directory.
[WARN] Symbolic links are not forwarded to Remix IDE

Wed Jun 02 2021 16:29:18 GMT+0200 (GMT+02:00) remixd is listening on 127.0.0.1:65520
[WARN] You may now only use IDE at http://remix.ethereum.org to connect to that instance
setup notifications for /home/ubuntu/Escritorio/temp-alastriaID-truffle-contracts/contracts/

````
As well of you click on the first icon where the smart contracts are, they will appear on this tab.
![Remix Contracts](https://github.com/cmoralesdiego/images/blob/main/CaptureContracts.JPG)

Then you can work with the Smart Contracts, deploying firstly AlastriaIdentityManager

#### Ganache + Truffle
If you want to work with Ganache and truffle. After installing them, you need to have the ganache configured as if you are in the Alastria Network, for this you need to configure the ganache in this way
![Ganache config](https://github.com/cmoralesdiego/images/blob/main/CaptureGanache.JPG)

### Repository Scripts
This repository has in package.json some scripts which are very useful in case you don't want to loose time installing things, but it is important to have installed docker in your system.

To install all content from package.json, inside the repo, just run ``npm i`` , once it is executed you can run the following scripts through npm run command:  
**test**: To test contracts  
**coverage**:To run the script coverage-verify which checks the coverage of the Smart Contracts  
**compile**: To compole the Smart Contracts  
**migrateToRedT** : To run the first three migrations in T network. The first three consist on:  
  - 1_initial_migration.js which is the initial one which is deployed in all projects which are used with Truffle
  - 2_deploy_libraries.js which is used to deploy Eidas.sol
  - 3_deploy_aid_contracts.js which is used to deploy all aid Smart Contracts and safe the addresses of the Smart Contracts on file addresses.json
**initRedT** : To initialize the Smart Contracts in T network. All of them are initialized with 0x0000000000000000000000000000000000000001. For this, it is used the migration called 4_initialize_contracts.js  
**deployAnsRedT**: To run migration related to AlastriaNameService in T network. With it, you will be able to generate the proxy address and add the first Entity. For this, it is used the migration called 5_deploy_ans_contracts.js
**updateRedT**: To make upgradeables Smart Contracts from T network. For this, it is used the migration called 6_update_logic.js  
**migrateToRedB**: To run the first three migrations in Besu network. The first three consist on:  
  - 1_initial_migration.js which is the initial one which is deployed in all projects which are used with Truffle
  - 2_deploy_libraries.js which is used to deploy Eidas.sol
  - 3_deploy_aid_contracts.js which is used to deploy all aid Smart Contracts and safe the addresses of the Smart Contracts on file addresses.json  
**initRedB**  To initialize the Smart Contracts in B network. All of them are initialized with 0x0000000000000000000000000000000000000001. For this, it is used the migration called 4_initialize_contracts.js  
**deployAnsLocal**:To run migration related to AlastriaNameService in local network. With it, you will be able to generate the proxy address and add the first Entity. For this, it is used the migration called 5_deploy_ans_contracts.js  
**updateLocal**: To make upgradeables Smart Contracts from Local network. For this, it is used the migration called 6_update_logic.js    
**lint**: Linter to identify and fix Style & Security issues in Solidity   
**remixd**: To run remixd and run contracts in Remix  
**dockerTestnetRun**: Run docker with ethereum node in port 8545  
**dockerTestnetStop**: Stop and remove docker with ethereum node  
**dockerTestnerLogs**: Get logs from docker with ethereum node  
**dockerTestnetConsole**: Go inside docker to make an attachment and work with geth console.  

As well after running the npm i, a version of truffle is installed. This one is the **5.1.53** and if you are a great Truffle supporter you can work with it to deploy the smart contracts.

### Configurations
In order to run the project in different types of Network, there are some configurations to take into account. There are the following ones:  
**Node in T Network has the following IP address**: **http://63.33.206.111/rpc**  
**Node in B Network has the following IP address**: **http://63.33.206.111:8545**   
Once it is know the previous aspects, in the truffle-config file there are some possibilities to deploy the Smart Contracts which are the next ones:  
**local-admin**: Which work with the local network and the admin account  
**local-first-id**: Which work with the local network and a service provider  
**red-t-identity-admin**: Which works with the t-network node and the admin account  
**red-t-first-id**: Which works with the t-network node and a service provider  
**red-b-identity-admin**: Which works with the b-network node and the admin acount  
**red-b-first-id**: Which works with the b-network node and a service provider  

Both accounts are the following ones:  
**firstIdentityWallet**: "0x643266eb3105f4bf8b4f4fec50886e453f0da9ad"  
**adminAccount**: "0x6e3976aeaa3A59E4AF51783CC46EE0fFabC5DC11"  
And their respective private keys are stored in the accounts folder
