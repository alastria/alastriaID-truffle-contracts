pragma solidity 0.5.17;

import "../openzeppelin/Initializable.sol";
import "../libs/SafeMath.sol";


contract AlastriaPublicKeyRegistry is Initializable{
    using SafeMath for uint256;
    // This contracts registers and makes publicly avalaible the AlastriaID Public Keys hash and status, current and past.

    //TODO: Should we add RevokedBySubject Status?

    // Variables
    int public version;
    
    // common JWT algorithms
    enum Algorithm {HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES256K, ES384, ES512, EdDSA}
    string public DEFAULT_ALGORITHM = Algorithm.ES256K;

    // Initially Valid: could only be changed to DeletedBySubject for the time being.
    enum Status {Valid, DeletedBySubject}
    struct PublicKey {
        bool exists;
        Algorithm algorithm;
        Status status; // Deleted keys shouldnt be used, not even to check previous signatures.
        uint startDate;
        uint endDate;
    }

    // Mapping subject => keccak256(publicKey) => publickey
    mapping(address => mapping(bytes32 => PublicKey)) private publicKeyRegistry;
    // Mapping subject => keyIndex => keyHash
    mapping(address => mapping(uint256 => bytes32)) public publicKeyList;
    // Mapping subjst => currentIndex
    mapping(address => uint256) public currentIndexes;

    // Events, just for revocation and deletion
    event PublicKeyDeleted (string publicKey, uint256 index);
    event PublicKeyRevoked (string publicKey, uint256 index);

    // Modifiers
    modifier validAddress(address addr) {//protects against some weird attacks
        require(addr != address(0));
        _;
    }

    function initialize() initializer public{
    }

    // Sets new key and revokes previous
    function addPublicKey(string memory publicKey) public
    {
        uint256 currentIndex = currentIndexes[msg.sender];
        revokePublicKey(getCurrentPublicKey(msg.sender));
        publicKeyRegistry[msg.sender][getKeyHash(publicKey)] = PublicKey(
            true,
            DEFAULT_ALGORITHM,
            Status.Valid,
            changeDate,
            0
        );
        uint256 currentIndex = currentIndexes[msg.sender];
        publicKeyList[currentIndex,add(1)] = getKeyHash(publicKey);
        currentIndexes[msg.sender] = currentIndex.add(1);
    }

    // Sets new key and revokes previous
    function addPublicKey(string memory publicKey, Algorithms alg) public
    {
        uint256 currentIndex = currentIndexes[msg.sender];
        revokePublicKey(getCurrentPublicKey(msg.sender));
        publicKeyRegistry[msg.sender][getKeyHash(publicKey)] = PublicKey(
            true,
            alg,
            Status.Valid,
            changeDate,
            0
        );
        uint256 currentIndex = currentIndexes[msg.sender];
        publicKeyList[currentIndex,add(1)] = getKeyHash(publicKey);
        currentIndexes[msg.sender] = currentIndex.add(1);
    }


    /**
    * @dev Revoke a public key published, if none is added, the identity will be invalidated
    */
    function revokePublicKey(string memory publicKey) public
    {
        PublicKey storage value = publicKeyRegistry[msg.sender][getKeyHash(publicKey)];
        // only existent no backtransition
        if (value.exists && value.status != Status.DeletedBySubject) {
            value.endDate = now;
            emit PublicKeyRevoked(publicKey);
        }
    }

    function deletePublicKey(string memory publicKey) public
    {
        PublicKey storage value = publicKeyRegistry[msg.sender][getKeyHash(publicKey)];
        // only existent
        value.status = stateMachine(msg.sender, getKeyHash(publicKey), Status.DeletedBySubject);
        value.endDate = now;
        emit PublicKeyDeleted(publicKey);
    }

    /**
    * @dev Gets the last public added to an identity
    * @param subject
    */
    function getCurrentPublicKey(address subject) view public validAddress(subject) returns (string memory)
    {
        if (currentIndexes[msg.sender] == 0) {
            return "";
        } else {
            return publicKeyList[subject][publicKeyList[subject][currentIndexes[msg.sender]]];
        }
    }

    /**
    * @dev Get the status from a given identity and a public key
    * @param subject
    * @param publicKey
    */
    function getPublicKeyStatus(address subject, bytes32 publicKey) view public validAddress(subject)
    returns (bool exists, Status status, uint startDate, uint endDate)
    {
        PublicKey storage value = publicKeyRegistry[subject][publicKey];
        return (value.exists, value.status, value.startDate, value.endDate);
    }

    /**
    * @dev Returns de hash of an input key as string to generate a bytes32 index
    */
    function getKeyHash(string memory inputKey) internal pure returns(bytes32){
        return keccak256(abi.encodePacked(inputKey));
    }

    function stateMachine(address subject, bytes32 publicKeyIndex, Status next) internal pure returns(Status)
    {
        require(publicKeyRegistry[subject][publicKeyIndex].exists,"PUBLIC_KEY_REGISTRY: operation over not existing keys is not valid");
        Status current = publicKeyRegistry[subject][publicKeyIndex].status;
        if(current == next) {
            return current;
        }
        if(current == Status.Valid && next == Status.DeletedBySubject) {
            return next;
        }
        require(false,"PUBLIC_KEY_REGISTRY: Invalid status transition")
    }
}
