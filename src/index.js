import "./index.css";

//
// App: Loads Ipynb files into a template.
//
// Main.js
//
// Description: Jumping point for the app. Adds event listeners to lazy load the router.
// Head.js will call the router then remove itself from the build.
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

// Called in head.js to trigger handleRoute.
w.redirect = async (event = false) => {
  console.group("INDEX:Event:POPSTATE");
  event?.preventDefault?.();
  !w.navEvent &&
    ({ handleRoute: w.handleRoute, navEvent: w.navEvent } = await import(
      /* webpackChunkName: "route" */ "./utils/route.js"
    ));
  // console.log('INDEX:',event)

  // User Clicked a Relative Link vs // Browser Back/FWD
  event.type == "click" ? navEvent(event.target.href) : handleRoute();
  console.groupEnd();
};
addEventListener("popstate", redirect);

// Removes then Reattaches the redirect fn. Called from refresh template.
w.setRedirectListeners = () => {
  console.log("INDEX:setRedirectListeners");
  document
    .querySelectorAll('a[href^="./"]')
    .forEach((l) =>
      [l.removeEventListener, l.addEventListener].forEach((f) =>
        f.call(l, "click", redirect)
      )
    );
};
setRedirectListeners();
