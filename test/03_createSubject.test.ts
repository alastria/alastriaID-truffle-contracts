import { GAS_OPT, getWallet, provider } from "../scripts/Blockchain";

import * as fs from "async-file";
import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { AID_NAMES, callProxy, sendProxy } from "../scripts/AlastriaID";
import { step } from "mocha-steps";
import { expect } from "chai";
import { keccak256 } from "ethers/lib/utils";

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
const PREV_TEST = "02_firstSP";
const CURRENT_TEST = "03_createSubject";
// Specific contants

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
// proxy of deployer
let adminIdentifier: string;
let issuerIdentifier: string;
let servProvIdentifier: string;
let subjectIdentifier: string;

describe("04 - Create subject", async () => {
  before(`Get data from test ${PREV_TEST}`, async () => {
    if (!(await fs.exists("./test/data"))) {
      await fs.mkdir("./test/data");
    }
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
    eidas = contracts[0].connect(admin);
    proxyAdmin = contracts[1].connect(admin);
    aidEntity = contracts[2].connect(admin);
    aidIssuer = contracts[3].connect(admin);
    aidSP = contracts[4].connect(admin);
    aidCR = contracts[5].connect(admin);
    aidPR = contracts[6].connect(admin);
    aidPKR = contracts[7].connect(admin);
    aidManager = contracts[8].connect(issuer);
    // AID proxy generated from deployer's account and used as pseudo-DID
    adminIdentifier = prevData.identifiers.admin;
    issuerIdentifier = prevData.identifiers.issuer;
    servProvIdentifier = prevData.identifiers.serviceProvider;
  });

  step(`Check data from test ${PREV_TEST} is OK`, async () => {
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

    console.log(`All data from test ${PREV_TEST} retreived OK`);
  });

  step("Prepare and Create AID for subject", async () => {
    // Prepare AID from issuer's account
    let receipt = await sendProxy(aidManager.connect(issuer), aidManager, "prepareAlastriaID", [
      subject.address,
    ]);
    expect(receipt).to.not.be.undefined;
    // Create AID from subject's account
    const publicKeyData = aidPKR.interface.encodeFunctionData("addKey", [subject.publicKey]);
    // Has to be a direct call from subject's account
    receipt = await (await aidManager.connect(subject).createAlastriaIdentity(publicKeyData, GAS_OPT)).wait();
    expect(receipt).to.not.be.undefined;
    // Check
    subjectIdentifier = (await callProxy(aidManager.connect(issuer), aidManager, "identityKeys", [
      subject.address,
    ]))![0];
    const publicKey = Promise.all([
      callProxy(aidManager.connect(subject), aidPKR, "getCurrentPublicKey", [subjectIdentifier]),
      callProxy(aidManager.connect(subject), aidPKR, "getPublicKeyStatus", [
        subjectIdentifier,
        keccak256(subject.publicKey)
      ]),
    ]);
    expect((await publicKey)[0]![0]).to.equal(subject.publicKey);
    expect((await publicKey)[1]!.status).to.equal(0);
    expect(subjectIdentifier).to.not.be.undefined;
    expect(subjectIdentifier).to.not.equal(subject.address);
  });

  step("Resume information from Subject", async () => {
    console.log(` Subject:
      - Address: ${subject.address}
      - Identity: ${subjectIdentifier}
     `);
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
          subject: subjectIdentifier
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
