const ethers = require('ethers')
const fs = require('fs');
const keythereum = require('keythereum');

const reducedAbi = [
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "_identityServiceProvider",
        "type": "address"
      }
    ],
    "name": "addIdentityServiceProvider",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "_signAddress",
        "type": "address"
      }
    ],
    "name": "prepareAlastriaID",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "bytes",
        "name": "addPublicKeyCallData",
        "type": "bytes"
      }
    ],
    "name": "createAlastriaIdentity",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "identityKeys",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "_identityServiceProvider",
        "type": "address"
      }
    ],
    "name": "isIdentityServiceProvider",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "_identityIssuer",
        "type": "address"
      }
    ],
    "name": "isIdentityIssuer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "_destination",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "_data",
        "type": "bytes"
      }
    ],
    "name": "delegateCall",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "_identityIssuer",
        "type": "address"
      },
      {
        "internalType": "enum Eidas.EidasLevel",
        "name": "_level",
        "type": "uint8"
      }
    ],
    "name": "addIdentityIssuer",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
const firstId = './accounts/serviceProvider-643266eb3105f4bf8b4f4fec50886e453f0da9ad'
const addresses = JSON.parse(fs.readFileSync('./addresses.json', 'utf-8'))
const identityManagerContractAddress = addresses.AlastriaIdentityManager


// wallets
let firstIdWallet
let newServiceProviderWallet
// provider
let provider;
// contracts
let identityManagerContract;
let newServiceProviderIdentityManagerContract;

const createProvider = () => {
  provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
}

// wallets
const instanciateFirstIdentityWallet = async () => {
  const password = 'Passw0rd';
  firstIdWallet = JSON.parse(fs.readFileSync(firstId, 'utf8'))
  const firstIdKey = keythereum.recover(password, JSON.parse(fs.readFileSync(firstId, 'utf8'))).toString('hex');
  firstIdWallet = new ethers.Wallet(firstIdKey, provider);
}

const instanciateNewIdentityWallet = async (privateKey) => {
  newServiceProviderWallet = new ethers.Wallet(privateKey, provider);
}

// contracts
const instanciateFirstIdentityContract =  () => {
  identityManagerContract = new ethers.Contract(identityManagerContractAddress, reducedAbi, firstIdWallet);
}

const instanciateNewIdentityContract =  () => {
  newServiceProviderIdentityManagerContract = new ethers.Contract(identityManagerContractAddress, reducedAbi, newServiceProviderWallet);
}

// did
const getDid = async (address) => {
  const did = await identityManagerContract.identityKeys(address)
  console.log(did)
  return did
}

// is ID provider
const isIdentityServiceProvider = async (address) => {
  const result = await identityManagerContract.isIdentityServiceProvider(address)
  console.log(result)
}

// is ID issuer
const isIdentityIssuer = async (address) => {
  const result = await identityManagerContract.isIdentityIssuer(address)
  console.log(result)
}

// prepare alastria ID
const delegatePrepareAlastriaID = async (address) => {
  const result = await identityManagerContract.delegateCall(
    identityManagerContractAddress,
    0,
    prepareAlastriaID(address)
  );
  console.log('esperando confirmaciones')
  await result.wait(2)
}

const prepareAlastriaID = async (address) => {
  var iface = new ethers.utils.Interface(reducedAbi)
  const data = iface.encodeFunctionData('prepareAlastriaID', [address])
  return data;
}

// create Alastria ID
const createAlastriaIdentity = async (publicKey) => {

  const result = await newServiceProviderIdentityManagerContract.createAlastriaIdentity(generatePublicKeyCallData(publicKey));
  console.log('esperando confirmaciones')
  await result.wait(2)
}

const generatePublicKeyCallData = (publicKey) => {

  const abi = [ {
    "constant": false,
    "inputs": [
      {
        "internalType": "string",
        "name": "publicKey",
        "type": "string"
      }
    ],
    "name": "addKey",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  } ];
  var iface = new ethers.utils.Interface(abi)
  const data = iface.encodeFunctionData('addKey', [publicKey])
  return data;
}

const generateCreateIdentiytyCallData = (publicKey) => {

  const abi = [ {
    "constant": false,
    "inputs": [
      {
        "internalType": "bytes",
        "name": "addPublicKeyCallData",
        "type": "bytes"
      }
    ],
    "name": "createAlastriaIdentity",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }];
  var iface = new ethers.utils.Interface(abi)
  const data = iface.encodeFunctionData('createAlastriaIdentity', [generatePublicKeyCallData(publicKey)])
  return data;
}

// addIdentityServiceProvider 
const delegateAddIdentityServiceProvider = async (did) => {
  const result = await identityManagerContract.delegateCall(
    identityManagerContractAddress,
    0,
    addIdentityServiceProvider(did)
  );
  console.log('esperando confirmaciones')
  await result.wait(2)
}

const addIdentityServiceProvider = async (did) => {
  var iface = new ethers.utils.Interface(reducedAbi)
  const data = iface.encodeFunctionData('addIdentityServiceProvider', [did])
  return data;
}

// addIdentityIssuer
const delegateAddIdentityIssuer = async (did, eidasLevel) => {
  const result = await identityManagerContract.delegateCall(
    identityManagerContractAddress,
    0,
    addIdentityIssuer(did, eidasLevel)/*, 
    {gasLimit: 600000}*/
  );
  console.log('esperando confirmaciones')
  await result.wait(2)
}

const addIdentityIssuer = async (did, eidasLevel) => {
  var iface = new ethers.utils.Interface(reducedAbi)
  const data = iface.encodeFunctionData('addIdentityIssuer', [did, eidasLevel])
  return data;
}


//MAIN
(async () => {
  try {
    if (!process.env.KEY) {
      throw new Error("A KEY is needed");
    }
    const key = process.env.KEY;

    // first identity & check
    await createProvider();
    await instanciateFirstIdentityWallet();
    await instanciateFirstIdentityContract();
    const did = await getDid(firstIdWallet.address);
    await isIdentityServiceProvider(did);
    await isIdentityIssuer(did);

    // new identity wallet and contract
    await instanciateNewIdentityWallet(key);
    await instanciateNewIdentityContract();
 
    // prepare & create
    await delegatePrepareAlastriaID(newServiceProviderWallet.address);
    await createAlastriaIdentity(newServiceProviderWallet.publicKey);
    const serviceDid = await getDid(newServiceProviderWallet.address)

    // add identity service provider
    await delegateAddIdentityServiceProvider(serviceDid)
    await isIdentityServiceProvider(serviceDid);

    // add identity issuer
    await delegateAddIdentityIssuer(serviceDid, 3);
    await isIdentityIssuer(serviceDid);
    

  } catch (error) {
    console.error(error.message)
  }
  

})()
