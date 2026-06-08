window.w = window;

//
// route.js
// 

// navEvent: 
// Handles clicks on relative links, 
// calls handleRoute for different pages or scrolls to anchor on same page, 
// opens parent <details> elements, 
// updates history

// handleRoute: 
// Registers service worker, 
// updates window.meta from path using nb2json (local) / JSON fetch (prod) / CMS fallback, 
// imports refresh_template.js, 
// dispatches refresh event


export const navEvent = async (push) => {
  console.group("Route: navEvent");

  let href = push || location.href;
  const [hrefBase, hrefFragment] = href.split("#");
  const currentBase = location.href.split("#")[0];
  const hasHash = href.indexOf("#") !== -1;
  const isAnchorOnly = hrefBase === currentBase && hasHash;
  const targetEl = hasHash ? document.getElementById(hrefFragment) : null;
  const currentHash = (location.hash || "").replace("#", "");

  const openParentDetails = (el) => {
    let ancestor = el;
    while (ancestor) {
      if (ancestor.tagName?.toLowerCase() === "details") {
        ancestor.open = true;
      }
      ancestor = ancestor.parentElement;
    }
  };

  // Decide if base route changes (non-anchor) and avoid duplicate pushes
  const baseChanged = !isAnchorOnly && hrefBase !== currentBase;

  // Only route when base actually changes
  if (baseChanged && hrefBase !== w.href?.split("#")[0]) {
    await handleRoute();
    w.href = href;
  }

  // Update browser history carefully to avoid duplicates
  if (baseChanged) {
    // Skip pushing if last pushed base equals the incoming base
    if (w.lastPushedBase !== hrefBase) {
      history.pushState({}, "", push);
      w.lastPushedBase = hrefBase;
    }
  } else if (isAnchorOnly) {
    // For anchor-only navigation, replace instead of push to avoid history spam
    if (hrefFragment && currentHash !== hrefFragment) {
      history.replaceState({}, "", href);
      location.hash = hrefFragment;
      w.href = href; // keep internal href tracker in sync for subsequent checks
    }
    // If hash is identical, do not push/replace
  }

  // Open parent details elements and scroll to target or top
  setTimeout(() => {
    targetEl && openParentDetails(targetEl);
    (!hasHash
      ? () => window.scrollTo({ top: 0, behavior: "smooth" })
      : () => targetEl?.scrollIntoView({ behavior: "smooth" }))();
  }, 100);  

  console.groupEnd();
};

export const handleRoute = async () => {
  console.group("Route: HandleRoute");  

  if (w.newRoute.includes("undefined")){
    console.log("Invalid pathname detected:", w.newRoute);
    return;
  }

  // One-time initialization: service worker and template import
  w.meta || (!isLocal && registerServiceWorker());
  w.toast ||
    (await import(/* webpackChunkName: "template" */ "./refresh_template.js"));

  // Parse route: default to 'index' for root, clean breadcrumb artifacts (./, ../, leading/trailing slashes)
  let route =
    w.newRoute == "/"
      ? "index"
      : w.newRoute
          .replaceAll("/docs/", "/")
          .replaceAll("./", "")
          .replaceAll("../", "")
          .replace(".html", "")
          .replace(/^\//, "").replace("build/", "")
          .replace(/\/$/, ""); 

  // Determine fetch URL: JSON (prod/prerendering) or ipynb (local dev)
  let url =
    !isLocal || preRendering
      ? `/rsc/posts/${route}.json`
      : `/ipynb/${route}.ipynb`;
  let content = {};

  
  // Fetch content: Try JSON first, then ipynb conversion, then CMS fallback, with error handling and reload on total failure
  try {
    content = await (!isLocal || preRendering
      ? await (async () => {
          return (await fetch(url)).json();
        })()
      : (
          await (async () => {
            let x = await import(
              /* webpackChunkName: "convert" */ "../../../../packages/ipynb2web/src/convert.mjs"
            );
            return x;
          })()
        ).nb2json(url, false));
  } catch (err) {
    try{ 
      console.log('Get Failed. Trying to get content from CMS.');
      let txt = route.split('/').pop(); // Title from last route segment
      // Transform route to CMS path format (e.g., 'blog/post' -> 'Blog_Post')
      let path = route.split('/').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join('_');
      let tryThisUrl = 'https://getfrom.net/cms/notes/' + path; 
      let text = await (await fetch(tryThisUrl)).text();  
      let marked = await import('/rsc/cdn/marked.js'); // Import marked and convert markdown to HTML
      content = {meta: {title: txt, markdown: 'true'}, content: marked.marked(text)};
    }
    catch{
      console.log('Unable to get content');
      // Total failure: reload with #reload hash to prevent infinite loop
      console.log("GET_CONTENT:ERROR", {
        givenPath: w.newRoute,
        route: route,
      });
      if (location.hash != "#reload") {
        location.hash = "reload";
        location.reload();
      } else {
        console.log(err);
      }
    }
  }

  // Update metadata (store old, assign new)
  w.oldMeta = w.meta;
  w.meta = content.meta;
  meta.content = content.content;

  // Dispatch refresh event (listeners in refresh_template.js populate w.newTemplate & update TOC)
  console.log("Dispatching refresh");
  console.groupEnd();
  w.dispatchEvent(new CustomEvent("refresh"));
};

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register(
      "/utils/service-worker.js"
    );
    // Handle SW updates when file is modified
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state != "installed") return;
        if (navigator.serviceWorker.controller) {
          console.log(
            "New content is available; Purge occurred. fresh content added to the cache. Refresh."
          );
        } else {
          console.log("Content is cached for offline use."); // Everything has been precached
        }
      };
    };
  } catch (error) {
    console.error(`Registration failed with ${error}`);
  }
};
