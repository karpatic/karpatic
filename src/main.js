import "./main.css";

//
// App: Loads Ipynb files into a template.
//
// Main.js
//
// Description: Jumping point for the app. Adds event listeners to lazy load the router.
// Head.js will call the router then remove itself from the build.
// Router handles, ServiceWorkers, Updating the Sitemap
//

// Page Load Logic and Routing
window.w = window;
w.oldRoute = location.pathname;
w.isLocal ||= !!!w.content;
w.preRendering = /ReactSnap/.test(navigator.userAgent);

// Message for the sleuths
w.preRendering ||
  (console.log(
    "%c Like what you see?",
    "font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 red , 6px 6px 0 green , 9px 9px 0 blue"
  ),
  console.log("%c Contact me: charleskarpati@gmail.com", "color: blue; font-family:sans-serif; font-size: 20px"));

// Simple analytics
w.pingServer = async (event = false) => {
  w.content &&
    navigator.sendBeacon(
      "https://ping.charleskarpati.com/",
      `{"from":"${oldRoute || location.href}","to":"${event?.href || event?.target?.href || oldRoute}"}`
    );
};
!isLocal && w.pingServer();

// Called in head.js to trigger handleRoute
w.redirect = async (event = false) => {
  event?.preventDefault?.();
  !w.navEvent &&
    ({ handleRoute: w.handleRoute, navEvent: w.navEvent } = await import(/* webpackChunkName: "route" */ "./route.js"));
  event.type == "click" ? (history.pushState({}, "", event.target.href), navEvent()) : handleRoute();
};
addEventListener("popstate", redirect);
