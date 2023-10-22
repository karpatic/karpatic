
// https://www.reddit.com/r/0xPolygon/comments/ouv1ao/secondary_node/



// Retrieve the current nonce for the wallet address
// const currentNonce = await web3.eth.getTransactionCount(walletAddress, 'pending');
  
// Gas price (in Wei)
// there are 9 wei decimals in 1 gwei and 9 gwei decimals in 1 ether.
// 1 gwei = 1,000,000,000 wei
// 50Gwei = 50×10^-9wei = 0.00000005ETH
// // const gasPrice = ethers.utils.parseUnits("50", "gwei"); // Example gas price (adjust as needed)

// The gas limit itself is not measured in Ether; it's a limit on the computational work a transaction can perform.
// However, you can calculate the total cost in Ether by multiplying the gas limit by the gas price.
// 21,000gas×50×10^−9ETH/gas=0.00105ETH
// const gasLimit = ethers.utils.hexlify(100000); // adjust based on the operation

// Connect to Polygon node
// const provider = new ethers.providers.JsonRpcProvider(providerUrl);

// Wallet instance from private key
// const wallet = new ethers.Wallet(privateKey, provider);

// To get new nonce every time
// querying your account's transaction count, including pending transactions, from the network.
getTransactionCount is changed to getNonce in ethers.js version 6.

For ethers.js version 5;
const nonce = await wallet.getTransactionCount()

For ethers.js version 6;
const nonce = await wallet.getNonce()


https://dashboard.alchemy.com/apps/0fja7jh0lukedtm8

https://app.infura.io/dashboard/ethereum/14502b01606c4bb9be44d2c5de0e6374/settings/endpoints

https://polygonscan.com/address/0xAe397c70Ba6Dc1a149909F702c2247Ea49d2C703

https://polygonscan.com/tx/0xafd5d52b352a4f18e8a4e4ff91d29ed9a8e01062c57bded67623d0f4fa0a63e4
https://polygonscan.com/tx/0x11268fcbcaa77d3e161e0bfcf445f370942dbfa290e1ae96b1f2515788968fc8

https://quickswap.exchange/#/


https://docs.alchemy.com/docs/maxpriorityfeepergas-vs-maxfeepergas
https://docs.alchemy.com/discuss/646f1272ba6d0e004374ddfc

https://ethereum.stackexchange.com/questions/138155/interact-with-swap-function-for-sushiswap-contract

https://docs.uniswap.org/sdk/v3/guides/quoting
https://github.com/Uniswap/examples/tree/main



test.js 
- nonce