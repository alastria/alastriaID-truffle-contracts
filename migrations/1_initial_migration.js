var Migrations = artifacts.require("contracts/misc/Migrations.sol");

module.exports = function(deployer) {
  console.log("AQUIIIIIIII", deployer.deploy(Migrations))

  if (Migrations.network_id === '19535753591') {
    web3.personal.unlockAccount(web3.eth.accounts[0], "Passw0rd");
  }

  deployer.deploy(Migrations);
};