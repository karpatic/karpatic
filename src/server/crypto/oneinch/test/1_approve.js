//
// USES WEB3
// buildTxForApproveTradeWithRouter = /approve/transaction => returns (transaction, gasEstimate) 
// signAndSendTransaction = web3.eth.accounts.signTransaction(transaction) => returns rawTransaction, broadCastRawTransaction(rawTransaction)
//
let {getNonce, buildTxForApproveTradeWithRouter, signTransaction, sendSignedTransaction, exampleParams} = require('../trader_utils.js');

(async () => {
  /*
    const allowance = await checkAllowance( exampleParams.fromTokenAddress, exampleParams.fromAddress );
    console.log("Allowance: ", allowance);
  */ 
  const transactionForSign = await buildTxForApproveTradeWithRouter( exampleParams.fromTokenAddress );
  console.log("Transaction for approve: ", transactionForSign);
  transactionForSign.nonce = await getNonce();
  transactionForSign.from = exampleParams.fromTokenAddress;
  const approveTxHash = await signTransaction(transactionForSign);
  const sentTxHash = await sendSignedTransaction(approveTxHash);
  console.log("Approve tx hash: ", {approveTxHash, sentTxHash});
})();
