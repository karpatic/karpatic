#!/usr/bin/env node

const puppeteer = require("puppeteer");
const express = require("express");
const serveStatic = require("serve-static");
const fallback = require("express-history-api-fallback");
const path = require("path");
const nativeFs = require("fs");
const mkdirp = require("mkdirp");
const minify = require("html-minifier").minify;

// Main flow:
// run() → startServer() → crawl() → fetchPage() → save HTML files

// Usage:
// node react_snap_replacement.js --include "/index.html,/about.html" --source "./build" --headless

const defaultOptions = {

  port: 45678,
  crawl: true,
  source: "./docs",
  destination: "./docs",
  include: ["/index.html"],
  userAgent: "Prerendererest",
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
  skipExistingCheck: false,
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
  let streamClosed = false;
  const errorReport = {
    pageErrors: [],
    consoleErrors: [],
    httpErrors: [],
    fetchErrors: []
  };

  // exit process
  const onSigint = () => {
    console.log("\nGracefully shutting down...");
    process.exit(1);
  };
  process.on("SIGINT", onSigint);
 
  // Exit on unhandled promise rejections
  process.on("unhandledRejection", error => {
    console.log("🔥  UnhandledPromiseRejectionWarning", error);
    errorReport.pageErrors.push({ route: 'global', error: error.message });
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
    if (!skipExistingFile) {
        console.log(`🕸 Pulling file ${route}`);
      try {
        const page = await browser.newPage();
        const client = await page.target().createCDPSession();
        await client.send('ServiceWorker.disable');
        await page.setCacheEnabled(options.puppeteer.cache);
        if (options.viewport) await page.setViewport(options.viewport);
        if (options.skipThirdPartyRequests) await skipThirdPartyRequests({ page, options, basePath });
        enableLogging({ page, options, route, onError: (error) => { 
          errorReport.pageErrors.push({ route, error }); 
        }, sourcemapStore, errorReport });
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
          console.log(`🕸 Crawling Rendered Page: ${route}`);
          const links = await getLinks({ page }); 
          links.forEach(addToQueue);
        }
        if (afterFetch) await afterFetch({ page, route, browser, addToQueue });
        await page.close();
        console.log(`✅  crawled ${processed + 1} out of ${enqued} (${route})`);
      } catch (e) {
        console.log(`🔥  error at ${route}`, e);
        errorReport.fetchErrors.push({ route, error: e.message });
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

  while (queue.length > 0) {
    await Promise.all(
      queue.splice(0, options.concurrency).map(fetchPage)
    );
  }

  await browser.close();
  
  // Print error report
  console.log('\n📊 CRAWLING COMPLETE - ERROR REPORT:');
  console.log('=====================================');
  
  const totalErrors = errorReport.pageErrors.length + errorReport.consoleErrors.length + 
                     errorReport.httpErrors.length + errorReport.fetchErrors.length;
  
  if (totalErrors === 0) {
    console.log('✅ No errors detected during crawling!');
  } else {
    console.log(`❌ Total errors found: ${totalErrors}\n`);
    
    if (errorReport.fetchErrors.length > 0) {
      console.log(`🔥 Fetch Errors (${errorReport.fetchErrors.length}):`);
      errorReport.fetchErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log('');
    }
    
    if (errorReport.pageErrors.length > 0) {
      console.log(`🔥 Page Errors (${errorReport.pageErrors.length}):`);
      errorReport.pageErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log('');
    }
    
    if (errorReport.consoleErrors.length > 0) {
      console.log(`🔥 Console Errors (${errorReport.consoleErrors.length}):`);
      errorReport.consoleErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log('');
    }
    
    if (errorReport.httpErrors.length > 0) {
      console.log(`⚠️  HTTP Errors (${errorReport.httpErrors.length}):`);
      errorReport.httpErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log('');
    }
  }
  
  onEnd && onEnd();
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

  if (!options.skipExistingCheck && fs.existsSync(path.join(sourceDir, "200.html"))) {
    throw new Error("Cannot run prerendererest - this will break the build");
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
 
      // Create directories if they do not exist
      if (!fs.existsSync(path.dirname(filePath))) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      fs.writeFileSync(filePath, minifiedContent);
    },
    onEnd: () => {
      server.close();
    },
  });
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const userOptions = {};
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: prerendererest [options]

Options:
  --source <path>              Source directory (default: ./docs)
  --destination <path>         Destination directory (default: same as source)
  --include <pages>            Comma-separated list of pages to include (default: /index.html)
  --headless                   Run browser in headless mode
  --crawl                      Enable automatic crawling (default: true)
  --no-crawl                   Disable automatic crawling
  --port <number>              Port for local server (default: 45678)
  --concurrency <number>       Number of concurrent processes (default: 1)
  --userAgent <string>         Custom user agent (default: Prerendererest)
  --viewport <json>            Viewport size as JSON object (default: {"width":480,"height":850})
  --skipThirdPartyRequests     Block external requests during rendering
  --skipExistingCheck          Skip the 200.html existence check
  --minifyHtml <json>          HTML minification options as JSON
  --removeScriptTags           Remove script tags from HTML
  --removeStyleTags            Remove style tags from HTML
  --asyncScriptTags            Add async attribute to script tags
  --inlineCss                  Inline CSS styles
  --preloadImages              Add preload hints for images
  --puppeteerArgs <args>       Comma-separated Puppeteer arguments
  -h, --help                   Show this help message

Examples:
  prerendererest --source ./build --headless
  prerendererest --include "/index.html,/about.html" --source ./build --headless
  prerendererest --source ./build --destination ./dist --crawl --concurrency 4
`);
    process.exit(0);
  }
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--include' && args[i + 1]) {
      userOptions.include = args[i + 1].split(',');
      i++;
    } else if (args[i] === '--source' && args[i + 1]) {
      userOptions.source = args[i + 1];
      i++;
    } else if (args[i] === '--destination' && args[i + 1]) {
      userOptions.destination = args[i + 1];
      i++;
    } else if (args[i] === '--headless') {
      userOptions.headless = true;
    } else if (args[i] === '--port' && args[i + 1]) {
      userOptions.port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--crawl') {
      userOptions.crawl = true;
    } else if (args[i] === '--no-crawl') {
      userOptions.crawl = false;
    } else if (args[i] === '--userAgent' && args[i + 1]) {
      userOptions.userAgent = args[i + 1];
      i++;
    } else if (args[i] === '--puppeteerArgs' && args[i + 1]) {
      userOptions.puppeteerArgs = args[i + 1].split(',');
      i++;
    } else if (args[i] === '--puppeteer.cache' && args[i + 1]) {
      userOptions.puppeteer = userOptions.puppeteer || {};
      userOptions.puppeteer.cache = args[i + 1] === 'true';
      i++;
    } else if (args[i] === '--minifyHtml' && args[i + 1]) {
      try {
        userOptions.minifyHtml = JSON.parse(args[i + 1]);
      } catch {
        // ignore parse error
      }
      i++;
    } else if (args[i] === '--viewport' && args[i + 1]) {
      try {
        userOptions.viewport = JSON.parse(args[i + 1]);
      } catch {
        // ignore parse error
      }
      i++;
    } else if (args[i] === '--skipThirdPartyRequests') {
      userOptions.skipThirdPartyRequests = true;
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      userOptions.concurrency = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--inlineCss') {
      userOptions.inlineCss = true;
    } else if (args[i] === '--removeStyleTags') {
      userOptions.removeStyleTags = true;
    } else if (args[i] === '--preloadImages') {
      userOptions.preloadImages = true;
    } else if (args[i] === '--asyncScriptTags') {
      userOptions.asyncScriptTags = true;
    } else if (args[i] === '--removeScriptTags') {
      userOptions.removeScriptTags = true;
    } else if (args[i] === '--skipExistingCheck') {
      userOptions.skipExistingCheck = true;
    }
  }
  
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
  const { page, options, route, onError, sourcemapStore, errorReport } = opt;
  page.on("console", msg => {
    const text = msg.text();
    if (text === "JSHandle@object") {
      Promise.all(msg.args().map(objectToJson)).then(args =>
        console.log(`💬  console.log at ${route}:`, ...args)
      );
    } else if (text === "JSHandle@error") {
      Promise.all(msg.args().map(errorToString)).then(args => {
        console.log(`💬  console.log at ${route}:`, ...args);
        errorReport.consoleErrors.push({ route, error: args.join(' ') });
      });
    } else {
      console.log(`️️️💬  console.log at ${route}:`, text);
    }
  });
  page.on("error", msg => {
    console.log(`🔥  error at ${route}:`, msg);
    errorReport.pageErrors.push({ route, error: msg.message });
    onError && onError(msg.message);
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

          const errorMsg = `${(e.stack || e.message).split("\n")[0] + "\n"}${stackRows.slice(0, puppeteerLine).join("\n")}`;
          console.log(`🔥  pageerror at ${route}: ${errorMsg}`);
          errorReport.pageErrors.push({ route, error: errorMsg });
        })
        .catch(e2 => {
          console.log(`🔥  pageerror at ${route}:`, e);
          console.log(`️️️⚠️  warning at ${route} (error in source maps):`, e2.message);
          errorReport.pageErrors.push({ route, error: e.message });
        });
    } else {
      console.log(`🔥  pageerror at ${route}:`, e);
      errorReport.pageErrors.push({ route, error: e.message });
    }
    onError && onError(e.message);
  });
  page.on("response", response => {
    if (response.status() >= 400) {
      let responseRoute = "";
      try {
        responseRoute = response._request
          .headers()
          .referer.replace(`http://localhost:${options.port}`, "");
      } catch (e) {}
      const errorMsg = `got ${response.status()} HTTP code for ${response.url()}`;
      console.log(`️️️⚠️  warning at ${responseRoute}: ${errorMsg}`);
      errorReport.httpErrors.push({ route: responseRoute, error: errorMsg });
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

const objectToJson = async jsHandle => {
  try {
    return await jsHandle.jsonValue();
  } catch (e) {
    // If jsonValue fails, try to get a string representation
    try {
      return await jsHandle.evaluate(obj => {
        if (obj === null) return 'null';
        if (obj === undefined) return 'undefined';
        if (typeof obj === 'function') return obj.toString();
        if (typeof obj === 'object') {
          try {
            return JSON.stringify(obj, null, 2);
          } catch {
            return Object.prototype.toString.call(obj);
          }
        }
        return String(obj);
      });
    } catch {
      return jsHandle.toString();
    }
  }
};
const errorToString = async jsHandle => {
    try {
      return await jsHandle.evaluate(error => error.toString());
    } catch (e) {
      return jsHandle.toString();
    }
  };
