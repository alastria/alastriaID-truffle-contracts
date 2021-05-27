const fs = require('fs');
const TruffleConfig = require('@truffle/config');


const AlastriaNameService = artifacts.require(
    'contracts/nameService/AlastriaNameService.sol'
);
const AlastriaIdentityManager = artifacts.require(
    'contracts/identityManager/AlastriaIdentityManager.sol'
);

const addressesPath = './addresses.json';
let addresses;

async function saveAddresesInfo(address, contractName, network) {
    if (network === 'development') {
        return;
    }
    addresses[contractName] = address;
    console.log(`${contractName} address info saved!`);
}

module.exports = async function (deployer, network, accounts) {
    const config = TruffleConfig.detect().env;
    addresses = JSON.parse(fs.readFileSync(addressesPath));

    try{
        let identityManager = await AlastriaIdentityManager.at(
            addresses[config.manager]
        );
    
        let proxyFirstIdentityWallet = await identityManager.identityKeys(config.firstIdentityWallet, 
            {from: config.firstIdentityWallet});

        console.log('proxy first identity wallet:', proxyFirstIdentityWallet);
        
        const nameService = await deployer.deploy(AlastriaNameService, proxyFirstIdentityWallet);

        console.log('nameService deployed: ', nameService.address);
        await saveAddresesInfo(
            nameService.address,
            config.nameService,
            network
        );

        await fs.writeFileSync(addressesPath, JSON.stringify(addresses));
    }
    catch (err) {
        console.log('ERROR:', err);
        callback(null);
      }
};