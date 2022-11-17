pragma solidity 0.5.17;

import "../libs/Owned.sol";

contract AlastriaProxy is Owned {
    //address public owner;

    event Forwarded(address indexed destination, uint256 value, bytes data, bytes result);

    //TODO: upgradeable owner for version in Identity Manager
    //constructor () public {
    //    owner = msg.sender;
    //}

    function () external {
        revert();
    }

    function forward(
        address destination,
        uint256 value,
        bytes memory data
    ) public onlyOwner returns(bytes memory) {
        (bool ret, bytes memory result) = destination.call.value(value)(data);
        require(ret);
        emit Forwarded(destination, value, data, result);
        return result;
    }

    function forward(
        address destination,
        uint256 value,
        bytes32 data
    ) public onlyOwner returns(bytes32) {
        (bool ret, bytes32 result) = destination.call.value(value)(data);
        require(ret);
        emit Forwarded(destination, value, data, result);
        return result;
    }
}
