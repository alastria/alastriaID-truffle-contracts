import { Contract, Signer, Wallet } from "ethers";
import { isAddress, Result } from "ethers/lib/utils";
import { FactoryOptions } from "hardhat/types";
import {
  deploy,
  deployUpgradeable,
  deployUpgrBatch,
  GAS_OPT,
  TransactionResponse,
} from "./Blockchain";

// Typechain
import { Eidas } from "../typechain/Eidas";
import { AlastriaIdentityEntity as Entity } from "../typechain/AlastriaIdentityEntity";
import { AlastriaIdentityIssuer as Issuer } from "../typechain/AlastriaIdentityIssuer";
import { AlastriaIdentityServiceProvider as ServiceProvider } from "../typechain/AlastriaIdentityServiceProvider";
import { AlastriaCredentialRegistry as CredentialRegistry } from "../typechain/AlastriaCredentialRegistry";
import { AlastriaPresentationRegistry as PresentationRegistry } from "../typechain/AlastriaPresentationRegistry";
import { AlastriaPublicKeyRegistry as PublicKeyRegistry } from "../typechain/AlastriaPublicKeyRegistry";
import { AlastriaIdentityManager as Manager } from "../typechain/AlastriaIdentityManager";
import { AlastriaProxy as Proxy } from "../typechain/AlastriaProxy";

export const AID_NAMES = {
  entity: "AlastriaIdentityEntity",
  issuer: "AlastriaIdentityIssuer",
  manager: "AlastriaIdentityManager",
  serviceProvider: "AlastriaIdentityServiceProvider",
  proxy: "AlastriaProxy",
  credentialRegistry: "AlastriaCredentialRegistry",
  presentationRegistry: "AlastriaPresentationRegistry",
  publicKeyRegistry: "AlastriaPublicKeyRegistry",
};

export interface IAidTypes {
  entity: Entity;
  issuer: Issuer;
  serviceProvider: ServiceProvider;
  credentialRegistry: CredentialRegistry;
  presentationRegistry: PresentationRegistry;
  publicKeyRegistry: PublicKeyRegistry;
  manager: Manager;
}

export const deployLibs = async (deployer: Signer | Wallet) => {
  try {
    return await (await deploy("Eidas", { signer: deployer }))!.deployed();
  } catch (error) {
    console.error(`Cannot deploy libraries. ${error.stack}`);
  }
};

export const deployAID = async (
  deployer: Wallet,
  proxyAdmin: string,
  eidas?: Contract | string
) => {
  try {
    let factOptLib: FactoryOptions;
    const factOpt: FactoryOptions = {
      signer: deployer,
    };

    console.log(
      `Deploying Alastria Identity Smart Contracts on '${
        (await deployer.provider?.getNetwork())?.name
      }' Network`
    );

    // + link or deploy Eidas library
    if (typeof eidas == "string" && !isAddress(eidas)) {
      throw new Error("Eidas string is not a valid address");
    } else if (eidas) {
      // eidas can be a address or a Contract (can't be undefined)
      factOptLib = {
        libraries: {
          Eidas: typeof eidas == "string" ? eidas : eidas.address,
        },
        signer: deployer,
      };
    } else {
      // eidas undefined, await for in case deployment
      eidas = await deployLibs(deployer) as Eidas;
      factOptLib = {
        libraries: {
          Eidas: eidas.address,
        },
        signer: deployer,
      };
    }
    // at this point Eidas should be a Contract
    eidas = eidas as Eidas;

    // Main Logic
    // deploy independent contracts
    const aidContracts = await deployUpgrBatch(
      [
        AID_NAMES.entity,
        AID_NAMES.issuer,
        AID_NAMES.serviceProvider,
        AID_NAMES.credentialRegistry,
        AID_NAMES.presentationRegistry,
        AID_NAMES.publicKeyRegistry,
      ],
      [factOpt, factOptLib, factOpt, factOpt, factOpt, factOpt],
      proxyAdmin,
      [
        [],
        [],
        [],
        ["0x0000000000000000000000000000000000000000"],
        ["0x0000000000000000000000000000000000000000"],
        ["0x0000000000000000000000000000000000000000"],
      ]
    );
    if (!aidContracts || aidContracts.length != 6) {
      throw new Error("Bad batch deployment");
    }

    // init data parameter for manager
    /* const publicKeyCallData = aidContracts[6].interface.encodeFunctionData("addKey", [
      deployer.publicKey,
    ]); */
    aidContracts.push(
      (await deployUpgradeable(AID_NAMES.manager, factOpt, proxyAdmin, [
        aidContracts[0].address, // Entity
        aidContracts[1].address, // Issuer
        aidContracts[2].address, // Service Provider
        aidContracts[3].address, // CR
        aidContracts[4].address, // PR
        aidContracts[5].address // PKR
        //publicKeyCallData,
      ])) as Contract
    );

    return {
      entity: aidContracts[0] as Entity,
      issuer: aidContracts[1] as Issuer,
      serviceProvider: aidContracts[2] as ServiceProvider,
      credentialRegistry: aidContracts[3] as CredentialRegistry,
      presentationRegistry: aidContracts[4] as PresentationRegistry,
      publicKeyRegistry: aidContracts[5] as PublicKeyRegistry,
      manager: aidContracts[6] as Manager,
    } as IAidTypes;
  } catch (error) {
    console.error(`Cannot deploy Alastria ID contracts. ${error.stack}`);
  }
};

export const callProxyBatch = async (
  manager: Contract,
  contractsToCall: Contract[],
  functionNames: string[],
  parameters: any[][]
) => {
  try {
    let results: Promise<Result>[] = [];
    if (!(contractsToCall.length == functionNames.length)) {
      throw new Error(
        `length does not match: ${contractsToCall.length} vs ${functionNames.length}`
      );
    }

    for (let index = 0; index < contractsToCall.length; index++) {
      results.push(
        callProxy(
          manager,
          contractsToCall[index],
          functionNames[index],
          parameters[index]
        ) as Promise<Result>
      );
    }
    return await Promise.all(results);
  } catch (error) {
    console.error(`Cannot make batch delegate call though Alastria proxy. ${error.stack}`);
  }
};

export const sendProxy = async (
  manager: Contract,
  contractToCall: Contract,
  functionName: string,
  parameters: any[]
) => {
  try {
    const callData = contractToCall.interface.encodeFunctionData(functionName, parameters);
    const receipt = await ((await manager.delegateCall(
      contractToCall.address,
      0,
      callData,
      GAS_OPT
    )) as TransactionResponse).wait();

    return receipt;
  } catch (error) {
    console.error(`Cannot make delegate send though Alastria proxy. ${error.stack}`);
  }
};

export const callProxy = async (
  manager: Contract,
  contractToCall: Contract,
  functionName: string,
  parameters: any[]
) => {
  try {
    const callData = contractToCall.interface.encodeFunctionData(functionName, parameters);
    const encodedResult = await manager.callStatic.delegateCall(
      contractToCall.address,
      0,
      callData
    );

    return contractToCall.interface.decodeFunctionResult(functionName, encodedResult);
  } catch (error) {
    console.error(`Cannot make delegate call though Alastria proxy. ${error.stack}`);
  }
};
