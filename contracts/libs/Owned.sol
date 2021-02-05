// SPDX-License-Identifier: MIT
pragma solidity >=0.4.24 <0.8.0;

contract Owned {
    address public owner;
    modifier onlyOwner() {
        require(isOwner(msg.sender));
        _;
    }

    constructor () {
        owner = msg.sender;
    }

    function isOwner(address addr) public view returns(bool) {
        return addr == owner;
    }

    function transfer(address newOwner) public onlyOwner {
        if (newOwner != address(this)) {
            owner = newOwner;
        }
    }
}
