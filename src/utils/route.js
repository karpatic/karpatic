window.w = window;

//
// Routes.js
// 
// index.redirect -> (navEvent or handleRoute)
//
// Main Function: handleRoute
// - registerServiceWorker
// - Update window.meta = {props, content: txt} obtained from path.
// - - Uses nb2json in dev/ and fetch in prod
// - imports & dispatches (refresh_template.js)
//
// Side Function: navEvent
// - User Clicked a Relative Link: Scroll up and call handleRoute or don't and just scroll to the anchor on-page.
// - Browser Back/FWD remembers prior scrollbar position and does not need this fn.
//
// Todo - if navEvent calls handleRoute it needs to be called back at the end for the hashbang to slide.
// Todo - Sitemap open on start or not.
// Todo - Scroll to top.
// todo - notes
// details - summary


// fires when user clicks a relative link.
export const navEvent = async (push) => {
  console.group("Route: navEvent");

  let href = push || location.href;
  const [hrefBase, hrefFragment] = href.split("#");
  const currentBase = location.href.split("#")[0];
  const hasHash = href.indexOf("#") !== -1;
  const isAnchorOnly = hrefBase === currentBase && hasHash;
  const targetEl = hasHash ? document.getElementById(hrefFragment) : null;

  const openParentDetails = (el) => {
    let ancestor = el;
    while (ancestor) {
      if (ancestor.tagName?.toLowerCase() === "details") {
        ancestor.open = true;
      }
      ancestor = ancestor.parentElement;
    }
  };

  // Reload page if relative link is not on same page.
  if (!isAnchorOnly && hrefBase != w.href?.split("#")[0])
    await handleRoute(), (w.href = href);

  // Only update history if navigating to a different p age
  !isAnchorOnly && history.pushState({}, "", push);

  // Scroll to top or el with id of link.
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

  // Call Service Worker Once
  w.meta || (!isLocal && registerServiceWorker());

  // Import template Once
  w.toast ||
    (await import(/* webpackChunkName: "template" */ "./refresh_template.js"));

  // Get Route. Set to index if root. Removes ./, ../ and any leading or trailing slashes caused by breadcrumbs.
  let route =
    w.newRoute == "/"
      ? "index"
      : w.newRoute
          .replaceAll("./", "")
          .replaceAll("../", "")
          .replace(".html", "")
          .replace(/^\//, "").replace("build/", "")
          .replace(/\/$/, "");

  console.log("Route:", { route });

  // Create or Get Routes Metadata/ YAML
  let url =
    !isLocal || preRendering
      ? `/rsc/posts/${route}.json`
      : `/ipynb/${route}.ipynb`;
  let content = {};

  
  // console.log("Route:", { route, url: url });

  try {
    // console.log("Get:", url);
    content = await (!isLocal || preRendering
      ? await (async () => {
          return (await fetch(url)).json();
        })()
      : (
          await (async () => {
            let x = await import(
              /* webpackChunkName: "convert" */ "../../../ipynb2web/src/convert.mjs"
            );
            return x;
          })()
        ).nb2json(url, true));
  } catch (err) {
    try{ 
      console.log('Get Failed. Trying to get content from CMS.');
      // split and grab last part of route
      let txt = route.split('/').pop();
      // todo: read in yaml from markdown.
      // console.log('Trying to get content from:', route);
      let path = route.split('/').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join('_');
      let tryThisUrl = 'https://getfrom.net/cms/notes/' + path; 
      let text = await (await fetch(tryThisUrl)).text();  
      
      let marked = await import('/rsc/cdn/marked.js'); 
      
      content = {meta: {title: txt, markdown: 'true'}, content: marked.marked(text)};
    }
    catch{
      console.log('Unable to get content');
      // No Json or Ipynb found. Reload the page.
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

  // Swap Metadata old and new
  w.oldMeta = w.meta;
  w.meta = content.meta;
  meta.content = content.content;

  // Dispatch pageLoaded event for template/ content hooks
  // Listeners in template.html and | template.js -> Populates w.newTemplate & updates toc.
  console.log("Dispatching load_template");
  console.groupEnd();
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
