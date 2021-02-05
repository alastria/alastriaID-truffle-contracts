// SPDX-License-Identifier: MIT
pragma solidity >=0.4.24 <0.8.0;

import "../openzeppelin/ownership/Ownable.sol";

contract AlastriaProxy is Ownable {
  //address public owner;

  event Forwarded(address indexed destination, uint256 value, bytes data, bytes result);

  //TODO: upgradeable owner for version in Identity Manager
  //constructor () public {
  //    owner = msg.sender;
  //}

  fallback() external {
    revert();
  }

  function forward(
    address destination,
    uint256 value,
    bytes memory data
  ) public onlyOwner returns (bytes memory) {
    (bool ret, bytes memory result) = destination.call{ value: value }(data);
    require(ret);
    emit Forwarded(destination, value, data, result);
    return result;
  }
}
