window.w = window;

//
// main.redirect -> (navEvent or handleRoute)
// navEvent -> handleRoute
// handleRoute -> registerServiceWorker, loadScripts, 'refreshTemplates' dispatch (sitemap.js)
//

// User Clicked: Scroll up and reload or scroll to an anchor.
// Browser Back/FWD remembers prior scrollbar position and does not call this fn.
export const navEvent = async () => {
  console.log("~~~~> navEvent");

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
  console.log("~~~~~~> handleRoute: START ");

  if (location.pathname.includes("undefined")) return;

  // Call Service Worker Once
  w.meta || (!isLocal && registerServiceWorker());

  // Import template Once
  w.toast ||
    (await import(
      /* webpackChunkName: "template" */ "../templates/refresh_template.js"
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

  // Create or Fetch Routes Metadata/ YAML
  console.log("~~~~~~> handleRoute: w.meta ", "./convert.mjs");
  let content = await (!isLocal || preRendering
    ? (await fetch(`/posts/${route}.json`)).json()
    : ( await (async () => {
      console.log("FETCHING")
        let x = await import(/* webpackChunkName: "convert" */ "./convert.mjs") 
      return x
      } )()
      ).ipynb_publish(`../../ipynb/${route}.ipynb`));

  // Swap Metadata old and new
  w.oldMeta = w.meta;
  w.meta = content.meta;
  meta.content = content.content;

  // Load a template on route change or local init
  w.meta.template ||= "article";
  if (meta.template !== document.body.getAttribute("data-template")) {
    let url = `/templates/${meta.template}`;
    console.log("~~~~~~> handleRoute: template ", url);
    document.body.setAttribute("data-template", meta.template);
    document.body.innerHTML = await (await fetch(`${url}.html`)).text();

    // Add Basic Stylesheet ;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<style>${await (await fetch(`${url}.css`)).text()}</style>`
    );

    // Forceload scripts. Moves main.js to footer.
    Array.from(document.getElementsByTagName("script")).forEach((script) => {
      const newScript = document.createElement("script");
      ["src", "type", "async", "textContent"].forEach(
        (attr) => script[attr] && (newScript[attr] = script[attr])
      );
      document.body.appendChild(newScript);
      script.parentNode.removeChild(script);
    });
  }

  // Add Sitemap Stylesheet
  let sm = location.pathname.split("/")[1].replace(".html", "") || "index";
  if (w.sitemap && !w.meta.hide_sitemap) {
    if (!w.sitemap_content) {  
      let url = `${location.origin}/templates/${w.meta.template}_sitemap.css`;
      console.log("~~~~~~> handleRoute: Sitemap Stylesheet ", url);
      let txt = await (await fetch(url)).text();
      document.body.insertAdjacentHTML("beforeend", `<style>${txt}</style>`);
    }
    if (w.sm_name != sm) {
      w.sm_name = sm;
      let url = `/client/posts/${sm_name}_map.json`
      console.log("~~~~~~> handleRoute: section_map ", url);
      w.sitemap_content = await (
        await fetch(url)
      ).json();
    }
  }

  // Dispatch pageLoaded event for template/ content hooks
  // Listeners in template.html and | template.js -> Populates w.newTemplate & updates toc.
  w.dispatchEvent(new CustomEvent("refreshTemplate"));
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
