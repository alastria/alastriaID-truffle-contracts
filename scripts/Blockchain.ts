import { Contract, providers, Wallet, Event } from "ethers";
import { ethers } from "hardhat";
import { FactoryOptions } from "hardhat/types";
import * as fs from "async-file";

export const provider = ethers.provider;

export type TransactionResponse = providers.TransactionResponse;
export type TransactionReceipt = providers.TransactionReceipt;

// gas default options
export const GAS_OPT = {
  gasLimit: 0x23c3ffff, //"0xffffffff",
  gasPrice: "0x00",
};
/**
 *  Async funtion that creates a new wallet and stores it encripted in the path specified.
 *
 * @dev If alrready created, it decrypts and returns it.
 *
 * @param path to store the new generated wallet
 * @param password used to encript and decript the wallet
 * @param entropy used to add random to the private key
 *
 * @return wallet the instance of the Wallet created, unencrypted and ready to use
 */
export const createWallet = async (
  path: string,
  password: string,
  entropy?: string
): Promise<Wallet | undefined> => {
  let wallet: Wallet | undefined;
  try {
    // if not exists, create save in wallets and keystores (encypted)
    if (!(await fs.exists(path))) {
      console.log(`${path} does not exists, creating new one`);
      if (entropy) {
        wallet = Wallet.createRandom(entropy);
      } else {
        wallet = Wallet.createRandom();
      }
      wallet = wallet.connect(ethers.provider);
      const encWallet = wallet.encrypt(password);
      fs.writeFile(path, await encWallet);
    } else {
      // if exists, read, decrypt and add to wallets array
      const encWallet = JSON.parse(await fs.readFile(path));
      wallet = await Wallet.fromEncryptedJson(JSON.stringify(encWallet), password);
      wallet = wallet.connect(ethers.provider);
    }
  } catch (error) {
    console.error(`ERROR: Cannot create or retreive wallet: ${error.stack}`);
  }
  return wallet;
};

/**
 * Gets the Wallets (without decryp them) as an array of strings from json
 * @param path the path where wallets are stored. Defaults to "keystore"
 */
export const getWallets = async (path?: string) => {
  try {
    path = path ? path : "./keystore";
    let readWallets: Promise<string>[] = [];
    let encWallets: any[] = [];

    const fileWallets = await fs.readdir(path);
    for (let index = 0; index < fileWallets.length; index++) {
      readWallets.push(fs.readFile(`${path}/${fileWallets[index]}`));
    }

    (await Promise.all(readWallets)).forEach((wallet) => {
      encWallets.push(JSON.parse(wallet));
    });

    return encWallets;
  } catch (error) {
    console.error(`ERROR: Cannot retreive wallets: ${error.stack}`);
  }
};

/**
 * Gets the wallet from a Signer address and decrypts it
 * @param from Signer that should have a wallet with is address
 * @param password to decript the JSON encrypted wallet
 */
export const getWallet = async (address: string, password: string) => {
  try {
    const encWallets = (await getWallets())!;
    if (!encWallets || !encWallets[0] || !encWallets[0].address) {
      throw new Error("No wallets found");
    }

    let decWallet: Wallet | undefined;
    for (let index = 0; index < encWallets.length; index++) {
      if (
        (encWallets[index].address as string).toLowerCase() ==
        address.slice(2, address.length).toLowerCase()
      ) {
        decWallet = Wallet.fromEncryptedJsonSync(JSON.stringify(encWallets[index]), password);
      }
    }

    return decWallet;
  } catch (error) {
    console.error(`ERROR: Cannot retreive wallet: ${error.stack}`);
  }
};

/**
 * Deploys a contract
 * @param contractName name of the contract to deploy
 * @param factoryOpt contract factory options that includes libraries and Signer
 * @param deployParams parameters for the contract's constructor
 * @return contract deployed
 */
export const deploy = async (
  contractName: string,
  factoryOpt: FactoryOptions,
  deployParams?: unknown[]
): Promise<Contract | undefined> => {
  try {
    deployParams = deployParams ? deployParams : [];

    console.log(
      `deploying '${contractName}(${deployParams})' from '${await factoryOpt.signer!.getAddress()}' account`
    );
    // Deploy contract
    const contractFactory = await ethers.getContractFactory(contractName, factoryOpt);

    const contract = await contractFactory.deploy(...deployParams, GAS_OPT);
    return (await contract.deployed());
  } catch (error) {
    console.error(`ERROR: Cannot deploy Contract. ${error.stack}`);
  }
};

/**
 * Deploys an upgradeable contract using ProxyAdmin and TransparentUpgradeableProxy from OpenZeppelin
 *
 * @dev If proxyAdmin not passed as argument, it will be deployeda new one
 *
 * @param contractName name of the contract to be deployed
 * @param factoryOpt contract factory options that includes libraries and Signer
 * @param proxyAdmin (optional) address of a Proxy Admin contract
 * @param initParams (optional) parameters for the initialize function (contructor)
 * @return the deployed upgradeable contract and proxy admin contract if deployed here
 */
export const deployUpgradeable = async (
  contractName: string,
  factoryOpt: FactoryOptions,
  proxyAdmin?: string,
  initParams?: any[]
): Promise<Contract | [Contract, Contract] | undefined> => {
  try {
    let newProxyAdmin: Promise<Contract>;
    // contract factories
    const proxyAdminFact = ethers.getContractFactory("ProxyAdmin", factoryOpt.signer);
    const logicFact = ethers.getContractFactory(contractName, factoryOpt);
    //console.log((await logicFact).interface.functions)
    const tupFact = ethers.getContractFactory("TransparentUpgradeableProxy", factoryOpt.signer);
    // ~ Deploy (async)
    // -- deploy logic contract
    const logic = (await logicFact).deploy();
    let initData: string;
    //console.log(initParams);
    if (initParams && initParams.length > 0) {
      initData = (await logicFact).interface.encodeFunctionData("initialize", [...initParams]);
    } else {
      initData = (await logicFact).interface._encodeParams([], []);
    }
    //console.log(initData);
    // -- deploy a new proxyAdmin?
    if (!proxyAdmin) {
      newProxyAdmin = (await proxyAdminFact).deploy(GAS_OPT);
    }
    // -- deploy Transparent Upgradeable Proxy
    const tup = await (
      await (await tupFact).deploy(
        (await (await logic).deployed()).address,
        proxyAdmin ? proxyAdmin : (await newProxyAdmin!).address,
        initData,
        GAS_OPT
      )
    ).deployed();

    const contract = await ethers.getContractAt(contractName, tup.address, factoryOpt.signer);

    // returns the new deployed upgradeable contract and proxyAdmin if deployed here
    if (proxyAdmin) {
      return contract;
    } else {
      return [await (await newProxyAdmin!).deployed(), contract];
    }
  } catch (error) {
    console.error(`ERROR: Cannot deploying upgradeable contract. ${error.stack}`);
  }
};

export const deployUpgrBatch = async (
  contractsName: string[],
  factoryOpts: FactoryOptions[],
  proxyAdmin?: string,
  initParams?: any[][]
): Promise<Contract[] | [Contract, Contract[]] | undefined> => {
  try {
    // if not init params, set to empty array
    initParams = initParams ? initParams : [];
    if (contractsName.length != factoryOpts.length || contractsName.length != initParams.length) {
      throw Error(
        `length of parameter does not match: ${contractsName.length} vs ${factoryOpts.length}`
      );
    }
    let newProxyAdmin: string;
    const proxyAdminFact = await ethers.getContractFactory("ProxyAdmin", {
      signer: factoryOpts[0].signer,
    });
    // -- deploy a new proxyAdmin?
    newProxyAdmin = proxyAdmin ? proxyAdmin : (await proxyAdminFact.deploy(GAS_OPT)).address;
    let contracts: Contract[] = [];
    // Main logic forEach not working well
    for (let index = 0; index < contractsName.length; index++) {
      //console.log(initParams[index]);
      contracts.push(
        (await deployUpgradeable(
          contractsName[index],
          factoryOpts[index],
          newProxyAdmin,
          initParams[index]
        )) as Contract
      );
    }

    // returns the new deployed upgradeable contract and proxyAdmin if deployed here
    if (proxyAdmin) {
      return contracts;
    } else {
      return [await ethers.getContractAt("ProxyAdmin", newProxyAdmin), contracts];
    }
  } catch (error) {
    console.error(`ERROR: Cannot deploying upgradeable contract. ${error.stack}`);
  }
};

/**
 * Gets the events emited from a contract filtered by name and by event parameters
 *
 * @dev indexes must me of the length of the event
 * @dev indexes must be 'null' if not search for this param
 * @dev for event paramater filter to work, SC must define *indexex* in event definition
 *
 * @param contractInstance contract that emits the event
 * @param eventName name of the event to search for
 * @param indexes filters by the event parameters
 * @param onlyFirst whether or not to get only fist event
 * @param fromBlock block to start to search from
 * @param toBlock block to stop to search to
 * @return event or events found
 */
export const getEvents = async (
  contractInstance: Contract,
  eventName: string,
  indexes: any[],
  onlyFirst?: boolean,
  fromBlock?: number | string,
  toBlock?: number | string
): Promise<Event | Event[] | undefined> => {
  try {
    const filter = contractInstance.filters[eventName](...indexes);
    const events = await contractInstance.queryFilter(filter, fromBlock, toBlock);
    if (onlyFirst && events.length == 1) {
      return events[0];
    } else {
      return events;
    }
  } catch (error) {
    console.error(`ERROR: Cannot get any event. ${(error.stack, error.code)}`);
  }
};
