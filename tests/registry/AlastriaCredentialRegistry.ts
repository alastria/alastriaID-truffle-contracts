const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

  var AlastriaCredentialRegistry; //contracts
  var aCR; //Contact Instance

  //Hashes
  const subjectCredentialHash1  = "0x1100000000123456789012345678901234567890123456789012345678901234";
  const subjectCredentialHash2  = "0x1200000000123456789012345678901234567890123456789012345678901234";
  const subjectCredentialHash3  = "0x1300000000123456789012345678901234567890123456789012345678901234";
  const subjectCredentialHash4  = "0x1400000000123456789012345678901234567890123456789012345678901234";
  const issuerCredentialHash1 = "0x2100000000123456789012345678901234567890123456789012345678901234";
  const issuerCredentialHash2 = "0x2200000000123456789012345678901234567890123456789012345678901234";
  const issuerCredentialHash3 = "0x2300000000123456789012345678901234567890123456789012345678901234";
  const issuerCredentialHash4 = "0x2400000000123456789012345678901234567890123456789012345678901234";
  const verboseLevel = 2;

/*
  let Status = {
    "Valid": 0,
    "Received": 1,
    "AskDeletion": 2,
    "DeletionConfirmation": 3
  };
*/
  let Status = {
    "Valid": 0,
    "AskIssuer": 1,
    "Revoked": 2,
    "DeletedBySubject": 3
  };

  type BCStatus {
    exists: boolean;
    status: Status;
  };

  type TBCStatus = [boolean, Status];

  // Call variables for Solidity Smart Contract
  var subject;
  var issuer;
  var subjectCredentialHash;
  var issuerCredentialHash;
  var sendStatus: Status;
  // Return Variables from Solidity Smart Contract
  var txResult;
  let receipt : ContractReceipt;
//  var subjectStatus: BCStatus;
  var subjectStatus: BCStatus = {exists:false, status:Status.Valid};
  var issuerStatus: BCStatus;
  var credentialStatus: Status;


  function logSend(verbosity) {
    if (verbosity <= verboseLevel) {
      console.log ("subject: " + subject.address + " issuer : " + issuer.address + " sendStatus: " + sendStatus);
      console.log ("subjectHash : " + subjectCredentialHash)¨;
      console.log ("issuerHash: " + issuerCredentialHash);
    }
  }

  function logStatus(verbosity) {
    if (verbosity <= verboseLevel) {
      /* More detailled view: log(2, "subject    : " , subjectStatus[0] , ", " , subjectStatus[1], ",", subjectStatus[1].c)*/
      console.log("subjectStatus : " + subjectStatus + " issuerStatus : " + issuerStatus + " credentialStatus: " + credentialStatus);
      if ( receipt == undefined ) {
        console.log("receipt:" + receipt);
      } else if (receipt.events.length == 0) {
        console.log("events: " + receipt.events.length);
      } else {
        console.log("events: " + receipt.events.length + " => " + receipt.events[0].event);
      }
    }
  }

  function log (verbosity, message) {
    if (verbosity <= verboseLevel) {
        console.log(message);
    }
  }

  function assertStrictEqual (left:any, right:any, msg:string) {
    assert (left === right, msg);
  }

  function checkStatus (received: TBCStatus, expected: TBCStatus, msg:string) {
    log(2, "checkStatus => received: " + JSON.stringify(received) + " expected: " + JSON.stringify(expected));
    log(3, "check Equal: " + ((received[0] === expected[0]) && (received[1] === expected[1])));
    assert(((received[0] === expected[0]) && (received[1] === expected[1])),
     "Error: Received " + JSON.stringify(received) + " expected: " + JSON.stringify(expected) + ". " + msg );
  }

  function checkEvent (txReceipt, eventsExpected: number, eventName?: string, eventHash?: number, eventStatus?: Status) {
    log (2, "checkEvent: " + receipt.events.length);
    assertStrictEqual (receipt.events.length, eventsExpected,  'expected: ' + receipt.events.length + ' events, received: ' + eventsExpected);
    if eventsExpected > 0 {  
      receipt.events?.filter((x) => {
        assertStrictEqual (x.event, eventName, x.event + ' name should be ' +  eventName);
        log (2, "Event: " + x.event);
        assertStrictEqual (x.args.hash, eventHash, 'hash: ' + x.args.hash ' should be: ' + eventHash);
        assertStrictEqual (x.args.status, eventStatus, 'emited status ' + x.args.status + ' should be ' + eventStatus);
        log (3, "x.args.status, eventStatus: " + x.args.status + ", " + eventStatus);
      }
    }
  }


describe("AlastriaCredentialRegistry Test Suite", function () {

  it("0 AlastriaCredentialRegistry deployment & getSigners (subject? & issuer?)", async function () {
    AlastriaCredentialRegistry = await ethers.getContractFactory("AlastriaCredentialRegistry");
    aCR = await AlastriaCredentialRegistry.deploy();
    await aCR.deployed();
    console.log('aCR deployed at:'+ aCR.address)
    signers = await ethers.getSigners();
    [owner,subject1,subject2,subject3, subject4,issuer1,issuer2, issuer3, issuer4, other] = signers;
  
  });

  it("1.0 Initial State ", async function() {
    log(2, "Test Set 1: Subject1, Issuer1, subjectCredentialHash1, issuerCredentialHash1. One by one transitions");
    subject = subject1;
    issuer = issuer1;
    subjectCredentialHash = subjectCredentialHash1;
    issuerCredentialHash = issuerCredentialHash1;

    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

  });

    //Test Set 1: Subject1, Issuer1, subjectCredentialHash1, issuerCredentialHash1. One by one transitions
  it('1.1 Initial Set for Subject1,  subjectCredentialHash1', async() => {
    console.log("1.1 inicio, subjectStatus:" + subjectStatus);
    log(3, JSON.stringify(subjectStatus));
    logSend(2);

    txResult = await aCR.connect(subject).addSubjectCredential(subjectCredentialHash, "Not used URL");
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    log(3, subjectStatus);

    checkStatus (subjectStatus, [true, Status.Valid], 'Should exist & be Valid');
    checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (credentialStatus, Status.Valid, 'should be Valid');
    checkEvent (receipt, 0);
  });

  it('1.2 Second equal Set for Subject1, subjectCredentialHash1, will fail & revert', async() => {
      try {
          txResult = await aCR.connect(subject).addSubjectCredential(subjectCredentialHash, "Not used URL");
          log(3, "");
          assert (false, "ERROR: Expected exception not raised");
          log(3, "");
      } catch (error) {
          log(3, "");
          log(2, "Expected exception caught:" + error);
          log(3, "Check nothing changed.");
          log(3, "");

          let lreceipt: ContractReceipt = await txResult.wait();
          receipt = lreceipt;
          subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
          issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
          credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
          logStatus(2);

          log(2, subjectStatus);

          checkStatus (subjectStatus, [true, Status.Valid], 'Should exist & be Valid');
          checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
          assertStrictEqual (credentialStatus, Status.Valid, 'should be Valid');
          checkEvent (receipt, 0);

      }
  });


  it('1.4 Change to invalid Status by subject1, will fail & revert', async() => {
  sendStatus = 10; // Invalid value
  logSend(2);
      try {
          txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);
          // txResult = await Credential.updateSubjectCredential(subjectCredentialHash1, 10, {from: subject1});
          log(2, "");
          assert (false, "ERROR: Expected exception not raised.");
          log(2, "");
      } catch (error) {
          log(2, "");
          log(2, "Expected exception caught:" + error);
          log(2, "Check nothing changed.");
          log(2, "");

          let lreceipt: ContractReceipt = await txResult.wait();
          receipt = lreceipt;
          subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
          issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
          credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
          logStatus(2);

          checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
          checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
          assertStrictEqual (credentialStatus, Status.Valid, 'should be Valid');
          checkEvent (receipt, 0);
      }
  });

  it('1.5 Change to invalid Status by Issuer1, will fail & revert', async() => {
      try {
          txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);
          log(2, "");
          assert (false, "ERROR: Expected exception not raised.");
          log(2, "");
      } catch (error) {
          log(2, "");
          log(2, "Expected exception caught:" + error);
          log(2, "Check nothing changed.");
          log(2, "");

          let lreceipt: ContractReceipt = await txResult.wait();
          receipt = lreceipt;
          subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
          issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
          credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
          logStatus(2);

          checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
          checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
          assertStrictEqual (credentialStatus, Status.Valid, 'should be Valid');
          checkEvent (receipt, 0);
      }
  });

  it('1.6 Change to DeletedBySubject by Issuer1, no change', async() => {
      sendStatus = Status.DeletedBySubject;
      txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);
      // txResult = await Credential.updateIssuerCredential(issuerCredentialHash1, Status.AskDeletion, {from: issuer1});

      let lreceipt: ContractReceipt = await txResult.wait();
      receipt = lreceipt;
      subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
      issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
      credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
      logStatus(2);

      checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
      checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
      assertStrictEqual (credentialStatus, Status.Valid, 'should be Valid');
      checkEvent (receipt, 0);
  });

  it('1.7 Change to Revoked by Subject1, no change', async() => {
      sendStatus = Status.Revoked;
      txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

      let lreceipt: ContractReceipt = await txResult.wait();
      receipt = lreceipt;
      subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
      issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
      credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
      logStatus(2);

      checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
      checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
      assertStrictEqual (credentialStatus, Status.Valid, 'should be Valid');
      checkEvent (receipt, 0);
  })

  it('1.8 Change to Valid by Issuer1', async() => {
    sendStatus = Status.Valid;
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
    checkStatus (issuerStatus, [true, sendStatus], 'Should exist & be ' + sendStatus);
    assertStrictEqual (credentialStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "CredentialUpdated", issuerCredentialHash, sendStatus);
  })

  it('1.9 Change to DeletedBySubject by subject1', async() => {
    sendStatus = Status.DeletedBySubject;
    txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, sendStatus], 'Should not exist & be ' + sendStatus);
    checkStatus (issuerStatus, [true, Status.Valid], 'Should exist & be ' + Status.Valid);
    assertStrictEqual (credentialStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "CredentialUpdated", subjectCredentialHash, sendStatus);

  });

  it('1.10 Change back to Valid by subject1, no change', async() => {
    sendStatus = Status.Valid;
    txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [true, Status.Valid], 'Should exist & be ' + Status.Valid);
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });


  it('1.11 Change again to Valid by Issuer1, no change', async() => {
    sendStatus = Status.Valid;
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be Status.DeletedBySubject');
    checkStatus (issuerStatus, [true, sendStatus], 'Should exist & be ' + sendStatus);
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });

  it('1.12 Change to Revoked by Issuer1', async() => {
    sendStatus = Status.Revoked;
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be Status.DeletedBySubject');
    checkStatus (issuerStatus, [true, sendStatus], 'Should exist & be ' + sendStatus);
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 1, "CredentialUpdated", issuerCredentialHash, sendStatus);

  });

  it('1.13 Change back to Valid by subject1, no change', async() => {
    sendStatus = Status.Valid;
    txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be Status.DeletedBySubject');
    checkStatus (issuerStatus, [true, Status.Revoked], 'Should exist & be ' + Status.Revoked);
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });

  it('1.14 Change Back to Valid by Issuer1, no change', async() => {
    sendStatus = Status.Valid;
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be Status.DeletedBySubject');
    checkStatus (issuerStatus, [true, Status.Revoked], 'Should exist & be ' + Status.Revoked);
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });

  //Test Set 3: Subject2, Issuer2, subjectCredentialHash3, issuerCredentialHash3.
  // Direct jump (not previous state Valid) to  AskIssuer, Revoked, DeletedBySubject and backtransitions
  it("3.0 Initial State ", async function() {
    log(2, "Test Set 3: Subject2, Issuer2, subjectCredentialHash3, issuerCredentialHash3.");
    log(2, "Test Set 3: Many Hashes in the middle. Direct Jump to AskDeletion and Deleted");

    subject = subject2;
    issuer = issuer2;
    subjectCredentialHash  = subjectCredentialHash3;
    issuerCredentialHash = issuerCredentialHash3;

    subjectStatus = await aCR.getSubjectCredentialStatus(subject2.address, subjectCredentialHash3);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer2.address, issuerCredentialHash3);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

  });

  it('3.1 Update to AskIssuer by subject2,  subjectCredentialHash3, no change', async function() {
    sendStatus = Status.AskIssuer;
    logSend(2);
    txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [false, Status.Valid], 'Should not exist & be Valid');
    checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (credentialStatus, Status.Valid, 'should be Valid');
    checkEvent (receipt, 0);
  });

  it('3.2 Update to DeletedBySubject (before Set to Valid) for subject2,  subjectCredentialHash3', async function() {
    sendStatus = Status.DeletedBySubject;
    logSend(2);
    txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, sendStatus], 'Should not exist & be ' + sendStatus);
    checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (credentialStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "CredentialUpdated", subjectCredentialHash, sendStatus);
  });

  it('3.3a Update again to DeletedBySubject for subject2,  subjectCredentialHash3, no change, no event', async function() {
    sendStatus = Status.DeletedBySubject;
    logSend(2);
    txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, sendStatus], 'Should not exist & be ' + sendStatus);
    checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (credentialStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 0);
  });

  it('3.3b Update back to Valid for subject2,  subjectCredentialHash3, no change, no event', async function() {
    sendStatus = Status.Valid;
    logSend(2);
    txResult = await aCR.connect(subject).updateSubjectCredential(subjectCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });

  it('3.4 Update to DeletedBySubject by issuer2, issuerCredentialHash3, no change', async function() {
    sendStatus = Status.DeletedBySubject;
    logSend(2);
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });

  it('3.5 Update to AskIssuer (before Set to Valid) for issuer2,  issuerCredentialHash3', async function() {
    sendStatus = Status.AskIssuer;
    logSend(2);
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [true, sendStatus], 'Should exist & be ' + sendStatus );
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'status should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 1, "CredentialUpdated", issuerCredentialHash, sendStatus);
  });

  it('3.6a Update again to AskIssuer for issuer2, issuerCredentialHash3, no change, no event', async function() {
    sendStatus = Status.AskIssuer;
    logSend(2);
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [true, sendStatus], 'Should exist & be ' + sendStatus );
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });

  it('3.6b Update back to Valid for issuer2, issuerCredentialHash3, no change, no event', async function() {
    sendStatus = Status.Valid;
    logSend(2);
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject2.address, subjectCredentialHash3);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer2.address, issuerCredentialHash3);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [true, Status.AskIssuer], 'Should exist & be ' + Status.AskIssuer );
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);

  });

  it('3.7 Update to Revoked (before Set to Valid) for issuer2,  issuerCredentialHash3', async function() {
    sendStatus = Status.Revoked;
    logSend(2);
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [true, sendStatus], 'Should exist & be ' + sendStatus );
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'status should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 1, "CredentialUpdated", issuerCredentialHash, sendStatus);
  });

  it('3.8a Update again to Revoked for issuer2, issuerCredentialHash3, no change, no event', async function() {
    sendStatus = Status.Revoked;
    logSend(2);
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject.address, subjectCredentialHash);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer.address, issuerCredentialHash);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [true, sendStatus], 'Should exist & be ' + sendStatus );
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);
  });

  it('3.8b Update back to Valid for issuer2, issuerCredentialHash3, no change, no event', async function() {
    sendStatus = Status.Valid;
    logSend(2);
    txResult = await aCR.connect(issuer).updateIssuerCredential(issuerCredentialHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject2.address, subjectCredentialHash3);
    issuerStatus = await aCR.getIssuerCredentialStatus(issuer2.address, issuerCredentialHash3);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus[1], issuerStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.DeletedBySubject], 'Should not exist & be ' + Status.DeletedBySubject);
    checkStatus (issuerStatus, [true, Status.Revoked], 'Should exist & be ' + Status.Revoked );
    assertStrictEqual (credentialStatus, Status.DeletedBySubject, 'should be ' + Status.DeletedBySubject);
    checkEvent (receipt, 0);

  });

/*  it("x.1 addSubjectCredential subjectCredentialHash1", async function () {
    txResult = await aCR.connect(subject1).addSubjectCredential(subjectCredentialHash1, "URI not used");
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject1.address, subjectCredentialHash1);
    issuerStatus =  await aCR.getIssuerCredentialStatus(issuer1.address, issuerCredentialHash1);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus.status, issuerStatus.status);

    expect (subjectStatus.exists).to.equal(true);
    expect (subjectStatus.status).to.equal(Status.Valid);
    expect (issuerStatus.exists).to.equal(false);
    expect (issuerStatus.status).to.equal(Status.Valid);
    expect (credentialStatus).to.equal(Status.Valid);
    expect (receipt.events.length).to.equal(0)

    logStatus(2);
  
  });

  it("x.2 updateSubjectCredential subjectCredentialHash1 Status.AskDeletion", async function () {
    txResult = await aCR.connect(subject1).updateSubjectCredential(subjectCredentialHash1, Status.AskDeletion);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aCR.getSubjectCredentialStatus(subject1.address, subjectCredentialHash1);
    issuerStatus =  await aCR.getIssuerCredentialStatus(issuer1.address, issuerCredentialHash1);
    credentialStatus = await aCR.getCredentialStatus(subjectStatus.status, issuerStatus.status);

    expect (subjectStatus.exists).to.equal(true);
    expect (subjectStatus.status).to.equal(Status.AskDeletion);
    expect (issuerStatus.exists).to.equal(false);
    expect (issuerStatus.status).to.equal(Status.Valid);
    expect (receipt.events.length).to.equal(1);
    expect (credentialStatus).to.equal(Status.AskDeletion);
    receipt.events?.filter((x) => {
      expect (x.event).to.equal("CredentialUpdated");
      expect (x.args[0]).to.equal(subjectCredentialHash1);
      expect (x.args[1]).to.equal(Status.AskDeletion);
    );

    logStatus(2);
 
  });
*/

});