pragma solidity 0.5.17;

import "./openzeppelin/Initializable.sol";

contract AlastriaCredentialRegistry is Initializable {

    /* Major updates in V2.1, in order to enhance privacy and allow for a smooth transition to V2.1 and future V2.2.

    - addSubjectCredential and addIssuerCredential marked as To Be Deprecated in future version 2.2, but still available
    - deleteSubjectCredential and updateCredentialStatus (only valid for Issuer) marked To Be Deprecated in favor 
      of new update functions: updateSubjectCredential and updateIssuerCredential (see below)
    - events SubjectCredentialDeleted and IssuerCredentialRevoked marked as To De Deprecated in future version 2.2,
      still used by TO Be Deprecated functions deleteSubjectCredential and updateCredentialStatus.   
    - New updateSubjectCredential and updateIssuerCredential can be used to anchor directly in any 
      valid (Subject/Issuer) status, those function always emit the new common credentialUpdated event.
    - Deprecated issuerCredentialList and subjectCredentialList mappings and the corresponding getter function
      getSubjectPresentationList (getIssuerPresentationList was planned but never implemented).
      Removed all wrrite and read access to issuerCredentialList and subjectCredentialList mappings.
    - Deprecated URI field in SubjectCredential Struct.
      The corresponding parameter in addSubjectCredential is kept, but not used at all in the implementation.
      The name of the parameter has been deprecated (commented out) to avoid Solidity compiler warnings about unused parameter.
    */

    // SubjectCredential are registered under Hash(Complete JWT Credential + subjectDID)) in a (subject, hash) mapping
    // IssuerCredentials are registered under Hash (Complete JWT Credential + IssuerDID) in a (issuer, hash) mapping

/* Deprecated    // A List of Subject credential hashes is gathered in a (subject) mapping */
    // To Think About: Make a unique Credential struct and just one mapping subjectCredentialRegistry instead one for subjects and one for issuers
/* Deprecated    // A List of Subject credential hashes is gathered in a (subject) mapping */
/* Deprecated    // To Do: Return credential URI. Should only be available to Subject. Mainly as a backup or main index when there are more than one device.
    // Could be done from credential mapping in another get function only for subject
    // or in getSubjectCredentialList (changing URI from one mapping to the other)
    // To Do: make AlastriaCredentialRegistry similar to AlastriaClaimRegistry.
*/

    // Variables
    int public version;
    address public previousPublishedVersion;

    // SubjectCredential: Initially Valid: Only DeletedBySubject
    // IssuerCredentials: Initially Valid: Only AskIssuer or Revoked, no backwards transitions.
    enum Status {Valid, AskIssuer, Revoked, DeletedBySubject}
    Status constant STATUS_FIRST = Status.Valid;
    Status constant STATUS_LAST = Status.DeletedBySubject;

    bool constant backTransitionsAllowed = false;

    struct SubjectCredential {
        bool exists; // exists refers to the anchoring in the blockchain, not to the existence of the credential offchain
        Status status;
/* Deprecated
        string URI;
*/
        /*URI refers to a possible location of the Credential for backup purposes. 
         * It can be empty and it is not recommended that it can point to personal 
         * data that is not properly protected, due to GDPR issues.*/

    }

    // Mapping subject, hash (JSON credential)
    mapping(address => mapping(bytes32 => SubjectCredential)) private subjectCredentialRegistry;
 /* Deprecated
    mapping(address => bytes32[]) public subjectCredentialList;
*/
    struct IssuerCredential {
        bool exists;
        Status status;
    }

    // Mapping issuer, hash (JSON credential + CredentialSignature)
    mapping(address => mapping(bytes32 => IssuerCredential)) private issuerCredentialRegistry;
 /* Deprecated
    mapping(address => bytes32[]) public issuerCredentialList;
*/

    // To be deprecated, those events are only used by old functions
    // New functions will emit only the new CredentialUpdated event
    // Events. Just for changes, not for initial set
    event SubjectCredentialDeleted (bytes32 subjectCredentialHash);
    event IssuerCredentialRevoked (bytes32 issuerCredentialHash, Status status);

    // New common event, is used only by new functions updateIssuerCredential and updateSubjectCredential
    // is emited for any update included update to valid status
    event CredentialUpdated (bytes32 hash, Status status);

    //Modifiers
    modifier validAddress(address addr) {//protects against some weird attacks
        require(addr != address(0));
        _;
    }

    modifier validStatus (Status status) { // solidity currently check on use not at function call
        require (status >= STATUS_FIRST && status <= STATUS_LAST);
        _;
    }

    // Functions
    // Constructor
    function initialize(address _previousPublishedVersion) public initializer {
        version = 3;
        previousPublishedVersion = _previousPublishedVersion;
    }

    // Status validations
    function getSubjectAllowed(Status status) private pure returns (bool){
        return status == Status.Valid || status == Status.DeletedBySubject;
    }

    function getIssuerAllowed(Status status) private pure returns (bool){
        return status == Status.Valid || status == Status.AskIssuer || status == Status.Revoked;
    }


    /*
    * @dev Function to add Credentials to the Subject
    * @param subjectCredentialHash Hash of the credential to add
    * @param URI Uri of the Subject
    */
 	//To be deprecated, please use only updateSubjectCredential
   function addSubjectCredential(bytes32 subjectCredentialHash, string memory /* Deprecated URI */) public {
        require(!subjectCredentialRegistry[msg.sender][subjectCredentialHash].exists);
        subjectCredentialRegistry[msg.sender][subjectCredentialHash] = SubjectCredential(true, Status.Valid /* Deprecated , URI */);
        /*Deprecated subjectCredentialList[msg.sender].push(subjectCredentialHash); */
    }
    
    /*
    * @dev Function to add Credentials to the issuer
    * @param issuerCredentialHash Hash of the Credential
    */
 	//To be deprecated, please use only updateIssuerCredential
    function addIssuerCredential(bytes32 issuerCredentialHash) public {
        require(!issuerCredentialRegistry[msg.sender][issuerCredentialHash].exists);
        issuerCredentialRegistry[msg.sender][issuerCredentialHash] = IssuerCredential(true, Status.Valid);
        /* Deprecated issuerCredentialList[msg.sender].push(issuerCredentialHash); */
    }

    /*
    * @dev Function to remove credentials from subject
    * @param subjectCredentialHash hash of the credential to be removed
    */
 	//To be deprecated, please use only updateSubjectCredential
    function deleteSubjectCredential(bytes32 subjectCredentialHash) public {
        SubjectCredential storage value = subjectCredentialRegistry[msg.sender][subjectCredentialHash];
        // only existent
        if (value.exists && value.status != Status.DeletedBySubject) {
            value.status = Status.DeletedBySubject;
            emit SubjectCredentialDeleted(subjectCredentialHash);
        }
    }

    function updateSubjectCredential(bytes32 subjectCredentialHash, Status status) validStatus (status) public {
        // Check valid status
        if (getSubjectAllowed(status)) {
            SubjectCredential storage value = subjectCredentialRegistry[msg.sender][subjectCredentialHash];
            // If it does not exist, we create a new entry
            if (!value.exists) {
                subjectCredentialRegistry[msg.sender][subjectCredentialHash] = SubjectCredential(true, status);
                emit CredentialUpdated(subjectCredentialHash, status);
            }
            // Check backward transition or higher to update status
            else if (backTransitionsAllowed || status > value.status) {
                value.status = status;
                emit CredentialUpdated(subjectCredentialHash, status);
            }
        }
    }  


   /*
    * @dev Function to get the status of a Credential
    * @param subject address of the subject which owns the credential
    * @param subjectCredentialHash hash of the credential
    */
    function getSubjectCredentialStatus(address subject, bytes32 subjectCredentialHash) view public validAddress(subject) returns (bool exists, Status status) {
        SubjectCredential storage value = subjectCredentialRegistry[subject][subjectCredentialHash];
        return (value.exists, value.status);
    }

/* Deprecated
    function getSubjectCredentialList(address subject) public view returns (uint, bytes32[] memory) {
        return (subjectCredentialList[subject].length, subjectCredentialList[subject]);
    }
*/

 	//To be deprecated, please use only updateIssuerCredential
    function updateCredentialStatus(bytes32 issuerCredentialHash, Status status) validStatus (status) public {
        IssuerCredential storage value = issuerCredentialRegistry[msg.sender][issuerCredentialHash];
        // No backward transition, only AskIssuer or Revoked
        if (status > value.status) {
            if (status == Status.AskIssuer || status == Status.Revoked) {
                value.exists = true;
                value.status = status;
                emit IssuerCredentialRevoked(issuerCredentialHash, status);
            }
        }
    }

    function updateIssuerCredential(bytes32 issuerCredentialHash, Status status) validStatus (status) public {
        // Check valid status
        if (getIssuerAllowed(status)) {
            IssuerCredential storage value = issuerCredentialRegistry[msg.sender][issuerCredentialHash];
            // If it does not exist create new entry in the mapping
            if (!value.exists) {
                issuerCredentialRegistry[msg.sender][issuerCredentialHash] = IssuerCredential(true, status);
                emit CredentialUpdated(issuerCredentialHash, status);
            // if backward transition allowed or new status higher than previous status, update entry in the mapping
            } else if (backTransitionsAllowed || status > value.status) {
                value.status = status;
                emit CredentialUpdated(issuerCredentialHash, status);
            }
        }
    }  
 
    // If the credential does not exists the return is a void credential
    // If we want a log, should we add an event?
    function getIssuerCredentialStatus(address issuer, bytes32 issuerCredentialHash) view public validAddress(issuer) returns (bool exists, Status status) {
        IssuerCredential storage value = issuerCredentialRegistry[issuer][issuerCredentialHash];
        return (value.exists, value.status);
    }

    // Utility function. To be deprecated. 
    // This utility function combining two status should be implemented in the library and not in a smart contracts
    // Defining three status functions avoid linking the subject to the issuer or the corresponding hashes
    function getCredentialStatus(Status subjectStatus, Status issuerStatus) pure public validStatus(subjectStatus) validStatus(issuerStatus) returns (Status){
        if (subjectStatus >= issuerStatus) {
            return subjectStatus;
        } else {
            return issuerStatus;
        }
    }
}