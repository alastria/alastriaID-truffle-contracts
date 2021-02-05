import { getWallet, provider } from "../scripts/Blockchain";

import * as fs from "async-file";
import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { AID_NAMES, callProxy, callProxyBatch, sendProxy } from "../scripts/AlastriaID";
import { step } from "mocha-steps";
import { expect } from "chai";
import {
  keccak256,
  toUtf8Bytes,
} from "ethers/lib/utils";

// Typechain
import { ProxyAdmin } from "../typechain/ProxyAdmin";
import { Eidas } from "../typechain/Eidas";
import { AlastriaIdentityEntity as Entity } from "../typechain/AlastriaIdentityEntity";
import { AlastriaIdentityIssuer as Issuer } from "../typechain/AlastriaIdentityIssuer";
import { AlastriaIdentityServiceProvider as ServiceProvider } from "../typechain/AlastriaIdentityServiceProvider";
import { AlastriaCredentialRegistry as CredentialRegistry } from "../typechain/AlastriaCredentialRegistry";
import { AlastriaPresentationRegistry as PresentationRegistry } from "../typechain/AlastriaPresentationRegistry";
import { AlastriaPublicKeyRegistry as PublicKeyRegistry } from "../typechain/AlastriaPublicKeyRegistry";
import { AlastriaIdentityManager as Manager } from "../typechain/AlastriaIdentityManager";
import { AlastriaProxy as Proxy } from "../typechain/AlastriaProxy";

// General contants
const WALL_PASS = "password";
const PREV_TEST = "03_createSubject";
const CURRENT_TEST = "04_credential";
// Specific contants;
const CREDENTIAL = {
  claims: {
    name: "User/subject",
    id: "12121212G",
  },
  URI: "credential.uri.wtf",
  P_URI: "dont.know.what.this.is"
};
// -- Verifiable Credential
const FAKE_CRED = `blabla ${JSON.stringify(CREDENTIAL.claims)} blabla`;
const HASH_CRED = keccak256(toUtf8Bytes(FAKE_CRED));
// -- Verifiable Presentation
const FAKE_PRES = `blabla ${JSON.stringify(FAKE_CRED)} blabla more signatures blabla`;
const HASH_PRES = keccak256(toUtf8Bytes(FAKE_PRES));
// General variables
// Specific variables
// -- Wallets/Signers
let admin: Wallet;
let issuer: Wallet;
let servProv: Wallet;
let subject: Wallet;
// -- Factories
//let eidasFact: Promise<ContractFactory> | ContractFactory;
// -- Contracts
let eidas: Eidas;
let proxyAdmin: ProxyAdmin;
let aidEntity: Entity;
let aidIssuer: Issuer;
let aidSP: ServiceProvider;
let aidCR: CredentialRegistry;
let aidPR: PresentationRegistry;
let aidPKR: PublicKeyRegistry;
let aidManager: Manager;

// -- proxy of deployer
let adminIdentifier: string;
let issuerIdentifier: string;
let servProvIdentifier: string;
let subjectIdentifier: string;

describe("05 - Credential ==> Warning WorkInProgress <==", async () => {
  before(`Get data from test ${PREV_TEST}`, async () => {
    //const accounts = await ethers.getSigners();
    // Get data from JSON
    const prevData = JSON.parse(await fs.readFile(`./test/data/${PREV_TEST}.json`));
    // Get wallets info
    let wallets: any = Promise.all([
      getWallet(prevData.wallets.admin, WALL_PASS) as Promise<Wallet>,
      getWallet(prevData.wallets.issuer, WALL_PASS) as Promise<Wallet>,
      getWallet(prevData.wallets.serviceProvider, WALL_PASS) as Promise<Wallet>,
      getWallet(prevData.wallets.subject, WALL_PASS) as Promise<Wallet>,
    ]);

    let contracts: any = Promise.all([
      ethers.getContractAt("Eidas", prevData.contracts.eidas),
      ethers.getContractAt("ProxyAdmin", prevData.contracts.proxyAdmin),
      ethers.getContractAt(AID_NAMES.entity, prevData.contracts.aidEntity),
      ethers.getContractAt(AID_NAMES.issuer, prevData.contracts.aidIssuer),
      ethers.getContractAt(AID_NAMES.serviceProvider, prevData.contracts.aidSP),
      ethers.getContractAt(AID_NAMES.credentialRegistry, prevData.contracts.aidCR),
      ethers.getContractAt(AID_NAMES.presentationRegistry, prevData.contracts.aidPR),
      ethers.getContractAt(AID_NAMES.publicKeyRegistry, prevData.contracts.aidPKR),
      ethers.getContractAt(AID_NAMES.manager, prevData.contracts.aidManager),
    ]);
    wallets = await wallets;
    admin = wallets[0].connect(provider);
    issuer = wallets[1].connect(provider);
    servProv = wallets[2].connect(provider);
    subject = wallets[3].connect(provider);
    contracts = await contracts;
    eidas = contracts[0].connect(provider);
    proxyAdmin = contracts[1].connect(provider);
    aidEntity = contracts[2].connect(provider);
    aidIssuer = contracts[3].connect(provider);
    aidSP = contracts[4].connect(provider);
    aidCR = contracts[5].connect(provider);
    aidPR = contracts[6].connect(provider);
    aidPKR = contracts[7].connect(provider);
    aidManager = contracts[8].connect(provider);
    // AID proxy generated from deployer's account and used as pseudo-DID
    adminIdentifier = prevData.identifiers.admin;
    issuerIdentifier = prevData.identifiers.issuer;
    servProvIdentifier = prevData.identifiers.serviceProvider;
    subjectIdentifier = prevData.identifiers.subject;
  });

  step(`Should check data from test ${PREV_TEST} is OK`, async () => {
    expect(admin.address).to.not.be.undefined;
    expect(issuer.address).to.not.be.undefined;
    expect(servProv.address).to.not.be.undefined;
    expect(subject.address).to.not.be.undefined;
    expect(eidas.address).to.not.be.undefined;
    expect(proxyAdmin.address).to.not.be.undefined;
    expect(aidEntity.address).to.not.be.undefined;
    expect(aidIssuer.address).to.not.be.undefined;
    expect(aidSP.address).to.not.be.undefined;
    expect(aidCR.address).to.not.be.undefined;
    expect(aidPR.address).to.not.be.undefined;
    expect(aidPKR.address).to.not.be.undefined;
    expect(aidManager.address).to.not.be.undefined;
    expect(adminIdentifier).to.not.be.undefined;
    expect(issuerIdentifier).to.not.be.undefined;
    expect(servProvIdentifier).to.not.be.undefined;
    expect(subjectIdentifier).to.not.be.undefined;

    console.log(`All data from test ${PREV_TEST} retreived OK`);
  });

  step("Should create fake credetial and register hashes", async () => {
    let result = await sendProxy(aidManager.connect(subject), aidCR, "addSubjectCredential", [
      HASH_CRED,
      CREDENTIAL.URI,
    ]);
    expect(result).not.to.be.undefined;
    result = await sendProxy(aidManager.connect(subject), aidCR, "addIssuerCredential", [HASH_CRED]);
    expect(result).not.to.be.undefined;
  });

  step("Should get and check fake credential hash", async () => {

    let result = await callProxyBatch(
      aidManager.connect(subject),
      [aidCR, aidCR],
      ["getSubjectCredentialList", "getSubjectCredentialStatus"],
      [[subjectIdentifier], [subjectIdentifier, HASH_CRED]]
    );
    expect(result).to.not.be.undefined;
    //console.log(result);
    console.log(`
    Credential:
      - Hash: ${result![0][1][0]},
      - Status: ${result![1].status} ${result![1].status == 0 ? "(Valid)" : ""}`);
    expect(result![0][1][0]).to.equal(HASH_CRED);
    expect(result![1].status).to.equal(0);
  });

  step("Should register the verifiable presentation - subject side", async () => {
    const result = await sendProxy(aidManager.connect(subject), aidPR, "addSubjectPresentation", [
      HASH_PRES,
      CREDENTIAL.P_URI,
    ]);
    expect(result).not.to.be.undefined;
    const presStatus = await callProxy(aidManager.connect(subject), aidPR, "getSubjectPresentationStatus", [subjectIdentifier, HASH_PRES]);
    //console.log(presStatus);
    expect(presStatus).not.to.be.undefined;
    expect(presStatus!.exists).to.equal(true);
    expect(presStatus!.status).to.equal(0); // valid
  });

  step("Should update the verifiable presentation as 'Received' - SP side", async () => {
    const result = await sendProxy(aidManager.connect(servProv), aidPR, "updateReceiverPresentation", [
      HASH_PRES,
      1 // Reveived
    ]);
    expect(result).not.to.be.undefined;
    const presStatus = await callProxy(aidManager.connect(servProv), aidPR, "getReceiverPresentationStatus", [servProvIdentifier, HASH_PRES]);
    console.log(presStatus);
    expect(presStatus).not.to.be.undefined;
    expect(presStatus!.exists).to.equal(true);
    expect(presStatus!.status).to.equal(0);
  });

  after("Store test information", async () => {
    await fs.writeFile(
      `./test/data/${CURRENT_TEST}.json`,
      JSON.stringify({
        wallets: {
          admin: admin.address,
          issuer: issuer.address,
          serviceProvider: servProv.address,
          subject: subject.address,
        },
        identifiers: {
          admin: adminIdentifier,
          issuer: issuerIdentifier,
          serviceProvider: servProvIdentifier,
          subject: subjectIdentifier,
        },
        contracts: {
          eidas: eidas.address,
          proxyAdmin: proxyAdmin.address,
          aidEntity: aidEntity.address,
          aidIssuer: aidIssuer.address,
          aidSP: aidSP.address,
          aidCR: aidCR.address,
          aidPR: aidPR.address,
          aidPKR: aidPKR.address,
          aidManager: aidManager.address,
        },
      })
    );
    console.log(`Test ${CURRENT_TEST} data saved in ./test/data/${CURRENT_TEST}.json`);
  });
});
