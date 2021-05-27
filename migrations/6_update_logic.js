const fs = require('fs');
const TruffleConfig = require('@truffle/config');

const Proxy = artifacts.require(
  './contracts/openzeppelin/upgradeability/AdminUpgradeabilityProxy.sol'
);
const Eidas = artifacts.require('contracts/libs/Eidas.sol');
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

module.exports = async function (deployer) {
  const config = TruffleConfig.detect().env;
  const addresses = JSON.parse(fs.readFileSync('./addresses.json'));
  // await deployer.link(Eidas, AlastriaIdentityIssuer);
  await deployer.link(Eidas, AlastriaIdentityManager);

  const proxyCredentialRegistry = await Proxy.at(addresses[config.credential]);
  const credentialRegistry = await AlastriaCredentialRegistry.new();
  await proxyCredentialRegistry.upgradeTo(credentialRegistry.address);

  const proxyPresentationRegistry = await Proxy.at(
    addresses[config.presentation]
  );
  const presentationRegistry = await AlastriaPresentationRegistry.new();
  await proxyPresentationRegistry.upgradeTo(presentationRegistry.address);

  const proxyPublicKeyRegistry = await Proxy.at(addresses[config.publicKey]);
  const publicKeyRegistry = await AlastriaPublicKeyRegistry.new();
  await proxyPublicKeyRegistry.upgradeTo(publicKeyRegistry.address);

  const proxyIdentityManager = await Proxy.at(addresses[config.manager]);
  const identityManager = await AlastriaIdentityManager.new();
  await proxyIdentityManager.upgradeTo(identityManager.address);
};
