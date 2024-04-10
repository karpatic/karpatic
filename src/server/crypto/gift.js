require("dotenv").config();
const API_KEY = process.env.POLYGON_MAINNET_API_KEY;
const PRIVATE_KEY = process.env.RISKY_CLICK_PRIVATE_KEY;
const PUBLIC_KEY = process.env.RISKY_CLICK_PUBLIC_KEY;
const contract = require("../../contracts/collectibles.json");
exports.ethers = hanldeEthers;
async function hanldeEthers(req, res) {
  return res.json(giveGift(req.query));
}

// https://colab.research.google.com/drive/19hs84MNQocwZ21UbB_5XVm5A_ghdJ2Qn#scrollTo=W-EruNXWa_Av
// https://charleskarpati.com/api/distributor?user=&contract=&token=
// https://docs.alchemy.com/reference/eth-getlogs
// https://composer.alchemy.com?share=eJy9WEtv2zgQ.isLnX2QJceOcnMMeFugmwZJtpemCChqZAuhSYOi6xhF.vuSspNSw6HivTSHwJ7vwccMX.6V8DVrZHKVjRIJZq.0c3I1ScejZANmraobtoHkKrGfn1ZgvqhVm7xBX7emUbJNrr7.Sn4ysXM8JvgaNgfHnbctmAfNZFuDdirBShCDnNcR6fSgnkHOhVB7JjnQTogz5HTNhONEutSnDPn8A4ZVzLABn3dKzMcNnXE3j3fAodmaWK8Iou9ZKt3N584mRnsW.TihWOy0BmlutdqqFggpJsQ9vjHR2MGqXrKjFMLnTinzibXrUP6OEKr7ZiVt8cwj0j7s611NM87VTvZmvRfG.FIo.nyz25S9qcIIVnEmBKJ3oYDnluLnClNPUcyG1jQbZuBvhrvvI1hVA3xqWpuCAxJ5ANasWHurm97S64UDPpjTCsKK3wClcVN4fUB5JMC4lkxNAMf0xBok4ZjeW6ULVz_DY4mQz.ceHGuUTvgvVEUkqosS7GUjDOjFmslVbw8l4aj_dJKQ4g4jlLQmxrY7lqpD_jFM8IndByOE6t4uGLaCuQllvyFC5_Xn_tBlzLUwl9VnWcFLaPYB.6wWjhXwf9pAio9aoacvpAz7dPU6aHNkDLucFuugzxvnLKf2NCfnOL5zCed.JRdwVs6jzA9cP8rzADfmfNpD3rsSMQ1o5.jF9rEYEXtu2Is9hpRuzGEJcAs6PBBJCvaRsO_aOW5CyAGBhDYmiytuQVaNXHnlE.OIMrHrViujuBLf7JXHspATRrG6tc3csb3XDDIgCIHHQXLbVSw8RTF7JxvZGnsXIkeOUV.dnVDSaNsN4iJOoUi9FEppfK3px5HiC9P2TDPz8M5IgEh7s3ygu_kDoQY10kUI1lLphRICcM5IGOm.7t39eMCBIsQ8uldPRH7EkPJ_yzZvmUKD7UO_rml9zFMhwNfYx_2TsPdbsDXlV2c.jhU.g3XkR332lrndZegqGWP4LhpsL2wZEWMLIF.nInB8g3gSPxqy0avEC4ZcHdsVSJjQw1aw4y7uEf3ZGebFHAc7FTBCF.s.qvcxX7mHMn.ionHv2aA8CDDQtmuWY0kXe.0xclXCNvadvLO3Z.fLCqsqDa39nKQvvMjTKp_lvJiN68l0VkCaj9OpDY0nAPVknKbVZV26Dc2o4wXkKrFfaq02b1_3x6Oko2wb7oy.y50Qo0fbQBr5mxXZbJxPymKW8XSaFlk2Lif5RX05AcamdT0rirxOq_wxGf31R3zKcVFOsovphFVjnubT7AIu83TK6yytAFhWF1nOprPH5Ied1Nf.AFWEqo0-
// https://charleskarpati.com/api/distributor?user=&contract=&token=
// https://oiesopoey7j45hep542zbffot40dpppo.lambda-url.us-east-1.on.aws/?user=0x7b19B42564AD1C03625e8306CF20DeEA2F923a67&contract=0xc930d370c971f4679e03106d3714eef4100d8fbe&token=4&amount=1

const { ethers } = require("ethers");
const API_URL = `https://polygon-mainnet.g.alchemy.com/v2/${API_KEY}`;
const data = [];

function getMyFile(url) {
  var https = require("https");
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        var { statusCode } = res;
        var contentType = res.headers["content-type"];
        let error;
        if (statusCode !== 200) {
          error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error("Invalid content-type.\n" + `Expected application/json but received ${contentType}`);
        }
        if (error) {
          console.error(error.message);
          res.resume();
        }
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } catch (e) {
            reject(e.message);
          }
        });
      })
      .on("error", (e) => {
        reject(`Got error: ${e.message}`);
      });
  });
}

async function giveGift(event) {
  const USER_ADDRESS = event.user || event.queryStringParameters?.user; // '0x1aE62c0B803fD85Ff2a774961C022abFFc834214'
  const CONTRACT_ADDRESS = event.contract; // false // '0xc930d370c971f4679e03106d3714eef4100d8fbe'
  const tokenId = event.token; // 4
  const amount = event.amount || 1;
  if (!!!tokenId || !!!CONTRACT_ADDRESS || !!!USER_ADDRESS) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "Error: Please provide user, contract, token",
        vals: [USER_ADDRESS, CONTRACT_ADDRESS, tokenId, amount],
      }),
    };
  }
  console.log({ vals: [USER_ADDRESS, CONTRACT_ADDRESS, tokenId, amount] });

  let url = `https://polygon-mainnet.g.alchemy.com/nft/v2/${API_KEY}/getOwnersForToken?contractAddress=${CONTRACT_ADDRESS}&tokenId=${tokenId}`;
  console.log("url: ", url);
  let tokenHolders = await getMyFile(url);
  console.log("tokenHolders: ", tokenHolders);
  let hasToken = tokenHolders.owners.includes(USER_ADDRESS.toLowerCase());
  console.log("hasToken: ", hasToken, USER_ADDRESS);

  if (hasToken) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "200",
        message: "Error: Wallet Has Token",
      }),
    };
  }

  //Connect
  const provider = new ethers.providers.JsonRpcProvider(API_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("gotproviderandwallet");
  //Get gas price
  const gasPrice = await provider.getGasPrice();
  console.log("gotgasprice");
  //Grab contract ABI and create an instance
  const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contract, wallet);
  console.log("gotcontract");
  //Estimate gas limit
  //const gasLimit = await nftContract.estimateGas.safeTransferFrom(PUBLIC_KEY, USER_ADDRESS, tokenId, amount, data, { gasPrice });
  //Call the safetransfer method
  const transaction = await nftContract.safeTransferFrom(PUBLIC_KEY, USER_ADDRESS, tokenId, amount, data, { gasPrice });
  console.log("transaction");
  //Wait for the transaction to complete
  await transaction.wait();
  console.log("Transaction Hash: ", transaction.hash);
  const response = {
    statusCode: 200,
    body: JSON.stringify({ status: "200", message: "Success" }),
  };
  return response;
}
