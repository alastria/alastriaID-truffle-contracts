// SPDX-License-Identifier: MIT
pragma solidity >=0.4.24 <0.8.0;

import "./AlastriaProxy.sol";
import { IAidEntity } from "./AlastriaIdentityEntity.sol";
import { IAidIssuer } from "./AlastriaIdentityIssuer.sol";
import { IAidServiceProvider } from "./AlastriaIdentityServiceProvider.sol";
import "../openzeppelin/Initializable.sol";

contract AlastriaIdentityManager is Initializable {
  //Variables
  uint256 public version;
  uint256 internal constant timeToLive = 10000;
  address aidCredentialRegistry;
  address aidPresentationRegistry;
  address aidPublicKeyRegistry;
  IAidIssuer internal aidIssuer;
  mapping(address => address) public identityKeys; //change to alastriaID created check bool
  mapping(address => uint256) public pendingIDs;

  //Events
  event PreparedAlastriaID(address indexed signAddress);

  event OperationWasNotSupported(string indexed method);

  event IdentityCreated(address indexed identity, address indexed creator, address owner);

  event IdentityRecovered(
    address indexed oldAccount,
    address newAccount,
    address indexed serviceProvider
  );

  //Modifiers
  modifier isPendingAndOnTime(address _signAddress) {
    require(pendingIDs[_signAddress] > 0 && pendingIDs[_signAddress] > block.timestamp);
    _;
  }

  modifier validAddress(address addr) {
    //protects against some weird attacks
    require(addr != address(0));
    _;
  }

  //Constructor
  function initialize(
    address _aidEntity,
    address _aidIssuer,
    address _aidServiceProvider,
    address _credentialRegistry,
    address _presentationRegistry,
    address _publicKeyRegistry
  ) public initializer {
    //TODO require(_version > getPreviousVersion(_previousVersion));
    // Safe registry addresses
    aidCredentialRegistry = _credentialRegistry;
    aidPresentationRegistry = _presentationRegistry;
    aidPublicKeyRegistry = _publicKeyRegistry;
    // Create first identity based on msg.sender
    AlastriaProxy identity = new AlastriaProxy();
    //identity.transferOwnership(msg.sender);
    identityKeys[msg.sender] = address(identity);
    aidIssuer = IAidIssuer(_aidIssuer);
    aidIssuer.initialize(address(identity));
    IAidServiceProvider(_aidServiceProvider).initialize(address(identity));
    IAidServiceProvider(_aidEntity).initialize(address(identity));
  }

  //Methods
  function prepareAlastriaID(address _signAddress) public {
    require(aidIssuer.isIdentityIssuer(msg.sender), "Only issuers are allowed");
    pendingIDs[_signAddress] = block.timestamp + timeToLive;
    emit PreparedAlastriaID(_signAddress);
  }

  /// @dev Creates a new AlastriaProxy contract for an owner and recovery and allows an initial forward call which would be to set the registry in our case
  /// @param addPublicKeyCallData of the call to addKey function in AlastriaPublicKeyRegistry from the new deployed AlastriaProxy contract
  function createAlastriaIdentity(bytes memory addPublicKeyCallData)
    public
    validAddress(msg.sender)
    isPendingAndOnTime(msg.sender)
  {
    AlastriaProxy identity = new AlastriaProxy();
    identityKeys[msg.sender] = address(identity);
    pendingIDs[msg.sender] = 0;
    identity.forward(aidPublicKeyRegistry, 0, addPublicKeyCallData); //must be alastria registry call
  }

  /// @dev This method send a transaction trough the proxy of the sender
  function delegateCall(
    address _destination,
    uint256 _value,
    bytes memory _data
  ) public returns (bytes memory) {
    require(identityKeys[msg.sender] != address(0));
    AlastriaProxy identity = AlastriaProxy(address(identityKeys[msg.sender]));
    bytes memory result = identity.forward(_destination, _value, _data);
    return result;
  }

  function recoverAccount(address accountLost, address newAccount) public {
    require(aidIssuer.isIdentityIssuer(msg.sender), "Only issuers are allowed");
    identityKeys[newAccount] = identityKeys[accountLost];
    identityKeys[accountLost] = address(0);
    emit IdentityRecovered(accountLost, newAccount, msg.sender);
  }
}
