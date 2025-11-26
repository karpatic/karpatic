import "./index.css";

//
// App: Loads Ipynb files into a template.
//
// Main.js
//
// Description: Jumping point for the app. Adds event listeners to lazy load the router.
// Head.js calls the router then remove itself from the build.
//

// Page Load Logic and Routing
window.w = window;
w.oldRoute = location.pathname; // 
w.isLocal ||= !!!w.content; // Used to not register worker, send pings, load json/ipynb
w.preRendering = /ReactSnap/.test(navigator.userAgent); // Used to skip console logs cluttering prerenders terminal output.

// Message for the sleuths.
w.preRendering ||
  (console.log(
    "%c Like what you see?",
    "font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 red , 6px 6px 0 green , 9px 9px 0 blue"
  ),
  console.log(
    "%c Contact me@charleskarpati.com",
    "color: blue; font-family:sans-serif; font-size: 20px"
  ));

// Simple analytics
w.pingServer = async (event = false) => {
  w.content &&
    console.log("INDEX:pingServer") &&
    navigator.sendBeacon(
      "https://ping.charleskarpati.com/",
      `{"from":"${oldRoute || location.href}","to":"${
        event?.href || event?.target?.href || oldRoute
      }"}`
    );
};
!isLocal && w.pingServer();

// Called in head.js to trigger handleRoute when in dev.
// No event means initial load.
// event = Popstate means Back/FWD button.
// event = Click means user clicked a relative link.

// Sitemap -> Click evt -> href='./paths' 
// TOC -> Popstate evt -> href='#paths'
w.redirect = async (event = false) => {
  const eventType = event?.type || 'initial';
  console.group(`INDEX:Event:${eventType.toUpperCase()}`);
  event?.preventDefault?.();
  !w.navEvent &&
    ({ handleRoute: w.handleRoute, navEvent: w.navEvent } = await import(
      /* webpackChunkName: "route" */ "./utils/route.js"
    ));

  // Update oldRoute to current pathname before routing
  w.oldRoute = location.pathname;

  // User Clicked a Relative Link vs Browser Back/FWD vs Initial Load
  event?.type == "click" ? navEvent(event.target.href) : handleRoute();
  console.groupEnd();
};
addEventListener("popstate", redirect);

// Removes then Reattaches redirects. Called on refresh template.
w.setRedirectListeners = () => {
  // console.log("INDEX:setRedirectListeners");
  document
    .querySelectorAll('a[href^="./"]')
    .forEach((l) =>
      [l.removeEventListener, l.addEventListener].forEach((f) =>
        f.call(l, "click", redirect)
      )
    );
};
setRedirectListeners();
