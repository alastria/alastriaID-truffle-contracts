import { GAS_OPT, getWallet, provider } from "../scripts/Blockchain";

import * as fs from "async-file";
import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { AID_NAMES, callProxy, callProxyBatch, sendProxy } from "../scripts/AlastriaID";
import { step } from "mocha-steps";
import { expect } from "chai";
import { logObject } from "../scripts/Utils";

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
const PREV_TEST = "00_deploy";
const CURRENT_TEST = "01_firstIssuer";
// Specific contants
const NAME = "First Issuer";
const CIF = "I0000000000";
const URL_LOGO = "https://fist.issuer.my/logo";
const URL_AID = "https://fist.issuer.my/aid";
const URL_AOA = "https://fist.issuer.my/aoa";
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

describe("02 - Create first Issuer (with Entity)", async () => {
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
    aidManager = contracts[8].connect(admin);
    // AID proxy generated from deployer's account and used as pseudo-DID
    adminIdentifier = prevData.identifiers.admin;
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

    console.log(`All data from test ${PREV_TEST} retreived OK`);
  });

  step("Prepare and Create AID for issuer", async () => {
    // Prepare AID from deployer's account
    let receipt = await sendProxy(aidManager, aidManager, "prepareAlastriaID", [issuer.address]);
    expect(receipt).to.not.be.undefined;
    // Create AID from issuer's account
    const publicKeyData = aidPKR.interface.encodeFunctionData("addKey", [issuer.publicKey]);
    const aidManagerIssuer = aidManager.connect(issuer);
    // Has to be a direct call from issuer account
    receipt = await (await aidManagerIssuer.createAlastriaIdentity(publicKeyData, GAS_OPT)).wait();
    expect(receipt).to.not.be.undefined;
    // Check
    issuerIdentifier = (await callProxy(aidManager, aidManager, "identityKeys", [
      issuer.address,
    ]))![0];
    expect(issuerIdentifier).to.not.be.undefined;
    expect(issuerIdentifier).to.not.equal(issuer.address);
  });

  step("Create issuer in the issuers contract", async () => {
    // Add the new issuer using the deployer's identity. Eidas level 4 = "High"
    const receipt = await sendProxy(aidManager, aidIssuer, "addIdentityIssuer", [
      issuerIdentifier,
      4,
    ]);
    expect(receipt).to.not.be.undefined;

    // Check new issuer's data
    const results = await callProxyBatch(
      aidManager,
      [aidIssuer, aidIssuer],
      ["isIdentityIssuer", "getEidasLevel"],
      [[issuerIdentifier], [issuerIdentifier]]
    );
    //console.log(results);

    //////////////////////////////////////////////////////////////
    //console.log(isIssuerE);
    // decode output
    const isIssuer = results![0][0];
    const eidasLevel = results![1][0];
    expect(isIssuer).to.be.true;
    expect(eidasLevel).to.equal(4);
    console.log(`Issuer created with Eidas = ${eidasLevel} (High)`);
  });
  // From now on this issuer is at the same level of deployer issuer
  step("Add entity data", async () => {
    // Add the new Entity using the deployer's identity
    const receipt = await sendProxy(aidManager, aidEntity, "addEntity", [
      issuerIdentifier,
      NAME,
      CIF,
      URL_LOGO,
      URL_AID,
      URL_AOA,
      true,
    ]);
    expect(receipt).to.not.be.undefined;

    const data = (await callProxy(aidManager, aidEntity, "getEntity", [issuerIdentifier]))!;
    expect(data).to.not.be.undefined;
    let entity = Object({
      name: data._name,
      cif: data._cif,
      urlLogo: data._url_logo,
      urlAID: data._url_createAID,
      urlAOA: data._url_AOA,
      valid: data._active,
    });

    expect(entity.name).to.equal(NAME);
    expect(entity.cif).to.equal(CIF);
    expect(entity.urlLogo).to.equal(URL_LOGO);
    expect(entity.urlAID).to.equal(URL_AID);
    expect(entity.urlAOA).to.equal(URL_AOA);
    expect(entity.valid).to.be.true;
  });
  step("Resume information from First Issuer", async () => {
    const results = (await callProxyBatch(
      aidManager,
      [aidEntity, aidIssuer, aidIssuer, aidSP],
      ["getEntity", "getEidasLevel", "isIdentityIssuer", "isIdentityServiceProvider"],
      [[issuerIdentifier], [issuerIdentifier], [issuerIdentifier], [issuerIdentifier]]
    ))!;

    let entity = Object({
      name: results[0]._name,
      cif: results[0]._cif,
      urlLogo: results[0]._url_logo,
      urlAID: results[0]._url_createAID,
      urlAOA: results[0]._url_AOA,
      valid: results[0]._active,
    });
    console.log(` First Issuer:
      - Address: ${issuer.address}
      - Identity: ${issuerIdentifier}
      - Entity: ${logObject(entity)}
      - Issuer: ${logObject({ level: results[1][0], valid: results[2][0] })}
      - Service Provider: ${results[3][0]}`);
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
