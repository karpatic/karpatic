import React from "react";
import ReactDOMServer from "react-dom/server";
import { Helmet, HelmetProvider } from "react-helmet-async";

//
// Head.js
//
// 1. Render the header tags
// 2. Calls main.redirect() when done.
// 3. Removes its own script tag from the html.
//
// Only used in dev/ during build.
// Pulls header.json for default values of non-pwa website
// Header.json and merges w YAML.
// Header.json specified manifest location and merges w it.
// Manifest is auto-generated using webpack and copied to src/
//

(async () => {
  const toCmsFilename = (route) =>
    route
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join("_");

  const fetchJson = async (resource, { timeout = 0 } = {}) => {
    const controller = timeout ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(new Error(`Timeout fetching ${resource}`)), timeout)
      : null;

    try {
      const response = await fetch(resource, controller ? { signal: controller.signal } : undefined);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      }
      return await response.json();
    } finally {
      timer && clearTimeout(timer);
    }
  };

  const resolveRouteMeta = async ({ hr, page, url, filename }) => {
    const remoteNotesPromise = fetchJson("https://getfrom.net/notes/notes.json", {
      timeout: 1200,
    }).catch((error) => {
      w.preRendering ||
        console.warn("HEAD:CMS_NOTES_UNAVAILABLE", {
          pathname: location.pathname,
          filename,
          error: error?.message || String(error),
        });
      return null;
    });

    const localPostPromise = fetchJson(url).catch((error) => {
      w.preRendering ||
        console.warn("HEAD:LOCAL_POST_JSON_UNAVAILABLE", {
          pathname: location.pathname,
          url,
          error: error?.message || String(error),
        });
      return null;
    });

    const notes = await remoteNotesPromise;
    const cms = Array.isArray(notes)
      ? notes.find((x) => (x?.filename || "").toLowerCase() === filename.toLowerCase())
      : Object.values(notes || {}).find(
          (x) => (x?.filename || "").toLowerCase() === filename.toLowerCase()
        );

    if (cms) {
      return {
        ...hr,
        filename: cms.filename,
        summary: cms.summary || hr.summary,
        description: cms.summary || hr.description,
      };
    }

    const postJson = await localPostPromise;
    if (postJson?.meta) {
      return { ...hr, ...postJson.meta };
    }

    w.preRendering ||
      console.warn("HEAD:USING_DEFAULT_META_FALLBACK", {
        pathname: location.pathname,
        url,
        filename,
      });

    return {
      ...hr,
      filename,
      summary: hr.summary || `Notes page for ${page}`,
      description: hr.description || hr.summary || `Notes page for ${page}`,
    };
  };

  // Route to prerendrered
  const page =
    location.pathname
      .replace("/docs/", "/")
      .replace("/", "")
      .replace(/\/$/, "")
      .replace(".html", "") || "index"; // removes leading and trailing slashes 

  // Defaults
  // console.log("HEAD:FETCHING: ./header.json for Page:", page);
  let hr = await fetchJson((await import(`/rsc/header.json`)).default);
 
  // Path to it's YAML or Manifest
  let url = `/${
    (hr.pwapages.split(",").some((x) => page == x) ? "" : "rsc/posts/") + page
  }.json`; 
  // console.log('HEAD:', { url, page, pathname: location.pathname });

  // Check if page in CMS notes list, otherwise use local post JSON or defaults.
  const filename = toCmsFilename(page);
  hr = await resolveRouteMeta({ hr, page, url, filename });

  // Dom generates Helmet which injects the meta tags into the head
  ReactDOMServer.renderToString(
    <HelmetProvider>
      <Helmet>
        <meta charset="UTF-8" />
        <meta
          http-equiv="Content-Security-Policy"
          content="img-src * data:; connect-src *;"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1"
        />
        <title>{hr.tab || hr.longName}</title>
        <meta name="author" content={hr.author} />
        <meta name="description" content={hr.description} />

        {/*
        {forBlog && <link rel="manifest" href="/manifest.json"/> }
        <meta name="HandheldFriendly"   content="True"/>
        <meta name="MobileOptimized"    content="420"/>
        <meta name="subject"            content={hr.type}/>
        <meta name="application-name"   content={hr.applicationname}/> // TODO: Conditionally ENABLE FOR APPs
        */}

        {hr.pwa && <link rel="manifest" href={page + "_manifest.json"} />}
        {hr.pwa && <link rel="apple-touch-icon" href={hr.icon512}></link>}

        <link rel="license" href="https://opensource.org/licenses/MIT" />
        <link rel="canonical" href={`https://${hr.title}.com/${page}`} />
        <link rel="icon" type="image/ico" sizes="16x16" href={hr.icon16} />

        {/*
        <link rel="author"              href={hr.author}/>
        <link rel="me"                  href={hr.owneremail} type="text/html"/>
        <link rel="me"                  href={hr.ownername}/>
        <link rel="me"                  href={hr.ownerphone}/>

        <meta name="geo.region"         content="US-MD" />
        <meta name="geo.placename"      content="Baltimore" />
        <meta name="geo.region"         content={hr.title} />
        <meta name="geo.placename"      content={hr.title} />
        <meta name="geo.position"       content={hr.geoposition} />
        <meta name="ICBM"               content={hr.geoposition} />
        <link rel="icon" type="image/ico" sizes="24x24"     href={hr.icon24}/>
        <link rel="icon" type="image/ico" sizes="32x32"     href={hr.icon32}/>
        <link rel="icon" type="image/ico" sizes="64x64"     href={hr.icon64}/>
        <meta itemprop="image"          content={hr.image}/>
        <meta property="article:author" content={hr.author}/>
        */}
        <meta name="theme-color" content={hr.themecolor} />
        <meta name="robots" content={hr.robots || "index, follow"} />
        <meta
          property="og:url"
          content={`http://www.${hr.title}.com/${page}`}
        />
        <meta property="og:title" content={hr.title} />
        <meta
          property="og:description"
          content={hr.summary || hr.description}
        />
        <meta property="og:type" content={hr.type} />
        <meta property="og:site_name" content={hr.applicationname} />
        <meta property="og:locale" content="en_US" />
        <meta property="op:markup_version" content="v1.0" />
        <meta property="fb:article_style" content="default" />
        <meta property="og:image" content={hr.image} />
        <meta name="twitter:card" content={hr.summary || hr.description} />
        <meta name="twitter:site" content={hr.twittersite} />
        <meta name="twitter:creator" content={hr.twitterauthor} />
        {/*
        <meta itemprop="name"           content={hr.title}/>
        <meta itemprop="description"    content={hr.summary || hr.description}/>
        <meta name="pinterest"          content="nopin" description={"Sorry, you can't save from this website!"}/> 
        */}
      </Helmet>
    </HelmetProvider>
  );

  // Remove the prerender scripts. Runs in Dev / on Prerender.
  Array.from(document.getElementsByTagName("script")).forEach((script) => {
    if (
      new RegExp("head|helmet", "i").test(script.getAttribute("src")) ||
      (!script.type && script.src.includes("webpack-dev-server")) ||
      script.textContent.includes("webpackBootstrap")
    ) {
      script.remove();
      return;
    }
  });

  // 1. Render the route using main.redirect()
  // console.log("HEAD:Dispatching index:redirect()");
  window.redirect?.();

  // 2. Wait for the remainder of the page to load then do some clean up
  setTimeout(() => {
    // console.clear();
    if (!document.body) return;

    // Remove the data-rh meta tag react-snap adds.
    document.querySelectorAll("[data-rh]").forEach((e) => {
      (e.asElement ? e.asElement() : e).removeAttribute("data-rh");
    });

    // Ensure UTF-8 tag is at the top
    document.head.insertBefore(
      document.querySelector('meta[charset="UTF-8"]'),
      document.head.firstChild
    );

    // Move style nodes to head.
    Array.from(document.getElementsByTagName("style")).forEach((style) => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
        document.head.appendChild(style);
      }
    });
  }, 100);
})();
