pragma solidity 0.5.17;

import "./AlastriaIdentityServiceProvider.sol";
import "./AlastriaIdentityIssuer.sol";
import "./AlastriaProxy.sol";
import "./AlastriaIdentityEntity.sol";
import "../registry/AlastriaCredentialRegistry.sol";
import "../registry/AlastriaPresentationRegistry.sol";
import "../registry/AlastriaPublicKeyRegistry.sol";
import "../libs/Owned.sol";
import "../openzeppelin/Initializable.sol";

contract AlastriaIdentityManager is AlastriaIdentityServiceProvider, AlastriaIdentityIssuer, Owned, Initializable {

    //Variables
    uint256 public version;
    uint256 constant internal timeToLive = 10000;
    AlastriaCredentialRegistry public alastriaCredentialRegistry;
    AlastriaPresentationRegistry public alastriaPresentationRegistry;
    AlastriaPublicKeyRegistry public alastriaPublicKeyRegistry;
    mapping(address => address) public identityKeys; //change to alastriaID created check bool
    mapping(address => uint) public pendingIDs;

    //Events
    event PreparedAlastriaID(address indexed signAddress);

    event OperationWasNotSupported(string indexed method);

    event IdentityCreated(address indexed identity, address indexed creator, address owner);

    event IdentityRecovered(address indexed oldAccount, address newAccount, address indexed serviceProvider);

    //Modifiers
    modifier isPendingAndOnTime(address _signAddress) {
        require(pendingIDs[_signAddress] > 0 && pendingIDs[_signAddress] > block.timestamp);
        _;
    }

    modifier validAddress(address addr) { //protects against some weird attacks
        require(addr != address(0));
        _;
    }

    //Constructor
    function initialize (address _credentialRegistry, address _publicKeyRegistry, address _presentationRegistry, address _firstIdentityWallet) public initializer {
        //TODO require(_version > getPreviousVersion(_previousVersion));
        alastriaCredentialRegistry = AlastriaCredentialRegistry(_credentialRegistry);
        alastriaPresentationRegistry = AlastriaPresentationRegistry(_presentationRegistry);
        alastriaPublicKeyRegistry = AlastriaPublicKeyRegistry(_publicKeyRegistry);
        AlastriaProxy identity = new AlastriaProxy();
        identityKeys[_firstIdentityWallet] = address(identity);
        AlastriaIdentityServiceProvider._initialize(address(identity));
        AlastriaIdentityIssuer._initialize(address(identity));
    }

    //Methods
    function prepareAlastriaID(address _signAddress) public onlyIdentityIssuer(msg.sender) {
        pendingIDs[_signAddress] = block.timestamp + timeToLive;
        emit PreparedAlastriaID(_signAddress);
    }

    /// @dev Creates a new AlastriaProxy contract for an owner and recovery and allows an initial forward call which would be to set the registry in our case
    /// @param addPublicKeyCallData of the call to addKey function in AlastriaPublicKeyRegistry from the new deployed AlastriaProxy contract
    function createAlastriaIdentity(bytes memory addPublicKeyCallData) public validAddress(msg.sender) isPendingAndOnTime(msg.sender) {
        AlastriaProxy identity = new AlastriaProxy();
        identityKeys[msg.sender] = address(identity);
        pendingIDs[msg.sender] = 0;
        identity.forward(address(alastriaPublicKeyRegistry), 0, addPublicKeyCallData);//must be alastria registry call
    }

    /// @dev This method send a transaction trough the proxy of the sender
    function delegateCall(address _destination, uint256 _value, bytes memory _data) public {
        require(identityKeys[msg.sender]!=address(0));
        AlastriaProxy identity = AlastriaProxy(address(identityKeys[msg.sender]));
        identity.forward(_destination,_value,_data);
    }

    function recoverAccount(address accountLost, address newAccount) public onlyIdentityIssuer(msg.sender) {
        identityKeys[newAccount] = identityKeys[accountLost];
        identityKeys[accountLost] = address(0);
        emit IdentityRecovered(accountLost,newAccount,msg.sender);
    }
}
