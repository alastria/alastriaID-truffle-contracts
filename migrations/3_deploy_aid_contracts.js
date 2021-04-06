const fs = require('fs');
const TruffleConfig = require('@truffle/config');

const Eidas = artifacts.require('contracts/libs/Eidas.sol');
const AlastriaIdentityServiceProvider = artifacts.require(
  'contracts/identityManager/AlastriaIdentityServiceProvider.sol'
);
const AlastriaIdentityIssuer = artifacts.require(
  'contracts/identityManager/AlastriaIdentityIssuer.sol'
);
const Proxy = artifacts.require(
  './contracts/openzeppelin/upgradeability/AdminUpgradeabilityProxy.sol'
);
const AlastriaIdentityEntity = artifacts.require(
  'contracts/identityManager/AlastriaIdentityEntity.sol'
);

const AlastriaIdentityManager = artifacts.require(
  'contracts/identityManager/AlastriaIdentityManager.sol'
);
const AlastriaCredentialRegistry = artifacts.require(
  'contracts/registry/AlastriaCredentialRegistry.sol'
);
const AlastriaPresentationRegistry = artifacts.require(
  'contracts/registry/AlastriaPresentationRegistry.sol'
);
const AlastriaPublicKeyRegistry = artifacts.require(
  'contracts/registry/AlastriaPublicKeyRegistry.sol'
);

const addresses = {};

async function saveAddresesInfo(address, contractName, network, config) {
  if (network === 'development') {
    return;
  }
  addresses[contractName] = address;
  console.log(`${contractName} address info saved!`);
  /*
  const contractInfoHeaders = `| Contract Name | Address |\n| :------------ | :-------|\n`
  const contracInfo = `| ${contractName} | ${address} |\n`
  if (contractName == 'Eidas' || contractName == 'Owned') {
    type = 'libs'
  } else if (contractName === 'AlastriaCredentialRegistry'
  || contractName === 'AlastriaPresentationRegistry'
  || contractName === 'AlastriaPublicKeyRegistry') {
    type = 'registry'
  } else {
    type = 'identityManager'
  }
  if (contractName == 'Eidas') {
    await fs.writeFileSync(config.contractInfoPath, contractInfoHeaders)
    await fs.appendFileSync(config.contractInfoPath, contracInfo)
    console.log(`${contractName} address info saved!`)
  } else {
    await fs.appendFileSync(config.contractInfoPath, contracInfo)
    console.log(`${contractName} address info saved!`)
  }
  */
}

module.exports = async function (deployer, network, accounts) {
  const config = TruffleConfig.detect().env;

  const eidas = await Eidas.deployed();
  await saveAddresesInfo(eidas.address, config.eidas, network, config);

  await deployer.link(Eidas, AlastriaIdentityIssuer);
  await deployer.link(Eidas, AlastriaIdentityManager);

  const serviceProvider = await AlastriaIdentityServiceProvider.new();
  console.log('serviceProvider deployed: ', serviceProvider.address);
  await saveAddresesInfo(
    serviceProvider.address,
    config.serviceProvider,
    network,
    config
  );

  const identityIssuer = await AlastriaIdentityIssuer.new();
  console.log('identityIssuer deployed: ', identityIssuer.address);
  await saveAddresesInfo(
    identityIssuer.address,
    config.identityIssuer,
    network,
    config
  );

  const identityEntity = await AlastriaIdentityEntity.new();
  console.log('identityEntity deployed: ', identityEntity.address);
  await saveAddresesInfo(
    identityEntity.address,
    config.identityEntity,
    network,
    config
  );

  const credentialRegistry = await AlastriaCredentialRegistry.new();
  const proxyCredentialRegistry = await Proxy.new(
    credentialRegistry.address,
    config.adminAccount,
    []
  );
  console.log('credentialRegistry deployed: ', proxyCredentialRegistry.address);
  await saveAddresesInfo(
    proxyCredentialRegistry.address,
    config.credential,
    network,
    config
  );

  const presentationRegistry = await AlastriaPresentationRegistry.new();
  const proxyPresentationRegistry = await Proxy.new(
    presentationRegistry.address,
    config.adminAccount,
    []
  );
  console.log(
    'presentationRegistry deployed: ',
    proxyPresentationRegistry.address
  );
  await saveAddresesInfo(
    proxyPresentationRegistry.address,
    config.presentation,
    network,
    config
  );

  const publicKeyRegistry = await AlastriaPublicKeyRegistry.new();
  const proxyPublicKeyRegistry = await Proxy.new(
    publicKeyRegistry.address,
    config.adminAccount,
    []
  );
  console.log('publicKeyRegistry deployed: ', proxyPublicKeyRegistry.address);
  await saveAddresesInfo(
    proxyPublicKeyRegistry.address,
    config.publicKey,
    network,
    config
  );

  const identityManager = await AlastriaIdentityManager.new();
  const proxyIdentityManager = await Proxy.new(
    identityManager.address,
    config.adminAccount,
    []
  );
  console.log('identityManager deployed: ', proxyIdentityManager.address);
  await saveAddresesInfo(
    proxyIdentityManager.address,
    config.manager,
    network,
    config
  );

  await fs.writeFileSync('./addresses.json', JSON.stringify(addresses));
};
