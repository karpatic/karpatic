require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit"); // https://www.npmjs.com/package/express-rate-limit

const fileUpload = require('express-fileupload');
const fs = require('fs');

// Python script execution
const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

// const ethers = require("./scripts/ethers.js");
const html2png = require("./scripts/html2png.js");
const html2txt = require("./scripts/html2txt.js");
const html = require("./scripts/html.js");
// const pdf = require('./scripts/pdf.js')
// const trader = require("./scripts/trader.js");

// https://www.reddit.com/domain/cryptovoxels.com.rss
// https://www.reddit.com/domain/voxels.com.rss

//  https://www.twilio.com/docs/sms/api/message-resource

const app = express();
app.use(express.json());
app.set('trust proxy', true);

const PORT = process.env.PORT || 8080;

// app.get(
//   "/trader/check",
//   rateLimit({ windowMs: 3 * 1000, max: 1 }),
//   async (req, res) => {
//     trader.check(req, res);
//   }
// );

// app.get(
//   "/trader/approve",
//   rateLimit({ windowMs: 3 * 1000, max: 1 }),
//   async (req, res) => {
//     trader.approve(req, res);
//   }
// );

// app.get(
//   "/trader/swap",
//   rateLimit({ windowMs: 3 * 1000, max: 1 }),
//   async (req, res) => {
//     trader.swap(req, res);
//   }
// );

// app.get(
//   "/trader/portfolio",
//   rateLimit({ windowMs: 3 * 1000, max: 1 }),
//   async (req, res) => {
//     trader.getPortfolio(req, res);
//   }
// );

// app.get(
//   "/ether/",
//   rateLimit({ windowMs: 3 * 1000, max: 1 }),
//   async (req, res) => {
//     ethers.ethers(req, res);
//   }
// );

app.post(
  '/pdf/',
  rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
  async (req, res) => {
    pdf.generate_pdf(req, res);
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
  "/html/",
  rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
  async (req, res) => {
    html.getHtml(req, res);
  }
);

app.get(
  "/html2txt/",
  rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
  async (req, res) => {
    html2txt.getText(req, res);
  }
);

// app.get(
//   "/email/",
//   rateLimit({ windowMs: 1 * 60 * 1000, max: 10 }),
//   async (req, res) => {
//     // trader.trade(req, res);
//   }
// );

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

app.use(fileUpload());

app.post('/telegram/upload-session', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const sessionFile = req.files.sessionFile;
  const uploadPath = sessionFile.name;

  sessionFile.mv(uploadPath, function(err) {
    if (err) {
      return res.status(500).send(err);
    }

    res.send('Session file uploaded!');
  });
});

app.get("/telegram/auth", (req, res) => {
  const authPage = `
<!doctype html>
<html>
<head><title>Telegram Auth</title></head>
<body>
    <h1>Authenticate Telegram</h1>
    <h1>Upload Telegram Session File</h1>
    <form ref='uploadForm' id='uploadForm' action='/telegram/upload-session' method='post' encType="multipart/form-data">
        <input type="file" name="sessionFile" />
        <input type='submit' value='Upload!' />
    </form>
    <br><br>
    <form id="auth-form">
        <label for="phone">Phone Number:</label><br>
        <input type="text" id="phone" name="phone"><br><br>
        <button type="button" onclick="sendCode()">Send Code</button>
        <br><br>
        <label for="code">Code:</label><br>
        <input type="text" id="code" name="code"><br><br>
        <button type="button" onclick="completeAuth()">Authenticate</button>
    </form>
    <div id="result"></div>
    <script>
        let phoneCodeHash = "";

        async function sendCode() {
            const phone = document.getElementById('phone').value;
            const response = await fetch("/telegram/auth/send-code?phone=" + phone);
            const result = await response.json();
            phoneCodeHash = result.phone_code_hash;  // Save the phone_code_hash
            document.getElementById('result').innerText = result.message;
        }

        async function completeAuth() {
            const phone = document.getElementById('phone').value;
            const code = document.getElementById('code').value;
            const response = await fetch("/telegram/auth/complete-auth?phone=" + phone + "&code=" + code + "&phone_code_hash=" + phoneCodeHash);
            const result = await response.text();
            document.getElementById('result').innerText = result;
        }
    </script>
</body>
</html>
  `;
  res.send(authPage);
});

app.get("/telegram/auth/send-code", async (req, res) => {
  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).send("Phone number is required.");
  }
  try {
    const { stdout, stderr } = await execAsync(`python3 ./src/server/auth_send_code.py ${phone}`);
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send("Error sending code.");
    }
    const result = JSON.parse(stdout);
    res.json(result);  // Send JSON response with phone_code_hash
  } catch (error) {
    console.error(`Exec error: ${error}`);
    res.status(500).send("Error executing the script.");
  }
});

app.get("/telegram/auth/complete-auth", async (req, res) => {
  const phone = req.query.phone;
  const code = req.query.code;
  const phone_code_hash = req.query.phone_code_hash;
  if (!phone || !code || !phone_code_hash) {
    return res.status(400).send("Phone number, code, and phone_code_hash are required.");
  }
  try {
    const { stdout, stderr } = await execAsync(`python3 ./src/server/auth_complete.py ${phone} ${code} ${phone_code_hash}`);
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send("Error completing authentication.");
    }
    res.send(stdout);
  } catch (error) {
    console.error(`Exec error: ${error}`);
    res.status(500).send("Error executing the script.");
  }
});


app.get("/telegram/run-script", async (req, res) => {
  try {
    const { stdout, stderr } = await execAsync("python3 ./src/server/run_script.py");
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send("Error running the script.");
    }
    res.send(stdout);
  } catch (error) {
    console.error(`Exec error: ${error}`);
    res.status(500).send("Error executing the script.");
  }
});








const server = app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
server.setTimeout(10 * 12 * 100); // Sets timeout to 12 seconds
