const Eidas = artifacts.require('contracts/libs/Eidas.sol');

module.exports = function (deployer, _network, _accounts) {
  deployer.deploy(Eidas);
};
