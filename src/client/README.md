# Welcome!

## About
Here is where I keep the client-side code. The code operates uniquely depending on which of the three different enviornments it is running in, (dev, react-snap, prod). While I develop in the dev env, react-snap will pre-render my code in it's own envioronment, the output of which is used in the prod env. 

## What happens:

- Create sitemap and convert ipynb's (react-snap)
- Render header.js in (react snap/ dev) and remove script for (prod).
- Render main.js in (React snap/ dev) and inline script for (prod).
- Render router.js in (react snap/ dev) and lazy load in (prod).
- - Renders template, retrieves template content, dispatches 'refreshTemplate'
- - Events hooks in template and sitemap.js pick up on this
- - - Sitemap.js injects template content and conditionally refreshes sitemap/TOC

## Config 

- Webpack: Debugging: Need to toggle `purefuncs`
- `Head.json`: uses src/client/images/ for meta tags 
- `Robots.txt` -> specify sitemaps and nofollow noindex section/links. More [info](https://search.google.com/search-console/welcome), [here](https://support.google.com/webmasters/answer/7451001).

## Dependencies

- Ensure you can use Make (Windows will need MinGw) and add working version of Chromium to where specified in source code

### devServer

- A proxy was set up to deliver data from the localhost path /data during dev.
- For production, copyWebpackPlugin is used and the path just works.
- Webpacks [file-loader](https://webpack.js.org/loaders/file-loader/) removes this complication.

## Misc
The following are being used internally. 

### React-snap

[[Alternatives](https://github.com/stereobooster/react-snap/blob/master/doc/alternatives.md), [Recipes](https://github.com/stereobooster/react-snap/blob/master/doc/recipes.md), [isReactSnapRunning](https://github.com/stereobooster/react-snap/blob/master/tests/examples/partial/index.js), [Explainer](https://github.com/stereobooster/react-snap/blob/master/doc/behind-the-scenes.md)]

React-snapshot Follows every relative URL to crawl the whole site.
We move build/index.html to build/200.html at the beginning, because it's a nice convention.
Hosts like surge.sh understand this, serving 200.html if no snapshot exists for a URL.
If you use a different host I'm sure you can make it do the same.
The default snapshot delay is 50ms. It works with routing strategies using the HTML5 history API. No hash(bang) URLs.

### Capacitor

- npm install @capacitor/android
- npx cap init
- npx cap add android
- npx cap open android


## Todo 
- text wrap balance
- https://9elements.github.io/fancy-border-radius/ - unicycles and in blog
- click2like
- code line vs code block 
- Dynamic Tables from py output
- npm export mainjs for convert fns
- https://x.st/spinning-diagrams-with-css/
- webAuthn - firebase - termly - twilio - calendly 
- sharing [pages](https://garden.bradwoods.io/notes/html/head/share-web-page) 
- sized [images](https://www.stefanjudis.com/snippets/a-picture-element-to-load-correctly-resized-webp-images-in-html/)
- Fix sitemap to default close + animate opacity to show/hide.
- Fix nav to be (<- NAV X)(HOME | TOC || BACK) ( CONTENTS LISTED)
- dllr project
- pivot table

### Maybe Todo

I've experimented with most of these:

- curved details
- initial-letter css
- remove .html from url -> why?
- svg filter effects
- [3d](https://garden.bradwoods.io/notes/css/3d) effects
- iconfont?
- dns prefetch and preconnect
- image map webpage
- css_animations.ipynb
 
https://developers.google.com/search/docs/appearance/structured-data/search-gallery
https://play.ht/ 
https://polypane.app/css-3d-transform-examples/https://validator.w3.org/nu/


#https://bitsofco.de/styling-broken-images/
img {  display: block;  font-family: sans-serif;  font-weight: 300;  height: auto;  line-height: 2;  position: relative;  text-align: center;  width: 100%; }
Now add pseudo-elements rules to display a user message and URL reference of the broken image:
img::before {  content: "We're sorry, the image below is broken :(";  display: block; margin-bottom: 10px;}
img::after { content: "(url: " attr(src) ")";  display: block;  font-size: 12px;}

# avoid mobile browsers (iOS Safari, et al.) from zooming in on HTML form elements when a <select> drop-down is tapped,
input,button,select,textarea {  font: inherit;}

# https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
button:disabled { opacity: .5;  pointer-events: none;}

# https://codepen.io/AllThingsSmitty/pen/XKgOZR
:root {   font-size: calc(1vw + 1vh + .5vmin); }
body {   font: 1rem/1.6 sans-serif; }











// HEAD
page = location.pathname .replace("/", "").replace(/\/$/, "").replace(".html", "") || "index";
url == ./posts/page.json
window.redirect?() (index.js)

index.js
// Header.js -> index.redirect()
// Page Load Logic and Routing
window.w = window;
w.oldRoute = location.pathname;
w.isLocal ||= !!!w.content;
w.preRendering = /ReactSnap/.test(navigator.userAgent);
w.redirect = async (event = false) => {
  event?.preventDefault?.(); 
  !w.navEvent &&
    ({ handleRoute: w.handleRoute, navEvent: w.navEvent } = await import(
      /* webpackChunkName: "route" */ "./utils/route.js"
    )); 
  event.type == "click"
    ? (history.pushState({}, "", event.target.href), navEvent())
    : handleRoute();
};
addEventListener("popstate", redirect);



router.js
window.w = window;
// index.redirect -> (navEvent or handleRoute)
// navEvent -> handleRoute
// handleRoute -> registerServiceWorker, loadScripts, 'refreshTemplates' dispatch (sitemap.js)

  navEvent () -> let href = location.href;
  // Scroll to
  (href.indexOf("#") == -1
    ? () => window.scrollTo({ top: 0, behavior: "smooth" })
    : () => w[href.split("#")[1]]?.scrollIntoView({ behavior: "smooth" }))();
  // Reload
  if (href.split("#")[0] != w.href?.split("#")[0])
    await handleRoute(), (w.href = href);

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

let sm = location.pathname.split("/")[1].replace(".html", "") || "index";



refresh template js

window.w = window;

const shorten = (str, len = 12) =>
  str.trim().slice(0, len) + (str.length > len + 1 ? "..." : "");
const capitalize = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());
const formatLink = (str) =>
  shorten(capitalize(str.replaceAll(" ", "_").replace(/[^a-zA-Z_]/g, "")));
const displayLink = (str) => shorten(capitalize(str.replaceAll("_", " ")), 20);

  // updateRedirectListeners for relative hyperlinks
  document
    .querySelectorAll('a[href^="./"]')
    .forEach((l) =>
      [l.removeEventListener, l.addEventListener].forEach((f) =>
        f.call(l, "click", redirect)
      )
    );

  meta.breadcrumbs = [
    `<a href="./../index.html">Home</a>`,
    location.pathname
      .split("/")
      .slice(1)
      .map((x, i) => {
        x = x.replace(".html", "");
        return x == "index"
          ? ""
          : `<a href=${create_url(x, w.sm_name)}.html>${capitalize(
              x.replace(".html", "")
            )}</a>`;
      })
      .join("/"),
  ].join("/");

    document.querySelectorAll("a").forEach((el) => {
    el.id =
      el.id || formatLink(el.innerText) + Math.floor(Math.random() * 1000000);
  });


  tocNode.innerHTML = [...document.querySelectorAll("h2, h3, h4")]
    .map((header) => {
      let x = header.innerText || header.textContent
      const z = formatLink(x);
      const spaces = "&emsp;".repeat(header.tagName.slice(1) - 1);
      return `${spaces}<a href='#${z}' title="${x}">${displayLink(z)}</a>`;
    })
    .join("<br/>");


// Relative Links comparing URI, current Meta, the desired post's Meta
let create_url = (link, sitemap) => {
  let fromSubpath = location.pathname.split("/").length >= 3;
  let toSubpath = link != sitemap;
  let t = `./${
    (fromSubpath && !toSubpath && "../") ||
    (!fromSubpath && toSubpath && sitemap + "/") ||
    ""
  }${link}`;
  // console.log({ fromSubpath, toSubpath, link, sitemap, t });
  return t;
};

    
  let currentTab = w.meta.tab||w.meta.filename