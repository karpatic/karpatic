# Welcome!

## About
Here is where I keep the client-side code. The code operates unique depending on which of the three different enviornments it is running in, (dev, react-snap, prod). While I develop in the dev env, react-snap will pre-render my code in it's own envioronment, the output of which is used in the prod env. 

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
- npm export mainjs for convert fns
- click2like
- code line vs code block 
- https://x.st/spinning-diagrams-with-css/
- webAuthn - firebase - termly - twilio - calendly 
- sharing [pages](https://garden.bradwoods.io/notes/html/head/share-web-page) 
- sized [images](https://www.stefanjudis.com/snippets/a-picture-element-to-load-correctly-resized-webp-images-in-html/)

### Maybe Todo

I've experimented with most of these:

- initial-letter css
- remove .html from url
- curved details
- svg filter effects
- [3d](https://garden.bradwoods.io/notes/css/3d) effects
- iconfont?
- dns prefetch and preconnect
 - hunter's drll project