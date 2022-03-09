/**
 *
 */
const fs = require("fs");
const keythereum = require('keythereum');
const HDWalletProvider = require("@truffle/hdwallet-provider");

/**
 * Hyperledger BESU and new versions of GoQuorum needs accounts generated from web3 application
 *
 * Use https://iancoleman.io/bip39/ for generate a .secret file with
 * mnemonic phrase
 */
// const mnemonic = fs.readFileSync(".secret").toString().trim();

/**
 * Account for AlastriaT && AlastriaB Network
 *
 * Earlier versions of GoQuorum uses local accounts, so cryptographic material
 * is provided by a node
 */

// TODO: change to process.env
const password = 'Passw0rd';
const adminPath = './accounts/admin-6e3976aeaa3a59e4af51783cc46ee0ffabc5dc11';
const firstId = './accounts/serviceProvider-643266eb3105f4bf8b4f4fec50886e453f0da9ad'
const adminKey = keythereum.recover(password, JSON.parse(fs.readFileSync(adminPath, 'utf8'))).toString('hex');
const firstIdKey = keythereum.recover(password, JSON.parse(fs.readFileSync(firstId, 'utf8'))).toString('hex');

const localNode = "http://127.0.0.1:8545";
const tNetworkNode = "http://63.33.206.111/rpc";
const bNetworkNode = "http://63.33.206.111:8545";

module.exports = {

  /**
   * $ npm install (please, be sure you are in the correct branch. Otherwise, remove "node_modules/" directory and run the npm install again)
   * $ npm run migrateToRed[TB]
   * $ npm run initRed[TB] (this process seem to hung at the end. Stop it with control + C after sucess message. Related with the last "callback(null)" function )
   * $ npm run deployAnsRed[TB]
   * $ npm run updateRed[TB]
   */

  networks: {
    'local-admin': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(adminKey, localNode);
      },
      network_id: "*",
    },
    'local-first-id': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(firstIdKey, localNode);
      },
      network_id: "*",
    },

    // alastriaT network
    'red-t-identity-admin': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(adminKey, tNetworkNode);
      },
      network_id: "*",
    },
    'red-t-first-id': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(firstIdKey, tNetworkNode);
      },
      network_id: "*",
    },
    
    // alastriaB network
    'red-b-identity-admin': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(adminKey, bNetworkNode);
      },
      network_id: "2020",
    },
    'red-b-first-id': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(firstIdKey, bNetworkNode);
      },
      network_id: "2020",
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.17",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "byzantium"
      }
    }
  },

  env: {
    firstIdentityWallet: "0x643266eb3105f4bf8b4f4fec50886e453f0da9ad",
    adminAccount: "0x6e3976aeaa3A59E4AF51783CC46EE0fFabC5DC11",
    manager: "AlastriaIdentityManager",
    nameService: "AlastriaNameService",
    presentation: "AlastriaPresentationRegistry",
    credential: "AlastriaCredentialRegistry",
    publicKey: "AlastriaPublicKeyRegistry",
    serviceProvider: "AlastriaServiceProvider",
    identityIssuer: "AlastriaIdentityIssuer",
    eidas: "Eidas"
  }
}
