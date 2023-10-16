import { SecretNetworkClient, Wallet, coinsFromString } from "secretjs";
// import {
//   AxelarAssetTransfer,
//   AxelarQueryAPI,
//   Environment,
//   CHAINS,
//   AxelarGMPRecoveryAPI,
// } from "@axelar-network/axelarjs-sdk";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const wallet = new Wallet(process.env.MNEMONIC);

const contract_wasm = fs.readFileSync("../contract.wasm.gz");

let codeId = 1319;
let contractCodeHash =
  "e16a8979384b624ac98077a825f28151417ad2fbf39df597fb0b865a74285e6d";
let contractAddress = "secret17quulca2rwr25epvzp9lm9s7m6r9w09e9633qf";

const secretjs = new SecretNetworkClient({
  chainId: "secret-4",
  url: "https://lcd.mainnet.secretsaturn.net",
  wallet: wallet,
  walletAddress: wallet.address,
});

// const secretjs = new SecretNetworkClient({
//   chainId: "pulsar-3",
//   url: "https://api.pulsar3.scrttestnet.com",
//   wallet: wallet,
//   walletAddress: wallet.address,
// });

let upload_contract = async () => {
  let tx = await secretjs.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasm_byte_code: contract_wasm,
      source: "",
      builder: "",
    },
    {
      gasLimit: 4_000_000,
    }
  );

  const codeId = Number(
    tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
      .value
  );

  console.log("codeId: ", codeId);

  const contractCodeHash = (
    await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
  ).code_hash;
  console.log(`Contract hash: ${contractCodeHash}`);

  //   console.log(tx);
};

// upload_contract();

let instantiate_contract = async () => {
  // Create an instance of the Counter contract, providing a starting count
  const initMsg = {};
  let tx = await secretjs.tx.compute.instantiateContract(
    {
      code_id: codeId,
      sender: wallet.address,
      code_hash: contractCodeHash,
      init_msg: initMsg,
      label: "Secret EVM AXELAR " + Math.ceil(Math.random() * 10000),
    },
    {
      gasLimit: 400_000,
    }
  );

  //Find the contract_address in the logs
  const contractAddress = tx.arrayLog.find(
    (log) => log.type === "message" && log.key === "contract_address"
  ).value;

  console.log(contractAddress);
};

// instantiate_contract();

let send_message_evm = async () => {
  const tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: contractAddress,
      msg: {
        send_message_evm: {
          destination_chain: "Polygon",
          destination_address: "0x13ACd5794A3136E7fAc8f9727259930fcab1290F",
          message: "october 14 seanrad",
        },
      },
      code_hash: contractCodeHash,
      sent_funds: coinsFromString(
        "1000000ibc/A7CBAF118AC24A896DC46A098FE9FA2A588A36A2F0239913229D3A11D92E7B2E"
      ),
    },
    { gasLimit: 100_000 }
  );

  console.log(tx);
};
// send_message_evm();

let get_stored_message = async () => {
  let query = await secretjs.query.compute.queryContract({
    contract_address: contractAddress,
    query: {
      get_stored_message: {},
    },
    code_hash: contractCodeHash,
  });

  console.log(query);
};

// get_stored_message();

// secretcli tx wasm execute "secret17quulca2rwr25epvzp9lm9s7m6r9w09e9633qf" '{"send_message_evm":{"destination_chain":"Polygon","destination_address":"0x13ACd5794A3136E7fAc8f9727259930fcab1290F"}}' --amount 150000ibc/A7CBAF118AC24A896DC46A098FE9FA2A588A36A2F0239913229D3A11D92E7B2E --from pulsar3-test

// Polygon Mainnet contract:
// 0x13ACd5794A3136E7fAc8f9727259930fcab1290F

// 400000000000000000
// https://axelarscan.io/gmp/0xc259627a6ca5ea786184d452802bcbf8d16df7c244dda3cf544e556c59eb0a85:634
// https://polygonscan.com/address/0x13ACd5794A3136E7fAc8f9727259930fcab1290F
// https://axelarscan.io/gmp/924D3C528404ECD8E5CF7A569F4D85EC58A808890EF7F08A3CB41ED95812EF51
