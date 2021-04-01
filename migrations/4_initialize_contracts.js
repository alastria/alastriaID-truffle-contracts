const fs = require('fs');
const TruffleConfig = require('@truffle/config');

const AlastriaIdentityManager = artifacts.require(
  'contracts/identityManager/AlastriaIdentityManager.sol'
);
const AlastriaCredentialRegistry = artifacts.require(
  'contracts/registry/AlastriaCredentialRegistry.sol'
);
const AlastriaPublicKeyRegistry = artifacts.require(
  'contracts/registry/AlastriaPublicKeyRegistry.sol'
);
const AlastriaPresentationRegistry = artifacts.require(
  'contracts/registry/AlastriaPresentationRegistry.sol'
);

module.exports = async function (callback) {
  const addresses = JSON.parse(fs.readFileSync('./addresses.json'));
  const config = TruffleConfig.detect().env;

  if (AlastriaIdentityManager.network_id === '19535753591') {
    web3.personal.unlockAccount(web3.eth.accounts[1], 'Passw0rd');
  }
  try {
    credentialRegistry = await AlastriaCredentialRegistry.at(
      addresses[config.credential]
    );
    let tx = await credentialRegistry.initialize(
      '0x0000000000000000000000000000000000000001'
    );
    console.log(`Credential registry initilized in ${tx.hash}`);

    presentationRegistry = await AlastriaPresentationRegistry.at(
      addresses[config.presentation]
    );
    tx = await presentationRegistry.initialize(
      '0x0000000000000000000000000000000000000001'
    );
    console.log(`Presentation registry initilized in ${tx.hash}`);

    publicKeyRegistry = await AlastriaPublicKeyRegistry.at(
      addresses[config.publicKey]
    );
    tx = await publicKeyRegistry.initialize(
      '0x0000000000000000000000000000000000000001'
    );
    console.log(`Public key registry initilized in ${tx.hash}`);

    identityManager = await AlastriaIdentityManager.at(
      addresses[config.manager]
    );
    tx = await identityManager.initialize(
      addresses[config.credential],
      addresses[config.presentation],
      addresses[config.publicKey],
      config.firstIdentityWallet
    );
    console.log(`Identity manager initilized in ${tx.hash}`);
  } catch (err) {
    console.log(err);
    callback(err, null);
  }

  console.log('Contracts initialized');
  callback(null, true);
};
