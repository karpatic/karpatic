
const puppeteer = require('puppeteer'); 
/*
(async () => {

  let ops = {
  headless: "new",
  args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
  executablePath: undefined,
  ignoreHTTPSErrors: false,
  handleSIGINT: false
}
  const browser = await puppeteer.launch(ops);
  let page = await browser.newPage();
  await page.goto('http://127.0.0.1:5500/', { waitUntil: "networkidle0" });
  // log the page html
  console.log(await page.content());
 
})(); 
*/


//require snap
const snap = require('react-snap')
// console.log(snap)

let ops = { 
    "puppeteerArgs": ["--no-sandbox", "--disable-setuid-sandbox"],
    "concurrency": 6,
    "inlineCss": false,
    "source": "./docs",
    "removeStyleTags": false,
    "preloadImages": false,
    "asyncScriptTags": false,
    "removeScriptTags": false,
    "include": [
      "/index.html"
    ],
    "puppeteer": {
      "cache": false
    },
    "minifyHtml": {
      "collapseWhitespace": true,
      "removeComments": true
    },
    "destination": "./docs"
  }

snap.run(ops)