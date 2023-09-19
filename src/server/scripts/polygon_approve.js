require("dotenv").config();
const { Web3 } = require("web3"); // Import the Web3 library for interacting with Ethereum
const fetch = require("node-fetch"); // Import the fetch library for making HTTP requests

const chainId = 137; // The chain ID for the Polygon network
const web3RpcUrl = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_MAINNET_API_KEY}`; // The URL for the BSC node you want to connect to
const walletAddress = process.env.TRADING_BOT_PUBLIC_KEY; // Set your wallet address (replace '0x...xxx' with your actual wallet address)
const privateKey = process.env.TRADING_BOT_PRIVATE_KEY; // Set the private key of your wallet (replace '0x...xxx' with your actual private key). NEVER SHARE THIS WITH ANYONE!

const swapParams = {
  fromTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // The address of the token you want to swap from (1INCH)
  toTokenAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // The address of the token you want to swap to (DAI)
  amount: "100000000000000000", // The amount of the fromToken you want to swap (in wei) (17 0's == .1 eth of value)
  fromAddress: walletAddress, // Your wallet address from which the swap will be initiated
  slippage: 1, // The maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
  disableEstimate: false, // Whether to disable estimation of swap details (set to true to disable)
  allowPartialFill: false, // Whether to allow partial filling of the swap order (set to true to allow)
};

const broadcastApiUrl =
  "https://tx-gateway.1inch.io/v1.1/" + chainId + "/broadcast";
const apiBaseUrl = "https://api.1inch.io/v5.0/" + chainId;
const web3 = new Web3(web3RpcUrl);

// Construct full API request URL
function apiRequestUrl(methodName, queryParams) {
  return (
    apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString()
  );
}

(async () => {
  const transactionForSign = await buildTxForApproveTradeWithRouter(
    swapParams.fromTokenAddress
  );
  console.log("Transaction for approve: ", transactionForSign);

  transactionForSign.from = walletAddress;

  const approveTxHash = await signAndSendTransaction(transactionForSign);
  console.log("Approve tx hash: ", approveTxHash);
})();

// Construct full API request URL
function apiRequestUrl(methodName, queryParams) {
  return (
    apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString()
  );
}

// Post raw transaction to the API and return transaction hash
async function broadCastRawTransaction(rawTransaction) {
  return fetch(broadcastApiUrl, {
    method: "post",
    body: JSON.stringify({ rawTransaction }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((res) => {
      return res.transactionHash;
    });
}

// Sign and post a transaction, return its hash
async function signAndSendTransaction(transaction) {
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    transaction,
    privateKey
  );

  return await broadCastRawTransaction(rawTransaction);
}

// Prepare approval transaction, considering gas limit
async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
  const url = apiRequestUrl(
    "/approve/transaction",
    amount ? { tokenAddress, amount } : { tokenAddress }
  );

  const transaction = await fetch(url).then((res) => res.json());

  const gasLimit = await web3.eth.estimateGas({
    ...transaction,
    from: walletAddress,
  });

  return {
    ...transaction,
    gas: gasLimit,
  };
}
