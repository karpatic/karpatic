require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit"); // https://www.npmjs.com/package/express-rate-limit
const ethers = require("./scripts/ethers.js");
const html2png = require("./scripts/html2png.js");
const html2txt = require("./scripts/html2txt.js");
const trader = require("./scripts/trader.js");

// https://www.reddit.com/domain/cryptovoxels.com.rss
// https://www.reddit.com/domain/voxels.com.rss

//  https://www.twilio.com/docs/sms/api/message-resource

const app = express();
const PORT = process.env.PORT || 8080;

app.get(
  "/trader/check",
  rateLimit({ windowMs: 3 * 1000, max: 1 }),
  async (req, res) => {
    trader.check(req, res);
  }
);

app.get(
  "/trader/approve",
  rateLimit({ windowMs: 3 * 1000, max: 1 }),
  async (req, res) => {
    trader.approve(req, res);
  }
);

app.get(
  "/trader/swap",
  rateLimit({ windowMs: 3 * 1000, max: 1 }),
  async (req, res) => {
    trader.swap(req, res);
  }
);

app.get(
  "/trader/portfolio",
  rateLimit({ windowMs: 3 * 1000, max: 1 }),
  async (req, res) => {
    trader.getPortfolio(req, res);
  }
);

app.get(
  "/ether/",
  rateLimit({ windowMs: 3 * 1000, max: 1 }),
  async (req, res) => {
    ethers.ethers(req, res);
  }
);

app.get(
  "/html2png/",
  rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
  async (req, res) => {
    html2png.visualize(req, res);
  }
);

app.get(
  "/html2txt/",
  rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
  async (req, res) => {
    html2txt.getText(req, res);
  }
);

app.get(
  "/email/",
  rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
  async (req, res) => {
    // trader.trade(req, res);
  }
);

app.get(
  "/text/",
  rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
  async (req, res) => {
    /*
    // Download the helper library from https://www.twilio.com/docs/node/install
    // Find your Account SID and Auth Token at twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    client.messages
          .create({from: '+15557122661', body: 'Hi there', to: '+15558675310'})
          .then(message => console.log(message.sid));
    */
  }
);

app.get("/", async (req, res) => {
  res.json({ user: "geek" });
});

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));

/*
// https://elements.heroku.com/buttons/heroku/node-js-getting-started
app.get('/ethers/', async (req, res) => {
    res.send('ethers!');
});
  // res.sendFile('blabla.html'); 
// GET https://example.com/user/1
app.get('/:userid', (req, res) => {
  console.log(req.params.userid)
})
 
app.post('/login', (req, res) => {
  console.log(req.body.email) // "user@example.com"
  console.log(req.body.password) // "helloworld"
})
*/
