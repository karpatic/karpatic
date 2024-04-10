window.w = window;

//
// main.redirect -> (navEvent or handleRoute)
// navEvent -> handleRoute
// handleRoute -> registerServiceWorker, loadScripts, 'rfrshTmplate' dispatch (sitemap.js)
//

// User Clicked a Relative Link: Scroll up and reload or scroll to an anchor.
// Browser Back/FWD remembers prior scrollbar position and does not call this fn.
export const navEvent = async () => {
  console.log("~~~> navEvent");

  let href = location.href;

  // Scroll to
  (href.indexOf("#") == -1
    ? () => window.scrollTo({ top: 0, behavior: "smooth" })
    : () => w[href.split("#")[1]]?.scrollIntoView({ behavior: "smooth" }))();

  // Reload
  if (href.split("#")[0] != w.href?.split("#")[0])
    await handleRoute(), (w.href = href);
};

// Loads a route and it's dependencies via it's meta data obtained from it's path.
export const handleRoute = async () => {
  console.log("~~~~~~> HANDLE_ROUTE");

  if (location.pathname.includes("undefined")) return;

  // Call Service Worker Once
  w.meta || (!isLocal && registerServiceWorker());

  // Import template Once
  w.toast ||
    (await import(
      /* webpackChunkName: "template" */ "./refresh_template.js"
    ));

  // Get Route
  let route =
    location.pathname == "/"
      ? "index"
      : location.pathname
        .replaceAll("./", "")
        .replaceAll("../", "")
        .replace(".html", "")
        .replace(/^\//, "")
        .replace(/\/$/, "");

  // Create or Get Routes Metadata/ YAML
  let url = !isLocal || preRendering ? `${location.origin}/posts/${route}.json` : `../../ipynb/${route}.ipynb`
  let content = {}
  try {
    console.log("~~~~~~> GET_CONTENT"); //:PATH:", url );
    content = await (!isLocal || preRendering
      ? (await (async () => {
        return (await fetch(url)).json()
      })()
      )
      : (await (async () => {
        let x = await import(/* webpackChunkName: "convert" */ "../../server/ipynb2web/src/convert.mjs")

        return x
      })()
      ).nb2json(url));
  }
  catch (err) {
    console.log("~~~~~~~~~> handleRoute:GET_CONTENT:ERROR", url, err)
    console.log(err)
  }


  // Swap Metadata old and new
  w.oldMeta = w.meta;
  w.meta = content.meta;
  meta.content = content.content;

  // Dispatch pageLoaded event for template/ content hooks
  // Listeners in template.html and | template.js -> Populates w.newTemplate & updates toc.
  w.dispatchEvent(new CustomEvent("load_template"));

};

const registerServiceWorker = async () => {
  // console.log('~~~~~~~~> registerServiceWorker');
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register(
      "/utils/service-worker.js"
    );
    /*
        if (registration.installing) { console.log("Service worker installing"); } 
        else if (registration.waiting) { console.log("Service worker installed"); } 
        else if (registration.active) { console.log("Service worker active"); } 
        */
    // Fired when the SW file was modified
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state != "installed") return;
        if (navigator.serviceWorker.controller) {
          console.log(
            "New content is available; Purge occurred. fresh content added to the cache. Refresh."
          );
        } else {
          console.log("Content is cached for offline use.");
        } // Everything has been precached.
      };
    };
  } catch (error) {
    console.error(`Registration failed with ${error}`);
  }
};
