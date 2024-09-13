const puppeteer = require("puppeteer");
const express = require("express");
const serveStatic = require("serve-static");
const fallback = require("express-history-api-fallback");
const path = require("path");
const nativeFs = require("fs");
const mkdirp = require("mkdirp");
const minify = require("html-minifier").minify;

const defaultOptions = {

  port: 45678,
  crawl: true,
  source: "./docs",
  destination: "./docs",
  include: ["/index.html"],
  userAgent: "ReactSnap",
  headless: false,
  puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  puppeteer: { cache: false },
  minifyHtml: {
    collapseWhitespace: true,
    removeComments: true
  },
  viewport: { width: 480, height: 850 },
  skipThirdPartyRequests: false,
  concurrency: 1,
  inlineCss: false,
  removeStyleTags: false,
  preloadImages: false,
  asyncScriptTags: false,
  removeScriptTags: false,
};

const defaults = userOptions => {
  const options = { ...defaultOptions, ...userOptions };
  options.destination = options.destination || options.source;
  if (!options.include.length) throw new Error("Include option should be non-empty");
  return options;
};

const crawl = async (opt) => {
  const {
    options,
    basePath,
    beforeFetch,
    afterFetch,
    onEnd,
    publicPath,
    sourceDir
  } = opt;
  let shuttingDown = false;
  let streamClosed = false;

  // exit process
  const onSigint = () => {
    if (shuttingDown) {
      process.exit(1);
    } else {
      shuttingDown = true;
      console.log(
        "\nGracefully shutting down. To exit immediately, press ^C again"
      );
    }
  };
  process.on("SIGINT", onSigint);
 
  // Exit on unhandled promise rejections
  process.on("unhandledRejection", error => {
    console.log("🔥  UnhandledPromiseRejectionWarning", error);
    shuttingDown = true;
  });

  const queue = [];
  let enqued = 0;
  let processed = 0;
  const uniqueUrls = new Set();
  const sourcemapStore = {};

  // Add a URL to the queue if it's not already there and it's not a third-party URL
  const addToQueue = newUrl => {
    if(!newUrl) return;
    if(newUrl.includes('mailto:')) return;
    if(newUrl.includes('javascript:')) return;
    const { hostname, search, hash } = new URL(newUrl);
    newUrl = newUrl.replace(`${search || ""}${hash || ""}`, "");
    if (hostname === "localhost" && !uniqueUrls.has(newUrl) && !streamClosed) {
      uniqueUrls.add(newUrl);
      enqued++;
      queue.push(newUrl);
      if (enqued == 2 && options.crawl) {
        addToQueue(`${basePath}${publicPath}404.html`);
      }
    }
  };

  const browser = await puppeteer.launch({
    headless: options.headless,
    args: options.puppeteerArgs,
    executablePath: options.puppeteerExecutablePath,
    ignoreHTTPSErrors: options.puppeteerIgnoreHTTPSErrors,
    handleSIGINT: false
  });

  // 
  const fetchPage = async pageUrl => {
    const route = pageUrl.replace(basePath, "");
  
    let skipExistingFile = false;
    const routePath = route.replace(/\//g, path.sep);
    const { ext } = path.parse(routePath);

    if (ext !== ".html" && ext !== "") {
      const filePath = path.join(sourceDir, routePath);
      console.log(`🕸 Inspecting File ${filePath}`);
      skipExistingFile = nativeFs.existsSync(filePath);
    }
    else{ 
    }
  
    // Crawl the page if it's not already crawled and it's not a third-party URL
    if (!shuttingDown && !skipExistingFile) {
        console.log(`🕸 Pulling file ${route}`);
      try {
        const page = await browser.newPage();
        const client = await page.target().createCDPSession();
        await client.send('ServiceWorker.disable');
        await page.setCacheEnabled(options.puppeteer.cache);
        if (options.viewport) await page.setViewport(options.viewport);
        if (options.skipThirdPartyRequests) await skipThirdPartyRequests({ page, options, basePath });
        enableLogging({ page, options, route, onError: () => { shuttingDown = true; }, sourcemapStore });
        if (beforeFetch) await beforeFetch({ page, route });
        await page.setUserAgent(options.userAgent);
        const tracker = createTracker(page);
        try {
          await page.goto(pageUrl, { waitUntil: "networkidle2" });
        } catch (e) {
          e.message = tracker.augmentTimeoutError(e.message);
          throw e;
        } finally {
          tracker.dispose();
        }
        if (options.waitFor) await page.waitFor(options.waitFor);
        if (options.crawl) {
          console.log(`🕸 Got Page for ${route}`);
          const links = await getLinks({ page });
          console.log('links', links);
          links.forEach(addToQueue);
        }
        if (afterFetch) await afterFetch({ page, route, browser, addToQueue });
        await page.close();
        console.log(`✅  crawledd ${processed + 1} out of ${enqued} (${route})`);
      } catch (e) {
        if (!shuttingDown) {
          console.log(`🔥  error at ${route}`, e);
        }
        shuttingDown = true;
      }
    } 
    else{
        console.log(`DID NOT CRAWL ${route}`);
      }
    processed++;
    if (enqued === processed) {
      streamClosed = true;
    }
    return pageUrl;
  };

  if (options.include) {
    options.include.map(x => addToQueue(`${basePath}${x}`));
  }

  while (queue.length > 0 && !shuttingDown) {
    await Promise.all(
      queue.splice(0, options.concurrency).map(fetchPage)
    );
  }

  await browser.close();
  onEnd && onEnd();
  if (shuttingDown) throw new Error("");
};

const run = async (userOptions, { fs } = { fs: nativeFs }) => {
  const options = defaults(userOptions);
  const sourceDir = path.normalize(`${process.cwd()}/${options.source}`);
  const destinationDir = path.normalize(`${process.cwd()}/${options.destination}`);

  const startServer = options => {
    const app = express()
      .use(options.publicPath || '/', serveStatic(sourceDir))
      .use(fallback("200.html", { root: sourceDir }));
    const server = require("http").createServer(app);
    server.listen(options.port);
    return server;
  };

  if (fs.existsSync(path.join(sourceDir, "200.html"))) {
    throw new Error("Cannot run react-snap twice - this will break the build");
  }

  fs.createReadStream(path.join(sourceDir, "index.html")).pipe(fs.createWriteStream(path.join(sourceDir, "200.html")));
  if (destinationDir !== sourceDir) {
    mkdirp.sync(destinationDir);
    fs.createReadStream(path.join(sourceDir, "index.html")).pipe(fs.createWriteStream(path.join(destinationDir, "200.html")));
  }

  const server = startServer(options);
  const basePath = `http://localhost:${options.port}`;

  await crawl({
    options,
    basePath,
    publicPath: options.publicPath || '/',
    sourceDir,
    beforeFetch: async ({ page }) => {
      if (options.skipThirdPartyRequests) {
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (request.url().startsWith(basePath)) {
            request.continue();
          } else {
            request.abort();
          }
        });
      }
    },
    afterFetch: async ({ page, route }) => {
      const content = await page.content();
      const minifiedContent = minify(content, options.minifyHtml);
      const routePath = route.replace(options.publicPath || '/', "");
      const filePath = path.join(destinationDir, routePath);
 
      // check if file exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        else {
            console.log('File exists');
        }
        fs.writeFileSync(filePath, minifiedContent);
    },
    onEnd: () => {
      server.close();
    },
  });
};

if (require.main === module) {
  const userOptions = {}; // Add logic here to load user options if needed
  run(userOptions).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

exports.run = run;
exports.defaultOptions = defaultOptions;

// Helper functions for crawling
const skipThirdPartyRequests = async opt => {
  const { page, options, basePath } = opt;
  if (!options.skipThirdPartyRequests) return;
  await page.setRequestInterception(true);
  page.on("request", request => {
    if (request.url().startsWith(basePath)) {
      request.continue();
    } else {
      request.abort();
    }
  });
};

const enableLogging = opt => {
  const { page, options, route, onError, sourcemapStore } = opt;
  page.on("console", msg => {
    const text = msg.text();
    if (text === "JSHandle@object") {
      Promise.all(msg.args().map(objectToJson)).then(args =>
        console.log(`💬  console.log at ${route}:`, ...args)
      );
    } else if (text === "JSHandle@error") {
      Promise.all(msg.args().map(errorToString)).then(args =>
        console.log(`💬  console.log at ${route}:`, ...args)
      );
    } else {
      console.log(`️️️💬  console.log at ${route}:`, text);
    }
  });
  page.on("error", msg => {
    console.log(`🔥  error at ${route}:`, msg);
    onError && onError();
  });
  page.on("pageerror", e => {
    if (options.sourceMaps) {
      mapStackTrace(e.stack || e.message, {
        isChromeOrEdge: true,
        store: sourcemapStore || {}
      })
        .then(result => {
          const stackRows = result.split("\n");
          const puppeteerLine =
            stackRows.findIndex(x => x.includes("puppeteer")) ||
            stackRows.length - 1;

          console.log(
            `🔥  pageerror at ${route}: ${(e.stack || e.message).split(
              "\n"
            )[0] + "\n"}${stackRows.slice(0, puppeteerLine).join("\n")}`
          );
        })
        .catch(e2 => {
          console.log(`🔥  pageerror at ${route}:`, e);
          console.log(
            `️️️⚠️  warning at ${route} (error in source maps):`,
            e2.message
          );
        });
    } else {
      console.log(`🔥  pageerror at ${route}:`, e);
    }
    onError && onError();
  });
  page.on("response", response => {
    if (response.status() >= 400) {
      let route = "";
      try {
        route = response._request
          .headers()
          .referer.replace(`http://localhost:${options.port}`, "");
      } catch (e) {}
      console.log(
        `️️️⚠️  warning at ${route}: got ${response.status()} HTTP code for ${response.url()}`
      );
    }
  });
};

const getLinks = async opt => {
  const { page } = opt;
  const anchors = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a")).map(anchor => {
      if (anchor.href.baseVal) {
        const a = document.createElement("a");
        a.href = anchor.href.baseVal;
        return a.href;
      }
      return anchor.href;
    })
  );

  const iframes = await page.evaluate(() =>
    Array.from(document.querySelectorAll("iframe")).map(iframe => iframe.src)
  );
  return anchors.concat(iframes);
};


const createTracker = (page) => {
  let requestCount = 0;
  let successCount = 0;
  let failureCount = 0;
  const pendingRequests = new Set();

  const updateStatus = (request) => {
    if (request._failureText) { failureCount += 1; } 
    else { successCount += 1; }
    pendingRequests.delete(request);
  };

  const onRequest = (request) => {
    requestCount += 1;
    pendingRequests.add(request);
  };

  const onRequestFinished = (request) => updateStatus(request);
  const onRequestFailed = (request) => updateStatus(request);

  page.on('request', onRequest);
  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFailed);

  const dispose = () => {
    page.off('request', onRequest);
    page.off('requestfinished', onRequestFinished);
    page.off('requestfailed', onRequestFailed);
  };

  const augmentTimeoutError = (error) => {
    return `${error.message}\nPending requests: ${pendingRequests.size}\nSuccess requests: ${successCount}\nFailure requests: ${failureCount}\nRequest count: ${requestCount}`;
  };

  return {
    dispose,
    augmentTimeoutError,
  };
};

const objectToJson = jsHandle => jsHandle.jsonValue();

const errorToString = async jsHandle => {
    try {
      return await jsHandle.evaluate(error => error.toString());
    } catch (e) {
      return jsHandle.toString();
    }
  };
  