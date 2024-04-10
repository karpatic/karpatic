//
// This checks amount of the token that the 1inch contract is allowed to spend on behalf of your wallet, 
// Allowance is required before you can build and sign and send a transaction.
//
let {checkAllowance, exampleParams} = require('../trader_utils.js');

(async () => { 
  const allowance = await checkAllowance(
    exampleParams.fromTokenAddress,
    exampleParams.fromAddress
  );
  console.log("Allowance: ", allowance);
})();
