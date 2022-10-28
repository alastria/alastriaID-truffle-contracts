const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

  var AlastriaPresentationRegistry; //contracts
  var aPR; //Contact Instance

  //Hashes
  const subjectPresentationHash1  = "0x1100000000123456789012345678901234567890123456789012345678901234";
  const subjectPresentationHash2  = "0x1200000000123456789012345678901234567890123456789012345678901234";
  const subjectPresentationHash3  = "0x1300000000123456789012345678901234567890123456789012345678901234";
  const subjectPresentationHash4  = "0x1400000000123456789012345678901234567890123456789012345678901234";
  const receiverPresentationHash1 = "0x2100000000123456789012345678901234567890123456789012345678901234";
  const receiverPresentationHash2 = "0x2200000000123456789012345678901234567890123456789012345678901234";
  const receiverPresentationHash3 = "0x2300000000123456789012345678901234567890123456789012345678901234";
  const receiverPresentationHash4 = "0x2400000000123456789012345678901234567890123456789012345678901234";
  const verboseLevel = 2;

  let Status = {
    "Valid": 0,
    "Received": 1,
    "AskDeletion": 2,
    "DeletionConfirmation": 3
  };

  type BCStatus {
    exists: boolean;
    status: Status;
  };

  type TBCStatus = [boolean, Status];

  // Call variables for Solidity Smart Contract
  var subject;
  var receiver;
  var subjectPresentationHash;
  var receiverPresentationHash;
  var sendStatus: Status;
  // Return Variables from Solidity Smart Contract
  var txResult;
  let receipt : ContractReceipt;
//  var subjectStatus: BCStatus;
  var subjectStatus: BCStatus = {exists:false, status:Status.Valid};
  var receiverStatus: BCStatus;
  var presentationStatus: Status;


  function logSend(verbosity) {
    if (verbosity <= verboseLevel) {
      console.log ("subject: " + subject.address + " receiver : " + receiver.address + " sendStatus: " + sendStatus);
      console.log ("subjectHash : " + subjectPresentationHash)¨;
      console.log ("receiverHash: " + receiverPresentationHash);
    }
  }

  function logStatus(verbosity) {
    if (verbosity <= verboseLevel) {
      /* More detailled view: log(2, "subject    : " , subjectStatus[0] , ", " , subjectStatus[1], ",", subjectStatus[1].c)*/
      console.log("subjectStatus : " + subjectStatus + " receiverStatus : " + receiverStatus + " presentationStatus: " + presentationStatus);
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
        assertStrictEqual (x.args.hash, eventHash, 'hash should be ' + eventHash);
        assertStrictEqual (x.args.status, eventStatus, 'emited status ' + x.args.status + ' should be ' + eventStatus);
        log (3, "x.args.status, eventStatus: " + x.args.status + ", " + eventStatus);
      }
    }
  }


describe("AlastriaPresentationRegistry Test Suite", function () {

  it("0 AlastriaPresentationRegistry deployment & getSigners (subject? & receiver?)", async function () {
    AlastriaPresentationRegistry = await ethers.getContractFactory("AlastriaPresentationRegistry");
    aPR = await AlastriaPresentationRegistry.deploy();
    await aPR.deployed();
    console.log('aPR deployed at:'+ aPR.address)
    signers = await ethers.getSigners();
    [owner,subject1,subject2,subject3, subject4,receiver1,receiver2, receiver3, receiver4, other] = signers;
  
  });

  it("1.0 Initial State ", async function() {
    log(2, "Test Set 1: Subject1, Receiver1, subjectPresentationHash1, receiverPresentationHash1. One by one transitions");
    subject = subject1;
    receiver = receiver1;
    subjectPresentationHash = subjectPresentationHash1;
    receiverPresentationHash = receiverPresentationHash1;

    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

  });

    //Test Set 1: Subject1, Receiver1, subjectPresentationHash1, receiverPresentationHash1. One by one transitions
  it('1.1 Initial Set for Subject1,  subjectPresentationHash1', async() => {
    console.log("1.1 inicio, subjectStatus:" + subjectStatus);
    log(3, JSON.stringify(subjectStatus));
    logSend(2);

    txResult = await aPR.connect(subject).addSubjectPresentation(subjectPresentationHash, "Not used URL");
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    log(3, subjectStatus);

    checkStatus (subjectStatus, [true, Status.Valid], 'Should exist & be Valid');
    checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (presentationStatus, Status.Valid, 'should be Valid');
    checkEvent (receipt, 0);
  });

  it('1.2 Second equal Set for Subject1, subjectPresentationHash1, will fail & revert', async() => {
      try {
          txResult = await aPR.connect(subject).addSubjectPresentation(subjectPresentationHash, "Not used URL");
          log(2, "");
          assert (false, "ERROR: Expected exception not raised");
          log(2, "");
      } catch (error) {
          log(2, "");
          log(2, "Expected exception caught:" + error);
          log(2, "Check nothing changed.");
          log(2, "");

          let lreceipt: ContractReceipt = await txResult.wait();
          receipt = lreceipt;
          subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
          receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
          presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
          logStatus(2);

          log(2, subjectStatus);

          checkStatus (subjectStatus, [true, Status.Valid], 'Should exist & be Valid');
          checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
          assertStrictEqual (presentationStatus, Status.Valid, 'should be Valid');
          checkEvent (receipt, 0);

      }
  });

  it('1.4 Change to invalid Status by subject1, will fail & revert', async() => {
  sendStatus = 10; // Invalid value
  logSend(2);
      try {
          txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);
          // txResult = await Presentation.updateSubjectPresentation(subjectPresentationHash1, 10, {from: subject1});
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
          subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
          receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
          presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
          logStatus(2);

          checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
          checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
          assertStrictEqual (presentationStatus, Status.Valid, 'should be Valid');
          checkEvent (receipt, 0);
      }
  });

  it('1.5 Change to invalid Status by Receiver1, will fail & revert', async() => {
      try {
          txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);
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
          subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
          receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
          presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
          logStatus(2);

          checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
          checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
          assertStrictEqual (presentationStatus, Status.Valid, 'should be Valid');
          checkEvent (receipt, 0);
      }
  });

  it('1.6 Change to AskDeletion by Receiver1, no change', async() => {
      sendStatus = Status.AskDeletion;
      txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);
      // txResult = await Presentation.updateReceiverPresentation(receiverPresentationHash1, Status.AskDeletion, {from: receiver1});

      let lreceipt: ContractReceipt = await txResult.wait();
      receipt = lreceipt;
      subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
      receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
      presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
      logStatus(2);

      checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
      checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
      assertStrictEqual (presentationStatus, Status.Valid, 'should be Valid');
      checkEvent (receipt, 0);
  });

  it('1.7 Change to Received by Subject1, no change', async() => {
      sendStatus = Status.Received;
      txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);

      let lreceipt: ContractReceipt = await txResult.wait();
      receipt = lreceipt;
      subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
      receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
      presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
      logStatus(2);

      checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
      checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
      assertStrictEqual (presentationStatus, Status.Valid, 'should be Valid');
      checkEvent (receipt, 0);
  })

  it('1.8 Change to Received by Receiver1', async() => {
    sendStatus = Status.Received;
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.Valid], 'Should not exist & be Valid');
    checkStatus (receiverStatus, [true, sendStatus], 'Should exist & be ' + sendStatus);
    assertStrictEqual (presentationStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "PresentationUpdated", receiverPresentationHash, sendStatus);
  })

  it('1.9 Change to AskDeletion by subject1', async() => {
    sendStatus = Status.AskDeletion;
    txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, sendStatus], 'Should not exist & be ' + sendStatus);
    checkStatus (receiverStatus, [true, Status.Received], 'Should exist & be ' + Status.Received);
    assertStrictEqual (presentationStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "PresentationUpdated", subjectPresentationHash, sendStatus);

  });

  it('1.10 Change back to Valid by subject1, no change', async() => {
    sendStatus = Status.Valid;
    txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be ' + Status.AskDeletion);
    checkStatus (receiverStatus, [true, Status.Received], 'Should exist & be ' + Status.Received);
    assertStrictEqual (presentationStatus, Status.AskDeletion, 'should be ' + Status.AskDeletion);
    checkEvent (receipt, 0);
  });

  it('1.11 Change again to Received by Receiver1, no change', async() => {
    sendStatus = Status.Received;
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be Status.AskDeletion');
    checkStatus (receiverStatus, [true, sendStatus], 'Should exist & be ' + sendStatus);
    assertStrictEqual (presentationStatus, Status.AskDeletion, 'should be ' + Status.AskDeletion);
    checkEvent (receipt, 0);
  });

  it('1.12 Change to DeletionConfirmation by Receiver1', async() => {
    sendStatus = Status.DeletionConfirmation;
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be Status.AskDeletion');
    checkStatus (receiverStatus, [true, sendStatus], 'Should exist & be ' + sendStatus);
    assertStrictEqual (presentationStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "PresentationUpdated", receiverPresentationHash, sendStatus);

  });

  it('1.13 Change back to Valid by subject1, no change', async() => {
    sendStatus = Status.Valid;
    txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be Status.AskDeletion');
    checkStatus (receiverStatus, [true, Status.DeletionConfirmation], 'Should exist & be ' + Status.DeletionConfirmation);
    assertStrictEqual (presentationStatus, Status.DeletionConfirmation, 'should be ' + Status.DeletionConfirmation);
    checkEvent (receipt, 0);
  });

  it('1.14 Change Back to Received by Receiver1, no change', async() => {
    sendStatus = Status.Received;
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);

    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be Status.AskDeletion');
    checkStatus (receiverStatus, [true, Status.DeletionConfirmation], 'Should exist & be ' + Status.DeletionConfirmation);
    assertStrictEqual (presentationStatus, Status.DeletionConfirmation, 'should be ' + Status.DeletionConfirmation);
    checkEvent (receipt, 0);
  });

  //Test Set 3: Subject2, Receiver2, subjectPresentationHash3, receiverPresentationHash3.
  // Direct jump to AskDeletion, Deleted and backtransitions
  it("3.0 Initial State ", async function() {
    log(2, "Test Set 3: Subject2, Receiver2, subjectPresentationHash3, receiverPresentationHash3.");
    log(2, "Test Set 3: Many Hashes in the middle. Direct Jump to AskDeletion and Deleted");

    subject = subject2;
    receiver = receiver2;
    subjectPresentationHash  = subjectPresentationHash3;
    receiverPresentationHash = receiverPresentationHash3;

    subjectStatus = await aPR.getSubjectPresentationStatus(subject2.address, subjectPresentationHash3);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver2.address, receiverPresentationHash3);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

  });

  it('3.1 Update to Received by subject2,  subjectPresentationHash3, no change', async function() {
    sendStatus = Status.Received;
    logSend(2);

    txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [false, Status.Valid], 'Should not exist & be Valid');
    checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (presentationStatus, Status.Valid, 'should be Valid');
    checkEvent (receipt, 0);
  });

  it('3.2 Update to AskDeletion (before Set to Valid) for subject2,  subjectPresentationHash3', async function() {
    sendStatus = Status.AskDeletion;
    logSend(2);
    txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, sendStatus], 'Should not exist & be ' + sendStatus);
    checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (presentationStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "PresentationUpdated", subjectPresentationHash, sendStatus);
  });

  it('3.3a Update again to AskDeletion for subject2,  subjectPresentationHash3, no change, no event', async function() {
    sendStatus = Status.AskDeletion;
    logSend(2);
    txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, sendStatus], 'Should not exist & be ' + sendStatus);
    checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (presentationStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 0);
  });

  it('3.3b Update back to Valid for subject2,  subjectPresentationHash3, no change, no event', async function() {
    sendStatus = Status.Valid;
    logSend(2);
    txResult = await aPR.connect(subject).updateSubjectPresentation(subjectPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should exist & be ' + Status.AskDeletion);
    checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (presentationStatus, Status.AskDeletion, 'should be ' + Status.AskDeletion);
    checkEvent (receipt, 0);
  });

  it('3.4 Update to Valid by receiver2,  receiverPresentationHash3, no change', async function() {
    sendStatus = Status.Valid;
    logSend(2);
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be ' + Status.AskDeletion);
    checkStatus (receiverStatus, [false, Status.Valid], 'Should not exist & be Valid');
    assertStrictEqual (presentationStatus, Status.AskDeletion, 'should be ' + Status.AskDeletion);
    checkEvent (receipt, 0);
  });


  it('3.5 Update to DeletionConfirmation (before Set to Received) for receiver2,  receiverPresentationHash3', async function() {
    sendStatus = Status.DeletionConfirmation;
    logSend(2);
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be ' + Status.AskDeletion);
    checkStatus (receiverStatus, [true, sendStatus], 'Should exist & be ' + sendStatus );
    assertStrictEqual (presentationStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 1, "PresentationUpdated", receiverPresentationHash, sendStatus);
  });

  it('3.6a Update again to DeletionConfirmation for receiver2, receiverPresentationHash3, no change, no event', async function() {
    sendStatus = Status.DeletionConfirmation;
    logSend(2);
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject.address, subjectPresentationHash);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver.address, receiverPresentationHash);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be ' + Status.AskDeletion);
    checkStatus (receiverStatus, [true, sendStatus], 'Should exist & be ' + sendStatus );
    assertStrictEqual (presentationStatus, sendStatus, 'should be ' + sendStatus);
    checkEvent (receipt, 0);
  });

  it('3.6b Update back to Received for receiver2, receiverPresentationHash3, no change, no event', async function() {
    sendStatus = Status.Received;
    logSend(2);
    txResult = await aPR.connect(receiver).updateReceiverPresentation(receiverPresentationHash, sendStatus);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject2.address, subjectPresentationHash3);
    receiverStatus = await aPR.getReceiverPresentationStatus(receiver2.address, receiverPresentationHash3);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus[1], receiverStatus[1]);
    logStatus(2);

    checkStatus (subjectStatus, [true, Status.AskDeletion], 'Should not exist & be ' + Status.AskDeletion);
    checkStatus (receiverStatus, [true, Status.DeletionConfirmation], 'Should exist & be ' + Status.DeletionConfirmation );
    assertStrictEqual (presentationStatus, Status.DeletionConfirmation, 'should be ' + Status.DeletionConfirmation);
    checkEvent (receipt, 0);
  });


/*  it("x.1 addSubjectPresentation subjectPresentationHash1", async function () {
    txResult = await aPR.connect(subject1).addSubjectPresentation(subjectPresentationHash1, "URI not used");
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject1.address, subjectPresentationHash1);
    receiverStatus =  await aPR.getReceiverPresentationStatus(receiver1.address, receiverPresentationHash1);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus.status, receiverStatus.status);

    expect (subjectStatus.exists).to.equal(true);
    expect (subjectStatus.status).to.equal(Status.Valid);
    expect (receiverStatus.exists).to.equal(false);
    expect (receiverStatus.status).to.equal(Status.Valid);
    expect (presentationStatus).to.equal(Status.Valid);
    expect (receipt.events.length).to.equal(0)

    logStatus(2);
  
  });

  it("x.2 updateSubjectPresentation subjectPresentationHash1 Status.AskDeletion", async function () {
    txResult = await aPR.connect(subject1).updateSubjectPresentation(subjectPresentationHash1, Status.AskDeletion);
    let lreceipt: ContractReceipt = await txResult.wait();
    receipt = lreceipt;
    subjectStatus = await aPR.getSubjectPresentationStatus(subject1.address, subjectPresentationHash1);
    receiverStatus =  await aPR.getReceiverPresentationStatus(receiver1.address, receiverPresentationHash1);
    presentationStatus = await aPR.getPresentationStatus(subjectStatus.status, receiverStatus.status);

    expect (subjectStatus.exists).to.equal(true);
    expect (subjectStatus.status).to.equal(Status.AskDeletion);
    expect (receiverStatus.exists).to.equal(false);
    expect (receiverStatus.status).to.equal(Status.Valid);
    expect (receipt.events.length).to.equal(1);
    expect (presentationStatus).to.equal(Status.AskDeletion);
    receipt.events?.filter((x) => {
      expect (x.event).to.equal("PresentationUpdated");
      expect (x.args[0]).to.equal(subjectPresentationHash1);
      expect (x.args[1]).to.equal(Status.AskDeletion);
    );

    logStatus(2);
 
  });
*/

});
