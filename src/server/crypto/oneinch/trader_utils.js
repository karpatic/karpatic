require("dotenv").config();
const { Web3 } = require("web3"); // Import the Web3 library for interacting with Ethereum
const fetch = require("node-fetch"); // Import the fetch library for making HTTP requests

const chainId = 137; // The chain ID for the Polygon network
const web3RpcUrl = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_MAINNET_API_KEY}`; // The URL for the BSC node you want to connect to
const walletAddress = process.env.TRADING_BOT_PUBLIC_KEY; // Set your wallet address (replace '0x...xxx' with your actual wallet address)
const privateKey = process.env.TRADING_BOT_PRIVATE_KEY; // Set the private key of your wallet (replace '0x...xxx' with your actual private key). NEVER SHARE THIS WITH ANYONE!
const oneInchKey = process.env.ONE_INCH_API_KEY;

const broadcastApiUrl = "https://api.1inch.dev/tx-gateway/v1.1/" + chainId + "/broadcast";
const apiBaseUrl = "https://api.1inch.dev/swap/v5.2/" + chainId; 
const headers = { Authorization: `Bearer ${oneInchKey}`, accept: "application/json" };
const headers2 = { Authorization: `Bearer ${oneInchKey}`, "Content-Type": "application/json" }
const web3 = new Web3(web3RpcUrl);


// example for use in /test
// https://eth-converter.com/
const exampleParams = {
  fromTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Token address of Matic
  toTokenAddress: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // Token address of DAI
  amount: "100000000000000000", // Amount of Matic to swap (in wei) ( == 0.1 Matic)
  fromAddress: walletAddress, // 0xAe397c70Ba6Dc1a149909F702c2247Ea49d2C703
  slippage: 10, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
  disableEstimate: false, // Set to true to disable estimation of swap details
  allowPartialFill: false, // Set to true to allow partial filling of the swap order
};

async function getNonce(){
  let nonce = await web3.eth.getTransactionCount(walletAddress, 'pending')
  nonce = nonce.toString() // Convert from BIGINT to string. tx.nonce will not work if Number()
  console.log({nonce});
  return nonce
}
// Construct full API request URL
function apiRequestUrl(methodName, queryParams) {
  const url = apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString();
  console.log('API Request URL:', url); // Log the URL
  return url;
}

// 0. if Allowance: 0, the 1inch router does not have access to swap this token within your wallet.
async function checkAllowance(tokenAddress, walletAddress) {
  const response = await fetch( apiRequestUrl("/approve/allowance", { tokenAddress, walletAddress }), { headers } );
  const jsonResponse = await response.json();
  return jsonResponse.allowance;
}




// 1. Approve a TxForSwap on a currency for a wallet. considers gas limit
// Call once for each transaction. Could be re-used but the nonce would need updating.
/*
Before the 1inch aggregation protocol can access tokens in your wallet, 
you need to create an approval transaction. 
This transaction specifies that the 1inch router is allowed to swap a specific amount of the token you choose.

Please be cautious as approval transactions require payment of a blockchain gas fee, 
which is deducted in the form of native tokens from your wallet.
*/
async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
  const url = apiRequestUrl(
    "/approve/transaction",
    amount ? { tokenAddress, amount } : { tokenAddress }
  );

  const transaction = await fetch(url,{headers}).then((res) => res.json());
  const gasLimit = await web3.eth.estimateGas({
    ...transaction,
    from: walletAddress,
  });
  
  return {
    ...transaction,
    gas: gasLimit,
  };
}

// 2 & 5. Sign the raw transactionForSign from buildTxForApproveTradeWithRouter and also for buildTxForSwap using your wallet, 
// It returns a transaction hash which can then be broadcasted.
async function signTransaction(transaction) {
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    transaction,
    privateKey
  );

  return rawTransaction
}

// 3 & 6. Post raw transaction hash to the API. The transaction hash is returned.
// It doesn't mean the transaction has been successfully mined and included in a block.
// the transaction is likely still in the pending state, waiting to be included in a block.
// You can monitor its execution using the blockchain explorer using the hash.

async function sendSignedTransaction(rawTransaction) {
  let resp = fetch(broadcastApiUrl, {
    method: "post",
    body: JSON.stringify({ rawTransaction }),
    headers: headers2,
  })
  .then((res) => res.json())
  .then((res) => res.transactionHash || res );
  resp.transactionHash && console.log("https://polygonscan.com/tx/" + resp.transactionHash);
  return resp.transactionHash || resp;
}
//  const headers = { Authorization: `Bearer ${oneInchKey}`, accept: "application/json" };

// 4. Prepare the transaction data for the swap by making an API request
// Before proceeding with the swap, please confirm that your approval transaction has a status of "Success."
async function buildTxForSwap(swapParams) {
  const url = apiRequestUrl("/swap", swapParams);

  // Fetch the swap transaction details from the API
  return fetch(url, {headers:headers2})
    .then((res) => res.json())
    .then((res) => {console.log(res); return res.tx});
}



module.exports = {
  exampleParams,
  apiRequestUrl,
  checkAllowance,
  getNonce,
  buildTxForApproveTradeWithRouter,
  signTransaction,
  sendSignedTransaction,
  buildTxForSwap,
  web3,
  walletAddress
};
