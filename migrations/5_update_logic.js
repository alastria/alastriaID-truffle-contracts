const fs = require('fs')
const TruffleConfig = require('@truffle/config');
const Proxy = artifacts.require('./contracts/openzeppelin/upgradeability/AdminUpgradeabilityProxy.sol')

module.exports = async function(deployer) {
  const config = TruffleConfig.detect().env;
  const addresses = JSON.parse(fs.readFileSync('./addresses.json'));

  await deployer.link(Eidas, AlastriaIdentityIssuer);
  await deployer.link(Eidas, AlastriaIdentityManager);

  let proxyCredentialRegistry = await Proxy.at(addresses[config.credential]);
  let credentialRegistry = await AlastriaCredentialRegistry.new()
  await proxyCredentialRegistry.upgradeTo(credentialRegistry.address);

  let proxyPresentationRegistry = await Proxy.at(addresses[config.presentation]);
  let presentationRegistry = await AlastriaPresentationRegistry.new()
  await proxyPresentationRegistry.upgradeTo(presentationRegistry.address);

  let proxyPublicKeyRegistry = await Proxy.at(addresses[config.publicKey]);
  let publicKeyRegistry = await AlastriaPublicKeyRegistry.new()
  await proxyPublicKeyRegistry.upgradeTo(publicKeyRegistry.address);

  let proxyIdentityManager = await Proxy.at(addresses[config.manager]);
  let identityManager = await AlastriaIdentityManager.new()
  await proxyIdentityManager.upgradeTo(identityManager.address);
};
