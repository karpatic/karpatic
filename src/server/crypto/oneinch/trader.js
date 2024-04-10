const { json } = require("express");
const {
  checkAllowance,
  broadCastRawTransaction,
  signAndSendTransaction,
  buildTxForApproveTradeWithRouter,
  web3,
  walletAddress,
  privateKey
} = require("./trader_utils");
const { one_inch_viable_tokens} = require("./tokens.js")

const swapParams = {
  fromTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // The address of the token you want to swap from (1INCH)
  toTokenAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // The address of the token you want to swap to (DAI)
  amount: "100000000000000000", // The amount of the fromToken you want to swap
  // (in from-token wei - mind the decimals)  - (17 0's == .1 (from token) of value)
  fromAddress: walletAddress, // Your wallet address from which the swap will be initiated
  slippage: 1, // The maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
  disableEstimate: false, // Whether to disable estimation of swap details (set to true to disable)
  allowPartialFill: false, // Whether to allow partial filling of the swap order (set to true to allow)
};
function updateSwap(req) {
  Object.keys(swapParams).forEach((key) => {
    swapParams[key] = (req.query || req.body)[key];
  });
}

//
// This request will just swap the fromToken to the toToken
// http://localhost:8080/trader/check?fromTokenAddress=0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063&toTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
//
async function check(req, res) {
  updateSwap(req);
  const allowance = await checkAllowance(
    swapParams.fromTokenAddress,
    walletAddress
  );
  let returnThis = {
    status: 200,
    message: "OK",
    task: "check",
    for: one_inch_viable_tokens[swapParams.fromTokenAddress.toLowerCase()],
    allowance: allowance,
  };
  res.send(returnThis);
}

//
//
//
//
async function approve(req, res) {
  updateSwap(req);
  const transactionForSign = await buildTxForApproveTradeWithRouter(
    swapParams.fromTokenAddress
  );
  console.log("Transaction for approve: ", transactionForSign);

  transactionForSign.from = walletAddress;

  const approveTxHash = await signAndSendTransaction(transactionForSign);
  transactionForSign.gas = transactionForSign.gas.toString() + "n"; // Convert BigInt for JSON serialization
  let returnThis = {
    status: 200,
    message: "OK",
    task: "approve",
    for: one_inch_viable_tokens[swapParams.fromTokenAddress.toLowerCase()],
    transaction_data: transactionForSign,
    approveTxHash: approveTxHash,
  };
  res.send(returnThis);
}

//
//
//
async function swap(req, res) {
  updateSwap(req);
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    (req.body || req.query)["transaction"],
    privateKey
  );
  const broadcast_response = await broadCastRawTransaction(rawTransaction);
  let returnThis = {
    status: 200,
    message: "OK",
    task: "swap",
    swapParams,
    rawTransaction,
    broadcast_response,
    approveTxHash: approveTxHash,
  };
  res.send(returnThis);
}
exports.check = check;
exports.approve = approve;
exports.swap = swap;

/*
async function getPortfolio(req, res) {
  try {
    const balances = await Promise.all(
      tokens.map(async (token) => {
        const contract = new ethers.Contract(
          token.address,
          ["function balanceOf(address) view returns (uint256)"],
          provider
        );
        const balance = await contract.balanceOf(PUBLIC_KEY);
        return {
          symbol: token.symbol,
          balance: balance.toString(),
        };
      })
    );

    // return balances;

    res.set("Content-Type", "text/plain");
    return res.send(balances);
  } catch (error) {
    console.log("Error:", error);
    return res.json({
      statusCode: 400,
      body: { status: "400", message: "You must provide html or url." },
    });
  }
}
*/
