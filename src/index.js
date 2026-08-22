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
w.newRoute = location.pathname; //
w.isLocal ||= !!!w.content; // Used to not register worker, send pings, load json/ipynb
w.preRendering = /Prerendererest/.test(navigator.userAgent); // Used to skip console logs cluttering prerenders terminal output.

// Message for the sleuths.
w.refresh ||
  w.preRendering ||
  ((w.refresh = false),
  console.log(
    "%c Like what you see?",
    "font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 red , 6px 6px 0 green , 9px 9px 0 blue"
  ),
  console.log("%c Contact me@charleskarpati.com", "color: blue; font-family:sans-serif; font-size: 20px"));

// Called in head.js to trigger handleRoute when in dev.
// No event means initial load.
// event = Popstate means Back/FWD button.
// event = Click means user clicked a relative link.

// Sitemap -> Click evt -> href='./paths'
// TOC -> Popstate evt -> href='#paths'
w.redirect = async (event = false) => {
  const eventType = event?.type || "initial";
  console.group(`INDEX:Event:${eventType.toUpperCase()}`);
  event?.preventDefault?.();
  !w.navEvent &&
    ({ handleRoute: w.handleRoute, navEvent: w.navEvent } = await import(
      /* webpackIgnore: true */ "/src/utils/route.js"
    ));

  // Update oldRoute to current pathname before routing
  w.oldRoute = w.newRoute;
  if (eventType === "click") {
    w.newRoute = event?.target?.pathname || location.pathname;
  }
  if (eventType === "popstate") {
    w.newRoute = location.pathname;
  }
  // console.log({ same: w.oldRoute == w.newRoute, oldRoute: w.oldRoute, newRoute: w.newRoute });
  // User Clicked a Relative Link vs Browser Back/FWD vs Initial Load
  event?.type == "click" ? navEvent(event.target.href) : handleRoute();
  console.groupEnd();
};
addEventListener("popstate", redirect);

// Removes then Reattaches redirects. Called on refresh template.
// w.setRedirectListeners = () => {
//   console.log("INDEX:setRedirectListeners");
//   document
//     .querySelectorAll('a[href^="./"]')
//     .forEach((l) => {
//       l.removeEventListener("click", w.redirect);
//       l.addEventListener("click", w.redirect);
//     });
// };
// setRedirectListeners();

// Minimal, idempotent delegated navigation setup (needed at startup)
// Click delegation for relative links
const clickHandler = e => {
  const a = e.target?.closest && e.target.closest('a[href^="./"]');
  if (!a) return;
  e.preventDefault();
  redirect({ type: "click", target: a });
};
if (w._redirectHandler) document.removeEventListener("click", w._redirectHandler, true);
w._redirectHandler = clickHandler;
document.addEventListener("click", w._redirectHandler, true);

// Single popstate handler
const popHandler = () => redirect({ type: "popstate" });
if (w._popstateHandler) window.removeEventListener("popstate", w._popstateHandler);
w._popstateHandler = popHandler;
window.addEventListener("popstate", w._popstateHandler);
