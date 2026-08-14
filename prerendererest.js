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
// node react_snap_replacement.js --entry "/index.html,/about.html" --source "./build" --headless

//
// This script prerenders SPA routes by crawling the 'entry' pages for relative links.
// Express serves the the SPA file for all unmatched routes.
// Puppeteer loads these routes to generate static HTML files for each page.
//
// Does not account for hydration drift.
//

// hosting prerendered spas on github is annoying. why?
// 1. we want to compile our assets which sends things to /build

const defaultOptions = {
  port: 45678,
  crawl: true,
  source: "/",
  entry: ["/docs/index.html"],
  replaceEntryWPrerender: true,
  clearEntries: false, // RM entry file forcing use of spa fallback on it. Not really needed as wp rebuilds the page.
  clearDestination: true, // RM existing files in destination dir.
  destination: "./docs",
  spa: "404.html", // fallback page used if file not found.
  publicPath: "/docs/",
  userAgent: "Prerendererest", // source can use this to detect prerenderer env.
  headless: false,
  puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  puppeteer: { cache: false },
  minifyHtml: {
    collapseWhitespace: true,
    removeComments: true,
  },
  viewport: { width: 480, height: 850 },
  skipThirdPartyRequests: false,
  concurrency: 1,
  limit: null, // max number of pages to crawl; null = unlimited
  inlineCss: false,
  removeStyleTags: false,
  preloadImages: false,
  asyncScriptTags: false,
  removeScriptTags: false,
  skipExistingCheck: true, // false to prevent double rendering.
  keepPagesOpen: false,
  rewriteRules: null,
  sitemapPath: "./sitemap.txt",
  sitemapBaseUrl: "https://charleskarpati.com",
  useExistingSitemap: false,
};

const resolvePuppeteerExecutablePath = (options = {}) => {
  if (options.puppeteerExecutablePath) return options.puppeteerExecutablePath;

  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
  if (envPath && nativeFs.existsSync(envPath)) return envPath;

  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];

  for (const candidate of candidates) {
    if (nativeFs.existsSync(candidate)) return candidate;
  }

  return undefined;
};

const defaults = userOptions => {
  const options = { ...defaultOptions, ...userOptions };
  options.destination = options.destination || options.source;
  if (!options.entry.length) throw new Error("Entry option should be non-empty");
  return options;
};

const toRouteKey = route => {
  const normalizedRoute = (route || "").split("?")[0].split("#")[0];
  return normalizedRoute === "/"
    ? "index"
    : normalizedRoute
        .replaceAll("/docs/", "/")
        .replaceAll("./", "")
        .replaceAll("../", "")
        .replace(/\.html$/i, "")
        .replace(/^\//, "")
        .replace("build/", "")
        .replace(/\/$/, "");
};

const hasLocalContent = ({ route, sourceDir }) => {
  const routeKey = toRouteKey(route);
  if (!routeKey) return true;

  const candidates = [
    path.join(sourceDir, route.replace(/^\//, "")),
    path.join(sourceDir, `${routeKey}.html`),
    path.join(sourceDir, `${routeKey}.json`),
    path.join(sourceDir, "rsc", "posts", `${routeKey}.json`),
  ];

  return candidates.some(candidate => nativeFs.existsSync(candidate));
};

const routeHasChildren = ({ route, sourceDir }) => {
  const routeKey = toRouteKey(route);
  if (!routeKey) return false;

  const childDir = path.join(sourceDir, "rsc", "posts", routeKey);
  try {
    return nativeFs.statSync(childDir).isDirectory();
  } catch {
    return false;
  }
};

const resolveOutputPath = ({ route, destinationDir, publicPath, sourceDir }) => {
  let routePath = route.replace(publicPath || "/", "").replace(/^\/+/, "");

  if (!routePath) {
    return path.join(destinationDir, "index.html");
  }

  const { ext } = path.parse(routePath);
  if (!ext && routeHasChildren({ route, sourceDir })) {
    routePath = `${routePath}.html`;
  }

  return path.join(destinationDir, routePath);
};

const shouldServeSpaRoute = ({ pathname, publicPath }) => {
  if (!publicPath || publicPath === "/") return false;
  if (!pathname.startsWith(publicPath)) return false;

  const { ext } = path.parse(pathname);
  return ext === "" || ext === ".html";
};

const normalizeDocsAssetPath = pathname => {
  if (!pathname?.startsWith("/docs/")) return pathname;

  const assetRoots = ["/build/", "/rsc/", "/images/", "/audio/", "/cdn/"];
  for (const assetRoot of assetRoots) {
    const assetIndex = pathname.indexOf(assetRoot);
    if (assetIndex > 0) {
      return pathname.slice(assetIndex);
    }
  }

  return pathname;
};

const sitemapKey = sitemapUrl => {
  try {
    const parsedUrl = new URL(sitemapUrl);
    let pathname = parsedUrl.pathname.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "");
    pathname = pathname === "/" ? pathname : pathname.replace(/\/$/, "");
    return `${parsedUrl.hostname.toLowerCase()}${pathname}`;
  } catch {
    return sitemapUrl.trim();
  }
};

const normalizeSitemapPublicPath = publicPath => {
  let normalizedPublicPath = publicPath || "/";
  if (!normalizedPublicPath.startsWith("/")) normalizedPublicPath = `/${normalizedPublicPath}`;
  if (!normalizedPublicPath.endsWith("/")) normalizedPublicPath = `${normalizedPublicPath}/`;
  return normalizedPublicPath;
};

const routeToSitemapUrl = ({ route, options }) => {
  const baseUrl = (options.sitemapBaseUrl || "").replace(/\/+$/, "");
  if (!baseUrl || !route) return null;

  let pathname = route.split("?")[0].split("#")[0];
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  const publicPath = normalizeSitemapPublicPath(options.publicPath);
  if (publicPath !== "/" && !pathname.startsWith(publicPath)) {
    pathname = `${publicPath.replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
  }

  return `${baseUrl}${pathname.replace(/\/{2,}/g, "/")}`;
};

const shouldAddRouteToSitemap = ({ route, options }) => {
  const pathname = (route || "").split("?")[0].split("#")[0];
  const { ext } = path.parse(pathname);
  if (ext && ext !== ".html") return false;

  const publicPath = normalizeSitemapPublicPath(options.publicPath);
  const spaRoute = `/${options.spa.replace(/^\/+/, "")}`;
  const routeWithoutPublicPath = pathname.startsWith(publicPath)
    ? `/${pathname.slice(publicPath.length).replace(/^\/+/, "")}`
    : pathname;

  return routeWithoutPublicPath !== spaRoute;
};

const updateSitemap = ({ routes, options, fs }) => {
  const sitemapPath = options.sitemapPath && String(options.sitemapPath).trim();
  if (!sitemapPath) return;

  const urls = [];
  const keys = new Set();
  const addUrl = sitemapUrl => {
    if (!sitemapUrl) return false;
    const trimmedUrl = sitemapUrl.trim();
    if (!trimmedUrl) return false;

    const key = sitemapKey(trimmedUrl);
    if (keys.has(key)) return false;

    keys.add(key);
    urls.push(trimmedUrl);
    return true;
  };

  const resolvedSitemapPath = path.resolve(process.cwd(), sitemapPath);
  if (options.useExistingSitemap) {
    const inputPath = resolvedSitemapPath;
    if (fs.existsSync(inputPath)) {
      fs
        .readFileSync(inputPath, "utf8")
        .split(/\r?\n/)
        .forEach(addUrl);
    }
  }

  let added = 0;
  for (const route of routes) {
    if (!shouldAddRouteToSitemap({ route, options })) continue;
    if (addUrl(routeToSitemapUrl({ route, options }))) added++;
  }

  const sitemapContent = `${urls.join("\n")}\n`;
  fs.mkdirSync(path.dirname(resolvedSitemapPath), { recursive: true });
  fs.writeFileSync(resolvedSitemapPath, sitemapContent);

  console.log(`🗺️  Updated sitemap with ${added} prerendered route(s): ${sitemapPath}`);
};

const crawl = async opt => {
  const { options, basePath, beforeFetch, afterFetch, onEnd, publicPath, sourceDir } = opt;
  let streamClosed = false;
  const errorReport = {
    pageErrors: [],
    consoleErrors: [],
    httpErrors: [],
    fetchErrors: [],
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
    errorReport.pageErrors.push({ route: "global", error: error.message });
  });

  const queue = [];
  let enqued = 0;
  let processed = 0;
  const uniqueUrls = new Set();
  const sourcemapStore = {};
  const baseOrigin = new URL(basePath).origin;

  const addToQueue = newUrl => {
    if (!newUrl) return;
    if (newUrl.includes("mailto:")) return;
    if (newUrl.includes("javascript:")) return;
    let parsedUrl;
    try {
      parsedUrl = new URL(newUrl, basePath);
    } catch {
      return;
    }

    if (!/^https?:$/.test(parsedUrl.protocol)) return;

    if (options.rewriteRules) {
      for (const [from, to] of options.rewriteRules) {
        if (parsedUrl.pathname.startsWith(from)) {
          parsedUrl.pathname = parsedUrl.pathname.replace(from, to);
        }
      }
    }

    parsedUrl.search = "";
    parsedUrl.hash = "";

    if (parsedUrl.origin !== baseOrigin) return;

    const route = parsedUrl.pathname;
    if (!hasLocalContent({ route, sourceDir })) {
      console.log(`↪️ Skipping remote-backed route ${route}`);
      return;
    }

    newUrl = parsedUrl.toString();

    // Respect global crawl limit
    if (options.limit !== null && uniqueUrls.size >= options.limit) return;
    if (!uniqueUrls.has(newUrl) && !streamClosed) {
      uniqueUrls.add(newUrl);
      enqued++;
      queue.push(newUrl);
      if (enqued == 2 && options.crawl) {
        addToQueue(`${basePath}${publicPath}404.html`);
      }
    }
  };

  const resolvedExecutablePath = resolvePuppeteerExecutablePath(options);
  resolvedExecutablePath && console.log(`ℹ️  Using browser executable: ${resolvedExecutablePath}`);

  const browser = await puppeteer.launch({
    headless: options.headless,
    args: options.puppeteerArgs,
    executablePath: resolvedExecutablePath,
    ignoreHTTPSErrors: options.puppeteerIgnoreHTTPSErrors,
    handleSIGINT: false,
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
    } else {
    }

    // Crawl the page if it's not already crawled and it's not a third-party URL
    if (!skipExistingFile) {
      console.log(`🕸 Pulling file ${route}`);
      try {
        const page = await browser.newPage();
        const client = await page.target().createCDPSession();
        await client.send("ServiceWorker.disable");
        await page.setCacheEnabled(options.puppeteer.cache);
        if (options.viewport) await page.setViewport(options.viewport);
        if (options.skipThirdPartyRequests) await skipThirdPartyRequests({ page, options, basePath });
        enableLogging({
          page,
          options,
          route,
          onError: error => {
            errorReport.pageErrors.push({ route, error });
          },
          sourcemapStore,
          errorReport,
        });
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
        if (!options.keepPagesOpen) {
          await page.close();
        } else {
          console.log(`ℹ️  keepPagesOpen enabled: page left open (${route})`);
        }
        console.log(`✅  crawled ${processed + 1} out of ${enqued} (${route})`);
      } catch (e) {
        console.log(`🔥  error at ${route}`, e);
        errorReport.fetchErrors.push({ route, error: e.message });
      }
    } else {
      console.log(`DID NOT CRAWL ${route}`);
    }
    processed++;
    if (enqued === processed) {
      streamClosed = true;
    }
    return pageUrl;
  };

  if (options.entry) {
    options.entry.map(x => addToQueue(`${basePath}${x}`));
  }

  while (queue.length > 0) {
    await Promise.all(queue.splice(0, options.concurrency).map(fetchPage));
  }

  if (!options.keepPagesOpen) {
    await browser.close();
  } else {
    console.log("ℹ️  keepPagesOpen enabled: browser left running.");
  }

  // Print error report
  console.log("\n📊 CRAWLING COMPLETE - ERROR REPORT:");
  console.log("=====================================");

  const totalErrors =
    errorReport.pageErrors.length +
    errorReport.consoleErrors.length +
    errorReport.httpErrors.length +
    errorReport.fetchErrors.length;

  if (totalErrors === 0) {
    console.log("✅ No errors detected during crawling!");
  } else {
    console.log(`❌ Total errors found: ${totalErrors}\n`);

    if (errorReport.fetchErrors.length > 0) {
      console.log(`🔥 Fetch Errors (${errorReport.fetchErrors.length}):`);
      errorReport.fetchErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log("");
    }

    if (errorReport.pageErrors.length > 0) {
      console.log(`🔥 Page Errors (${errorReport.pageErrors.length}):`);
      errorReport.pageErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log("");
    }

    if (errorReport.consoleErrors.length > 0) {
      console.log(`🔥 Console Errors (${errorReport.consoleErrors.length}):`);
      errorReport.consoleErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log("");
    }

    if (errorReport.httpErrors.length > 0) {
      console.log(`⚠️  HTTP Errors (${errorReport.httpErrors.length}):`);
      errorReport.httpErrors.forEach(({ route, error }) => {
        console.log(`  - ${route}: ${error}`);
      });
      console.log("");
    }
  }

  onEnd && onEnd();
};

const run = async (userOptions, { fs } = { fs: nativeFs }) => {
  const options = defaults(userOptions);
  const sourceDir = path.normalize(`${process.cwd()}/${options.source}`);
  const destinationDir = path.normalize(`${process.cwd()}/${options.destination}`);

  // Optionally clear destination directory before prerendering
  if (options.clearDestination) {
    try {
      if (fs.existsSync(destinationDir)) {
        console.log(`🧹 Clearing destination directory: ${destinationDir}`);
        // Remove directory contents
        fs.rmSync(destinationDir, { recursive: true, force: true });
      }
      // Recreate destination directory
      fs.mkdirSync(destinationDir, { recursive: true });
    } catch (e) {
      console.log(`⚠️ Could not clear destination ${destinationDir}: ${e.message}`);
    }
  }

  // Clear entry files to force SPA fallback rendering
  if (options.clearEntries) {
    console.log("🧹 clearEntries enabled: removing entry files before starting server...");
    const uniqEntries = new Set(options.entry.map(e => e.replace(/^\/+/, "")));
    for (const entryFile of uniqEntries) {
      // Avoid deleting the SPA file itself if user accidentally included it
      if (entryFile === options.spa.replace(/^\/+/, "")) {
        console.log(`ℹ️ Skipping SPA file (cannot clear): ${entryFile}`);
        continue;
      }
      const fullPath = path.join(sourceDir, entryFile);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`🧹 Removed entry file: ${entryFile}`);
        } catch (e) {
          console.log(`⚠️ Could not remove entry file ${entryFile}: ${e.message}`);
        }
      } else {
        console.log(`ℹ️ Entry file not found (already absent): ${entryFile}`);
      }
    }
  }

  const startServer = options => {
    const publicPath = options.publicPath || "/";
    const spaPath = path.join(sourceDir, options.spa.replace(/^\/+/, ""));
    const app = express()
      .use((req, res, next) => {
        const originalPath = req.path;
        const normalizedPath = normalizeDocsAssetPath(originalPath);
        if (normalizedPath !== originalPath) {
          req.url = normalizedPath + req.url.slice(originalPath.length);
        }
        next();
      })
      .use((req, res, next) => {
        if (shouldServeSpaRoute({ pathname: req.path, publicPath })) {
          res.sendFile(spaPath);
          return;
        }
        next();
      })
      // Serve root-mounted assets like /build/* during /docs/* prerender crawls.
      .use(serveStatic(sourceDir))
      .use(publicPath, serveStatic(sourceDir))
      .use(fallback(options.spa, { root: sourceDir }));
    const server = require("http").createServer(app);
    server.listen(options.port);
    return server;
  };

  // if (!options.skipExistingCheck && fs.existsSync(path.join(sourceDir, "404.html"))) {
  //   throw new Error("Cannot run prerendererest - this will break the build");
  // }

  // fs.createReadStream(path.join(sourceDir, options.spa)).pipe(fs.createWriteStream(path.join(sourceDir, "404.html")));
  // if (destinationDir !== sourceDir) {
  //   mkdirp.sync(destinationDir);
  //   fs.createReadStream(path.join(sourceDir, options.spa)).pipe(fs.createWriteStream(path.join(destinationDir, "404.html")));
  // }

  const server = startServer(options);
  const basePath = `http://localhost:${options.port}`;
  const renderedRoutes = new Set();

  await crawl({
    options,
    basePath,
    publicPath: options.publicPath || "/",
    sourceDir,
    beforeFetch: async ({ page }) => {
      if (options.skipThirdPartyRequests) {
        await page.setRequestInterception(true);
        page.on("request", request => {
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
      const stripped = content.replace(new RegExp(`https?:\\/\\/localhost:${options.port}`, "g"), "");
      const minifiedStripped = minify(stripped, options.minifyHtml);
      const filePath = resolveOutputPath({
        route,
        destinationDir,
        publicPath: options.publicPath,
        sourceDir,
      });

      // Create directories if they do not exist
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }
      fs.writeFileSync(filePath, minifiedStripped);
      renderedRoutes.add(route);

      if (options.replaceEntryWPrerender) {
        // Normalize route to compare with entries (strip leading slash)
        const normalized = route.replace(/^\/+/, "");
        const entrySet = new Set(options.entry.map(e => e.replace(/^\/+/, "")));
        if (entrySet.has(normalized)) {
          const sourceEntryPath = path.join(sourceDir, normalized);
          try {
            fs.writeFileSync(sourceEntryPath, minifiedStripped);
            console.log(`🔁 Replaced original entry with prerendered HTML: ${normalized}`);
          } catch (e) {
            console.log(`⚠️ Could not replace entry ${normalized}: ${e.message}`);
          }
        }
      }
    },
    onEnd: () => {
      if (!options.keepPagesOpen) {
        server.close();
      } else {
        console.log(`ℹ️  keepPagesOpen enabled: server left running at ${basePath}`);
      }
    },
  });

  updateSitemap({ routes: renderedRoutes, options, fs });
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const userOptions = {};

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: prerendererest [options]

Options:
  --source <path>              Source directory (default: ./docs)
  --destination <path>         Destination directory (default: same as source)
  --entry <pages>              Comma-separated list of pages to use (default: /index.html)
  --replaceEntryWPrerender     Overwrite entry HTML file(s) with prerendered output
  --clearEntries               Remove entry files before starting (forces SPA fallback to render them)
  --spa <file>                 SPA entry point file (default: index.html)
  --headless                   Run browser in headless mode
  --crawl                      Enable automatic crawling (default: true)
  --no-crawl                   Disable automatic crawling
  --port <number>              Port for local server (default: 45678)
  --concurrency <number>       Number of concurrent processes (default: 1)
  --limit <number>             Max number of pages to crawl (default: unlimited)
  --userAgent <string>         Custom user agent (default: Prerendererest)
  --viewport <json>            Viewport size as JSON object (default: {"width":480,"height":850})
  --skipThirdPartyRequests     Block external requests during rendering
  --skipExistingCheck          Skip the 404.html existence check
  --keepPagesOpen              Do not close pages or browser after crawl (debug)
  --minifyHtml <json>          HTML minification options as JSON
  --removeScriptTags           Remove script tags from HTML
  --removeStyleTags            Remove style tags from HTML
  --asyncScriptTags            Add async attribute to script tags
  --inlineCss                  Inline CSS styles
  --preloadImages              Add preload hints for images
  --puppeteerArgs <args>       Comma-separated Puppeteer arguments
  --puppeteerExecutablePath    Explicit browser executable path for Puppeteer
  --rewriteRules <json>        JSON array of [from,to] path prefixes to rewrite
  --sitemapPath <path>         Write sitemap path (default: ./sitemap.txt; empty disables)
  --sitemapBaseUrl <url>       Base URL for prerendered sitemap entries
  --use-w-existing-sitemap     Read existing sitemap entries before writing
  -h, --help                   Show this help message

Examples:
  prerendererest --source ./build --headless
  prerendererest --entry "/index.html,/about.html" --source ./build --clearEntries --headless
  prerendererest --source ./build --destination ./dist --crawl --concurrency 4
`);
    process.exit(0);
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--entry" && args[i + 1]) {
      userOptions.entry = args[i + 1].split(",");
      i++;
    } else if (args[i] === "--replaceEntryWPrerender") {
      userOptions.replaceEntryWPrerender = true;
    } else if (args[i] === "--clearEntries") {
      userOptions.clearEntries = true;
    } else if (args[i] === "--source" && args[i + 1]) {
      userOptions.source = args[i + 1];
      i++;
    } else if (args[i] === "--destination" && args[i + 1]) {
      userOptions.destination = args[i + 1];
      i++;
    } else if (args[i] === "--spa" && args[i + 1]) {
      userOptions.spa = args[i + 1];
      i++;
    } else if (args[i] === "--headless") {
      userOptions.headless = true;
    } else if (args[i] === "--port" && args[i + 1]) {
      userOptions.port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--crawl") {
      userOptions.crawl = true;
    } else if (args[i] === "--no-crawl") {
      userOptions.crawl = false;
    } else if (args[i] === "--userAgent" && args[i + 1]) {
      userOptions.userAgent = args[i + 1];
      i++;
    } else if (args[i] === "--puppeteerArgs" && args[i + 1]) {
      userOptions.puppeteerArgs = args[i + 1].split(",");
      i++;
    } else if (args[i] === "--puppeteerExecutablePath" && args[i + 1]) {
      userOptions.puppeteerExecutablePath = args[i + 1];
      i++;
    } else if (args[i] === "--rewriteRules" && args[i + 1]) {
      try {
        userOptions.rewriteRules = JSON.parse(args[i + 1]);
      } catch {
        console.log('⚠️  Invalid --rewriteRules JSON; ignoring. Expected format: [["/docs/","/"], ["./docs/","./"]]');
      }
      i++;
    } else if (args[i] === "--sitemapPath" && i + 1 < args.length && !args[i + 1].startsWith("--")) {
      userOptions.sitemapPath = args[i + 1];
      i++;
    } else if (args[i] === "--sitemapBaseUrl" && args[i + 1]) {
      userOptions.sitemapBaseUrl = args[i + 1];
      i++;
    } else if (args[i] === "--use-w-existing-sitemap") {
      userOptions.useExistingSitemap = true;
    } else if (args[i] === "--puppeteer.cache" && args[i + 1]) {
      userOptions.puppeteer = userOptions.puppeteer || {};
      userOptions.puppeteer.cache = args[i + 1] === "true";
      i++;
    } else if (args[i] === "--minifyHtml" && args[i + 1]) {
      try {
        userOptions.minifyHtml = JSON.parse(args[i + 1]);
      } catch {
        // ignore parse error
      }
      i++;
    } else if (args[i] === "--viewport" && args[i + 1]) {
      try {
        userOptions.viewport = JSON.parse(args[i + 1]);
      } catch {
        // ignore parse error
      }
      i++;
    } else if (args[i] === "--skipThirdPartyRequests") {
      userOptions.skipThirdPartyRequests = true;
    } else if (args[i] === "--concurrency" && args[i + 1]) {
      userOptions.concurrency = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--limit" && args[i + 1]) {
      userOptions.limit = parseInt(args[i + 1], 10);
      if (Number.isNaN(userOptions.limit)) delete userOptions.limit;
      i++;
    } else if (args[i] === "--inlineCss") {
      userOptions.inlineCss = true;
    } else if (args[i] === "--removeStyleTags") {
      userOptions.removeStyleTags = true;
    } else if (args[i] === "--preloadImages") {
      userOptions.preloadImages = true;
    } else if (args[i] === "--asyncScriptTags") {
      userOptions.asyncScriptTags = true;
    } else if (args[i] === "--removeScriptTags") {
      userOptions.removeScriptTags = true;
    } else if (args[i] === "--skipExistingCheck") {
      userOptions.skipExistingCheck = true;
    } else if (args[i] === "--keepPagesOpen") {
      userOptions.keepPagesOpen = true;
    }
  }

  run(userOptions).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

exports.run = run;
exports.defaultOptions = defaultOptions;
exports.updateSitemap = updateSitemap;

// Remove all files in a target directory. Safe utility if needed elsewhere.
const clearDestination = (dirPath, { fs } = { fs: nativeFs }) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  } catch (e) {
    console.log(`⚠️ clearDestination error for ${dirPath}: ${e.message}`);
    return false;
  }
};
exports.clearDestination = clearDestination;

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
      Promise.all(msg.args().map(objectToJson)).then(args => console.log(`💬  console.log at ${route}:`, ...args));
    } else if (text === "JSHandle@error") {
      Promise.all(msg.args().map(errorToString)).then(args => {
        console.log(`💬  console.log at ${route}:`, ...args);
        errorReport.consoleErrors.push({ route, error: args.join(" ") });
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
        store: sourcemapStore || {},
      })
        .then(result => {
          const stackRows = result.split("\n");
          const puppeteerLine = stackRows.findIndex(x => x.includes("puppeteer")) || stackRows.length - 1;

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
        responseRoute = response._request.headers().referer.replace(`http://localhost:${options.port}`, "");
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

  const iframes = await page.evaluate(() => Array.from(document.querySelectorAll("iframe")).map(iframe => iframe.src));
  return anchors.concat(iframes);
};

const createTracker = page => {
  let requestCount = 0;
  let successCount = 0;
  let failureCount = 0;
  const pendingRequests = new Set();

  const updateStatus = request => {
    if (request._failureText) {
      failureCount += 1;
    } else {
      successCount += 1;
    }
    pendingRequests.delete(request);
  };

  const onRequest = request => {
    requestCount += 1;
    pendingRequests.add(request);
  };

  const onRequestFinished = request => updateStatus(request);
  const onRequestFailed = request => updateStatus(request);

  page.on("request", onRequest);
  page.on("requestfinished", onRequestFinished);
  page.on("requestfailed", onRequestFailed);

  const dispose = () => {
    page.off("request", onRequest);
    page.off("requestfinished", onRequestFinished);
    page.off("requestfailed", onRequestFailed);
  };

  const augmentTimeoutError = error => {
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
        if (obj === null) return "null";
        if (obj === undefined) return "undefined";
        if (typeof obj === "function") return obj.toString();
        if (typeof obj === "object") {
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
