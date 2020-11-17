/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const fs = require('fs');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const keythereum = require('keythereum');

// TODO: change to process.env
const password = 'Passw0rd';
const adminPath = './accounts/admin-6e3976aeaa3a59e4af51783cc46ee0ffabc5dc11';
const firstId = './accounts/serviceProvider-643266eb3105f4bf8b4f4fec50886e453f0da9ad'
const adminKey = keythereum.recover(password, JSON.parse(fs.readFileSync(adminPath, 'utf8'))).toString('hex');
const firstIdKey = keythereum.recover(password, JSON.parse(fs.readFileSync(firstId, 'utf8'))).toString('hex');

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Local development network, usually Ganache
    'development': {
      host: "localhost:8545",
      port: 8545,
      network_id: "*"
    },
    // Alastria red T connection trough identity node
    'red-t': {
      host: "35.181.78.28", //identity node
      port: 22000,
      network_id: "*",
      gas: 0xfffffff,
      gasPrice: 0x0,
      from: "0x6e3976aeaa3a59e4af51783cc46ee0ffabc5dc11"
    },
    // Local with provider
    'local-admin': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(adminKey, "http://127.0.0.1:8545");
      },
      network_id: "*",
    },
    // Local with provider
    'local-first-id': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(firstIdKey, "http://127.0.0.1:8545");
      },
      network_id: "*",
    },
    // Alastria red T connection with provider
    'red-t-identity-admin': {
      provider: () => {
        return new HDWalletProvider(adminKey, "http://35.181.78.28:22000");
      },
      network_id: "*",
    },
    // Alastria red T connection with provider
    'red-t-first-id': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(firstIdKey, "http://35.181.78.28:22000");
      },
      network_id: "*",
    },
    // Alastria reb B connection with provider
    'red-b-identity-admin': {
      provider: () => {
        return new HDWalletProvider(adminKey, "");
      },
      network_id: "*",
    },
    // Alastria red T connection with provider
    'red-b-first-id': {
      gasPrice: 0x0,
      provider: () => {
        return new HDWalletProvider(firstIdKey, "");
      },
      network_id: "*",
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.17", // A version or constraint - Ex. "^0.5.0"
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "byzantium" // To be compatible with red t
      }
    }
  },

  env: {
    firstIdentityWallet: "0x643266eb3105f4bf8b4f4fec50886e453f0da9ad",
    adminAccount: "0x6e3976aeaa3A59E4AF51783CC46EE0fFabC5DC11",
    contractInfoPath: "./address.md",
    addressPosition: 2,
    manager: "AlastriaIdentityManager",
    identityEntity: "AlastriaIdentityEntity",
    presentation: "AlastriaPresentationRegistry",
    credential: "AlastriaCredentialRegistry",
    publicKey: "AlastriaPublicKeyRegistry",
    serviceProvider: "AlastriaServiceProvider",
    identityIssuer: "AlastriaIdentityIssuer",
    eidas: "Eidas"
  }
}
