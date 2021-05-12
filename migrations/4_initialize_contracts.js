const fs = require('fs');
const TruffleConfig = require('@truffle/config');

const AlastriaIdentityManager = artifacts.require(
  'contracts/identityManager/AlastriaIdentityManager.sol'
);
const AlastriaIdentityEntity = artifacts.require(
  'contracts/identityManager/AlastriaIdentityEntity.sol'
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

  try {
    credentialRegistry = await AlastriaCredentialRegistry.at(
      addresses[config.credential]
    );
    let tx = await credentialRegistry.initialize(
      '0x0000000000000000000000000000000000000001'
    );
    console.log(
      `Credential registry initilized in ${tx.receipt.transactionHash}`
    );

    presentationRegistry = await AlastriaPresentationRegistry.at(
      addresses[config.presentation]
    );
    tx = await presentationRegistry.initialize(
      '0x0000000000000000000000000000000000000001'
    );
    console.log(
      `Presentation registry initilized in ${tx.receipt.transactionHash}`
    );

    publicKeyRegistry = await AlastriaPublicKeyRegistry.at(
      addresses[config.publicKey]
    );
    tx = await publicKeyRegistry.initialize(
      '0x0000000000000000000000000000000000000001'
    );
    console.log(
      `Public key registry initilized in ${tx.receipt.transactionHash}`
    );

    identityManager = await AlastriaIdentityManager.at(
      addresses[config.manager]
    );
    tx = await identityManager.initialize(
      addresses[config.credential],
      addresses[config.publicKey],
      addresses[config.presentation],
      config.firstIdentityWallet
    );
    console.log(`Identity manager initilized in ${tx.receipt.transactionHash}`);

    identityEntity = await AlastriaIdentityEntity.at(
      addresses[config.identityEntity]
    );
    tx = await identityEntity.initialize(
      config.firstIdentityWallet
    );
    console.log(`Identity Entity initilized in ${tx.receipt.transactionHash}`);
  } catch (err) {
    console.log('ERROR:', err);
    callback(err, null);
  }

  console.log('Contracts initialized');
  callback(null);
};
