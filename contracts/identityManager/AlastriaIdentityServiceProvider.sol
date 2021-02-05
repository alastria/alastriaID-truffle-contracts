// SPDX-License-Identifier: MIT
pragma solidity >=0.4.24 <0.8.0;

import "../libs/Eidas.sol";
import "../openzeppelin/Initializable.sol";

interface IAidServiceProvider {
    function initialize(address _firstIdentity) external;
}

contract AlastriaIdentityServiceProvider is Initializable {

    using Eidas for Eidas.EidasLevel;

    mapping(address => bool) internal providers;

    modifier onlyIdentityServiceProvider(address _identityServiceProvider) {
        require (isIdentityServiceProvider(_identityServiceProvider));
        _;
    }

    modifier notIdentityServiceProvider(address _identityServiceProvider) {
        require (!isIdentityServiceProvider(_identityServiceProvider));
        _;
    }

    function initialize(address _firstIdentity) public initializer {
        providers[_firstIdentity] = true;
    }

    function addIdentityServiceProvider(address _identityServiceProvider) public onlyIdentityServiceProvider(msg.sender) notIdentityServiceProvider(_identityServiceProvider) {
        providers[_identityServiceProvider] = true;
    }

    function deleteIdentityServiceProvider(address _identityServiceProvider) public onlyIdentityServiceProvider(_identityServiceProvider) onlyIdentityServiceProvider(msg.sender) {
        providers[_identityServiceProvider] = false;
    }

    function isIdentityServiceProvider(address _identityServiceProvider) public view returns (bool) {
        return providers[_identityServiceProvider];
    }

}
