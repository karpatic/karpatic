require("dotenv").config();
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
// await page.waitForTimeout(x * 2000);
async function visualize(req, res) {
  const event = req.query;
  try {
    // /app/.cache/puppeteer/chrome/linux-1045629 or /app/scripts/html2png.js
    console.log("Recieved: ", event);
    if (!!!event.html && !!!event.url) {
      throw Error("You must provide html or url.");
    }

    let width = parseInt(event.width || 800);
    let cropLeftBy = parseInt(event.cropLeftBy || 0); // 155
    let imgWidth = cropLeftBy ? width - cropLeftBy : width;

    let height = parseInt(event.height || 800);
    let cropHeightBy = parseInt(event.cropHeightBy || 0); // 60
    let imgHeight = cropHeightBy ? height - cropHeightBy : height;

    let scroll = event.page ? (parseInt(event.page) - 1) * height : 0;
    scroll = scroll + parseInt(event.scroll || 0);

    console.log({ width, height, cropLeftBy, cropHeightBy, imgWidth, imgHeight, scroll });
    console.log({ stats: process.env.DEVURL || "../node_modules/chromium/lib/chromium/chrome-linux/chrome" });
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width, height },
      executablePath: process.env.DEVURL || "./node_modules/chromium/lib/chromium/chrome-linux/chrome",
      args: [
        "--incognito",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
        "--disable-setuid-sandbox",
        "--js-flags=--expose-gc",
      ],
    });
    let page = await browser.newPage();
    await page.setViewport({ width, height });
    // page.setJavaScriptEnabled(false)
    if (event.html) {
      html = handlebars.compile(event.html)();
      await page.setContent(html, { waitUntil: ["load", "domcontentloaded", "networkidle0"], timeout: 0 });
    } else if (event.url) {
      // networkidle0 - consider navigation to be finished when there are no more than 0 network connections for at least 500 ms
      await page.goto(event.url, { waitUntil: ["networkidle0"] }); //  , timeout: 60000, networkIdleTimeout: 1000 * 3
      await page.evaluate((val) => {
        window.scroll(0, val);
      }, scroll);
    }
    const image = await page.screenshot({
      fullPage: false,
      clip: { x: cropLeftBy, y: scroll, width: imgWidth, height: imgHeight },
    });

    await page.evaluate(() => gc());
    await page.close();
    await browser.close();
    res.set("Content-Type", "image/png");
    return res.send(image);
  } catch (error) {
    console.log("Error:", error);
    return res.json({ statusCode: 400, body: { status: "400", message: "You must provide html or url." } });
  }
}

async function getText(req, res) {
  const event = req.query;
  try {
    console.log("Received: ", event);
    if (!!!event.html && !!!event.url) {
      throw Error("You must provide html or url.");
    }

    let width = parseInt(event.width || 800);
    let height = parseInt(event.height || 800);
    let scroll = event.page ? (parseInt(event.page) - 1) * height : 0;
    scroll = scroll + parseInt(event.scroll || 0);

    console.log({ width, height, scroll });
    console.log({ stats: process.env.DEVURL || "../node_modules/chromium/lib/chromium/chrome-linux/chrome" });
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width, height },
      executablePath: process.env.DEVURL || "./node_modules/chromium/lib/chromium/chrome-linux/chrome",
      args: [
        "--incognito",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
        "--disable-setuid-sandbox",
        "--js-flags=--expose-gc",
      ],
    });
    let page = await browser.newPage();
    await page.setViewport({ width, height });
    if (event.html) {
      html = handlebars.compile(event.html)();
      await page.setContent(html, { waitUntil: ["load", "domcontentloaded", "networkidle0"], timeout: 0 });
    } else if (event.url) {
      await page.goto(event.url, { waitUntil: ["networkidle0"] });
      await page.evaluate((val) => {
        window.scroll(0, val);
      }, scroll);
    }
    const text = await page.evaluate(() => document.body.innerText);

    await page.evaluate(() => gc());
    await page.close();
    await browser.close();
    res.set("Content-Type", "text/plain");
    return res.send(text);
  } catch (error) {
    console.log("Error:", error);
    return res.json({ statusCode: 400, body: { status: "400", message: "You must provide html or url." } });
  }
}

exports.getText = getText;
exports.visualize = visualize;

/*    
  await page.setContent(`<p>web running at ${Date()}</p>`);
  res.send(await page.content());
  // https://github.com/jontewks/puppeteer-heroku-buildpack
  // https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-heroku
*/
