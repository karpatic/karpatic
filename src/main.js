import "./main.css"; 

//
// App: Loads Ipynb files into a template.
//
// Main.js
// 
// Description: Jumping point for the app. Adds event listeners to lazy load the router.
// Router handles the historyAPI, ServiceWorkers, Updating the Sitemap, and ReactSnap prerender logic. 
//

console.log('%c Like what you see?', 'font-weight: bold; font-size: 50px;color: red; text-shadow: 3px 3px 0 red , 6px 6px 0 green , 9px 9px 0 blue');   
console.log("%c Contact me: charleskarpati@gmail.com","color: blue; font-family:sans-serif; font-size: 20px");

window.updateRedirectListeners = () => { document.querySelectorAll('a[href^="./"]').forEach(l=>[l.removeEventListener,l.addEventListener].forEach(f=>f.call(l,'click',redirect))) }
window.redirect = (async (event=false) =>{ 
    event && event.preventDefault() 
    !window.navEvent && ({ handleRoute: window.handleRoute, navEvent: window.navEvent } = await import(/* webpackChunkName: "router" */ './router.js')); 
    event.type == 'click' ? ( history.pushState({}, '', event.target.href), navEvent(event) ) : handleRoute(location.pathname) 
} ) 

document.addEventListener('DOMContentLoaded', async () => { 
    addEventListener('popstate', redirect);         // Browser History 
    updateRedirectListeners();                      // Href ./ Link
})