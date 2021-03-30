const Migrations = artifacts.require("contracts/misc/Migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};