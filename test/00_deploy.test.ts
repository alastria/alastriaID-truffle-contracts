import { BigNumber, Wallet } from "ethers";
import { ethers, hardhatArguments } from "hardhat";

import * as fs from "async-file";
import { expect } from "chai";
import { step } from "mocha-steps";
import { callProxyBatch, deployAID, deployLibs, IAidTypes } from "../scripts/AlastriaID";
import { createWallet, deploy, provider, TransactionResponse } from "../scripts/Blockchain";
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

// General Contants
const WALL_NUMBER = 4;
const WALL_PASS = "password";
const WALL_ENTROPY = "EnTrOpY";
const CURRENT_TEST = "00_deploy";
// Specific Constants

// General variables
let wallets: Wallet[] = [];
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
let aidContracts: IAidTypes;
// proxy of admin
let adminIdentifier: string;

describe("Deploy Alastria Identity Contracts", async function () {
  //this.timeout
  before("Check initial Wallets or generate new ones", async () => {
    const accounts = await ethers.getSigners();
    /* accounts.forEach(async (signer) => {
      console.log(await signer.getAddress());
    }); */

    if (accounts.length < WALL_NUMBER) {
      console.warn(
        `Warning: the number of wallet created will be greater than the providers accounts length (${accounts.length}),
          so the remaining wallets will have a balance of 0 wei`
      );
    }

    let wallet: Promise<Wallet | undefined>;

    if (!(await fs.exists("./test/data"))) {
      await fs.mkdir("./test/data");
    }
    try {
      if (!(await fs.exists("./keystore"))) {
        await fs.mkdir("keystore");
      }
      // Asyncronously creates an array of ACC_NUMBER Wallets
      // Only takes almost the same amount of time to create only one
      let promWallets: Promise<Wallet | undefined>[] = [];
      for (let index = 0; index < WALL_NUMBER; index++) {
        wallet = createWallet(`./keystore/wallet_${index}.json`, WALL_PASS, WALL_ENTROPY);
        promWallets.push(wallet);
      }
      wallets = (await Promise.all(promWallets)) as Wallet[];
      /* // If other networks, coment the If structure first time
      if (hardhatArguments.network == "hardhat") { DEPRECATED*/
      for (let index = 0; index < WALL_NUMBER; index++) {
        if (hardhatArguments.network != "hardhat") {
          const unlocked = await provider.getSigner(index).unlock("");
          unlocked
            ? console.log(`Account "${await provider.getSigner(index).getAddress()}" unlocked`)
            : console.log(
                `Account "${await provider.getSigner(index).getAddress()}" CANNOT be unlocked`
              );
        }
        // Check if wallets has balance on this network
        if (
          parseInt((await wallets[index].getBalance())._hex, 16) <
          parseInt(BigNumber.from("0x10000000000000000")._hex, 16)
        ) {
          await ((await accounts[index].sendTransaction({
            to: wallets[index].address,
            value: BigNumber.from("0x56BC75E2D63100000"), //100 eth
          })) as TransactionResponse).wait(1);
        }
        console.log(`Wallet_${index}:
          - Address: ${wallets[index].address}
          - Balance: ${await wallets[index].getBalance()}`);
      }
      //}
      admin = wallets[0];
      issuer = wallets[1];
      servProv = wallets[2];
      subject = wallets[3];
    } catch (error) {
      console.error(error);
    }
  });

  step("Should deploy Proxy Admin contract", async () => {
    console.log("\n ==> Deploying Proxy Admin contract...\n");

    proxyAdmin = (await deploy("ProxyAdmin", { signer: admin })) as ProxyAdmin;

    console.log(`Proxy Admin successfully deployed:
      - Proxy Admin address: ${proxyAdmin.address}
      - Proxy Admin's owner: ${await proxyAdmin.callStatic.owner()}\n`);

    expect(await proxyAdmin.owner()).to.equal(
      await admin.getAddress(),
      `Proxy Admin's owner not equal admin address`
    );
  });

  step("should deploy eidas", async () => {
    console.log("\n ==> Deploy Eidas libraries...\n");
    eidas = (await deployLibs(admin)) as Eidas;
    console.log(`Eidas deployed at ${eidas.address}`);
    expect(eidas).to.not.be.undefined;
    expect(eidas.address).to.not.be.undefined;
  });

  step("Should deploy contracts using script", async () => {
    console.log("\n ==> Deploying contracts...\n");

    aidContracts = (await deployAID(admin, proxyAdmin.address, eidas.address))!;

    expect(aidContracts, "Answer from deployAID is undefined").to.not.be.undefined;
    expect(aidContracts.entity, "Entity contract undefined").to.not.be.undefined;
    expect(aidContracts.issuer, "Issuer contract undefined").to.not.be.undefined;
    expect(aidContracts.serviceProvider, "SP contract undefined").to.not.be.undefined;
    expect(aidContracts.credentialRegistry, "Credential registry contract undefined").to.not.be
      .undefined;
    expect(aidContracts.presentationRegistry, "Presentation registry contract undefined").to.not.be
      .undefined;
    expect(aidContracts.publicKeyRegistry, "PK registry contract undefined").to.not.be.undefined;
    expect(aidContracts.manager, "Manager contract undefined").to.not.be.undefined;

    adminIdentifier = (await aidContracts.manager.callStatic.identityKeys(admin.address)) as string;

    // General checks
    expect(
      await ((await ethers.getContractAt("ProxyAdmin", adminIdentifier)) as ProxyAdmin).owner()
    ).to.equal(aidContracts.manager.address);
    // -- Entity
    expect((await aidContracts.entity.getEntity(adminIdentifier))._active).to.be.true;
    // -- Issuer
    expect(await aidContracts.issuer.isIdentityIssuer(adminIdentifier)).to.be.true;
    expect(await aidContracts.issuer.getEidasLevel(adminIdentifier)).to.be.equal(4);
    // -- SP
    expect(await aidContracts.serviceProvider.isIdentityServiceProvider(adminIdentifier)).to.be
      .true;
  });

  step("Resume information from First AID", async () => {
    const results = callProxyBatch(
      aidContracts.manager.connect(admin),
      [aidContracts.issuer, aidContracts.issuer, aidContracts.serviceProvider, aidContracts.entity],
      ["isIdentityIssuer", "getEidasLevel", "isIdentityServiceProvider", "getEntity"],
      [[adminIdentifier], [adminIdentifier], [adminIdentifier], [adminIdentifier]]
    );
    const isIssuer: boolean = (await results)![0][0];
    const eidasLevel: number = (await results)![1][0];
    const isSP: boolean = (await results)![2][0];
    const entityRaw: any = (await results)![3];

    let entity = Object({
      name: entityRaw._name,
      cif: entityRaw._cif,
      urlLogo: entityRaw._url_logo,
      urlAID: entityRaw._url_createAID,
      urlAOA: entityRaw._url_AOA,
      valid: entityRaw._active,
    });
    console.log(` First AID:
      - Admin Address: ${admin.address}
      - Admin Identifier (Proxy): ${adminIdentifier}
      - Entity: ${logObject(entity)}
      - Issuer: ${logObject({ level: eidasLevel, valid: isIssuer })}
      - Service Provider: ${isSP}`);
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
        },
        contracts: {
          eidas: eidas.address,
          proxyAdmin: proxyAdmin.address,
          aidEntity: aidContracts.entity.address,
          aidIssuer: aidContracts.issuer.address,
          aidSP: aidContracts.serviceProvider.address,
          aidCR: aidContracts.credentialRegistry.address,
          aidPR: aidContracts.presentationRegistry.address,
          aidPKR: aidContracts.publicKeyRegistry.address,
          aidManager: aidContracts.manager.address,
        },
      })
    );
    console.log(`Test  ${CURRENT_TEST} data saved in ./test/data/${CURRENT_TEST}.json`);
  });
});
