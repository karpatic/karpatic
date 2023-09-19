require("dotenv").config();
let provider_key = process.env.POLYGON_MAINNET_API_KEY;
const TRADING_BOT_PRIVATE_KEY = process.env.TRADING_BOT_PRIVATE_KEY;
const TRADING_BOT_PUBLIC_KEY = process.env.TRADING_BOT_PUBLIC_KEY;
const ethers = require("ethers");

// Alchemy API URL for Polygon
const providerUrl = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_MAINNET_API_KEY}`;
console.log("providerUrl: ", providerUrl);
// Ethereum wallet private key
const privateKey = TRADING_BOT_PRIVATE_KEY;

const chainId = 137;

// Token contract address
const tokenAddress = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";

// Approval data from the API response
const approvalData =
  "0x095ea7b30000000000000000000000001111111254eeb25477b68fb85ed929f73a960582ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Gas price (in Wei)
// there are 9 wei decimals in 1 gwei and 9 gwei decimals in 1 ether.
// 1 gwei = 1,000,000,000 wei
// 50Gwei = 50×10^-9wei = 0.00000005ETH
const gasPrice = ethers.utils.parseUnits("50", "gwei"); // Example gas price (adjust as needed)

// The gas limit itself is not measured in Ether; it's a limit on the computational work a transaction can perform.
// However, you can calculate the total cost in Ether by multiplying the gas limit by the gas price.
// 21,000gas×50×10^−9ETH/gas=0.00105ETH
const gasLimit = ethers.utils.hexlify(100000); // adjust based on the operation

// Connect to Polygon node
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

// Wallet instance from private key
const wallet = new ethers.Wallet(privateKey, provider);

// To get new nonce every time
// const nonce = await wallet.getNonce();

// querying your account's transaction count, including pending transactions, from the network.
const nonce = provider.getTransactionCount(TRADING_BOT_PUBLIC_KEY, "pending");

// Create a transaction
const transaction = {
  to: tokenAddress,
  data: approvalData,
  gasPrice: gasPrice,
  chainId: chainId,
  gasLimit: gasLimit,
  nonce: nonce,
};

// Sign the transaction
const signedTransaction = wallet.signTransaction(transaction);

// Send the transaction
// The transaction successfully broadcasted to the network.
// The transaction hash is returned.
//  It doesn't mean the transaction has been successfully mined and included in a block.
// , the transaction is likely still in the pending state, waiting to be included in a block.

signedTransaction
  .then((tx) => {
    console.log("Transaction Hash:", tx.hash);
    console.log("https://polygonscan.com/tx/", tx);
    return tx.wait(); // Wait for the transaction to be mined
  })
  .then((receipt) => {
    console.log("Transaction was mined in block", receipt.blockNumber);
  })
  .catch((error) => {
    console.error("Transaction failed:", error);
  });

// https://www.reddit.com/r/0xPolygon/comments/ouv1ao/secondary_node/
