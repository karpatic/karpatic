# <a href="https://karpatic.github.io/CVminiGames.github.io/">CVMiniGames</a>

## Welcome! 

please visit the official [website](https://cvminigames.com/) for more information

## Strategy

General
- Compress pics w/ webP
- Keep Init Page under 14Kb's 
- Use native fonts
- Inline Critical CSS.
- No need for preload img/tags

What happens:
- Render header.js in (react snap/ dev) then dispose of it for (prod).  
- Render main.js in (React snap/ dev) and inline for (prod). 
- Render router.js in (react snap/ dev) and lazy load in (prod).
- - Renders template, retrieves template content, dispatches 'refreshTemplate' 
- - Events hooks in template and sitemap.js pick up on this
- - - Sitemap.js injects template content and conditionally refreshes sitemap/TOC 

Of note:
- No Webpack bloat
- Auto-Prefixes
- Lazy imports router.js
- Router dispatches trigger event for templates to hook into for animations 
- Gpu Accelerated CSS Transitions
- PWA-SW Support
- Build Optimizations/ Analytics
- Compresses Template
- React-Snap Pre-rendering   // mobile first approach w=480,h=850

- Strips out _some_ scripts after Pre-rendering 
- templateRefreshed event

Manual TODOs operations:
- Webpack -> Debug: Toggle purefuncs, Config new same-site Projects
- Robots.txt -> specify sitemaps and nofollow noindex section/links
- Sitemap -> more [info](https://search.google.com/search-console/welcome), [here](https://support.google.com/webmasters/answer/7451001)
- Head.json + src/images/
- Header.js -> CSP 
- main.js -> main.CSS
- sitemap.js -> ./posts/sitemap.json
- sitemap.js -> pageTransitioneer

## Design

Templates Contains: 
- > Parallax background
- > Keyframes animate linear gradient background
- > Keyframes animate background of randomly generated cubes. 
- > Optionally - a table of contents is shown before the article or at the side.
- > Scrollpos animate an cube tumbling down the divider line with a clip path 
- > Scrollpos cube flows along the side of a clip path
- > Animate text shadow on hover
- > Glowing BG for Active-Page Link. Glowing Underline for TOC Anchor Link
- > CSS Keyframe names used: gradient-scroll, gradient, glow, collapse, expand, reveal, dismiss, shake, spin-header, wiggle, pageTransitioneer, clip-path-polygon, cube-animation

## Design Rules

Follow these General Summarized [Rules](https://anthonyhobday.com/sideprojects/saferules/):

- General -> Put simple on complex or complex on simple
- Layout -> Make outer padding the same or more than inner padding
- Layout -> no hard divides unless it's an img divider
- Buttons -> Make horizontal padding twice the vertical padding in buttons
- Elements -> should go in order of visual weight (dark to light, fx to none, etc)
- Element -> use multiples of '8'

- Border -> Container borders should contrast with both the container and the background
- Border -> For nested divs w rounded corners: interiorItemsRoundedBorder = xteriorspx - paddingpx
- Border -> Make drop shadow blur values double their distance values. 4px on y = 8px blur
- Border -> - closer z-index to camera = more light diffusion/ lower shadow opacity

- Colors -> If you saturate your neutrals you should use warm or cool colours, not both
- Colors -> Colours in a palette should have distinct brightness values, not just in hue
- Colors -> bg should get lighter as the z-index increases
- Colors -> The HSB brightness difference between background and container should be within 12%/7% for dark/light interface.

In general...
- Avoid Complexity: Sitemap links to nav pages which link to subject-related articles.
- Jazz up section divides by by slapping atop a transform rotated div

Reactive Explorative Interactive

0. instead of interactive steppers, tabs, fixies, sliders, use scroll and multiples
1. if you make the reader click or do anything other than scroll, something spectacular has to happen
2. if you make a tooltip or rollover assume no one will ever see it.
3. fewer small graphics embedded in articles and more stand-alone visual stories
4. most visuals are static as a result
5. if animation or motion is needed. trigger it on scroll

Misc:
- Each H2 should be a summary for a details pane.


## Article Components

1. triple ellipses comments popup
2. view counter
3. social icons
4. https://textfac.es/ 
5. https://graphemica.com/%E2%98%B0
6. https://css-tricks.com/full-width-containers-limited-width-parents/
7. scrollsnaps on img
- Default to using webP when available w/ png fallback.
8. https://unicodearrows.com/
9. https://www.toptal.com/designers/htmlarrows/arrows/
10. footnotes


<picture>
  <source srcset="your-image.webp" type="image/webp">
  <img src="your-image.png" alt="Fallback PNG image"
      onerror="this.src='path/to/webpAndPngFailedToLoad.png'" 
      width="1243" height="1500" loading="lazy" decoding="async">
</picture>

Page SEO:
-  Titles 
- - Up to 50-60 characters to avoid SERP truncating.
- - Frontload Keywords naturally and always include brandname
- - Match Title and H1 closely

- Descriptions
- - SERP descriptions truncate at 150-160 characters 
- - long-tail keywords like [contemporary art-deco sideboards] help
- - <meta name="description" content=""/> - Keywords show in bold. Tell the reader what they want to hear.
- - people typically visit for 4 types of content: Transactional Commercial Navigational Informational

- Don't Forget Img Alt Text! 

- Links
- - Add only a "noindex" wont show on search wheras - "nofollow" wont associate links to page or scan em
- - <META NAME="robots" CONTENT="noindex,nofollow"> / <a rel="nofollow" href="externalsite">
- - Robots. txt disallow for whole sections, meta tag for single pages

Structured Data:

- [JSON-LD](https://www.youtube.com/watch?v=hUHjeDylhE8) > Microdata, RDF

- Markup should only have things found in-page.
- rich results [test](https://search.google.com/test/rich-results/), schema [validator](https://validator.schema.org/), markup [helper](https://www.google.com/webmasters/markup-helper/u/0/?)

https://www.searchenginejournal.com/technical-seo/schema/
https://www.google.com/webmasters/markup-helper/u/0/?hl=en
https://developers.google.com/search/docs/appearance/structured-data
https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fwww.cvminigames.com
https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started

// https://github.com/joshbuchea/HEAD
// https://support.google.com/webmasters/answer/9008080?hl=en
// https://developers.facebook.com/docs/instant-articles/guides/articlecreate
// https://webmention.io/

XML sitemap generator & deadlink checker https://www.xml-sitemaps.com/details-cvminigames.com-49d3d3298.html
visual sitemap -> https://octopus.do/import?url=Cvminigames.com

# Dependencies

## devServer

- A proxy was set up to deliver data from the localhost path /data during dev.
- For production, copyWebpackPlugin is used and the path just works.
- https://webpack.js.org/loaders/file-loader/ removes this complication.

## Capacitor

-npm install @capacitor/android
-npx cap init
-npx cap add android
-npx cap open android

## [react-snap](https://github.com/stereobooster/react-snap/blob/master/doc/alternatives.md)

https://github.com/stereobooster/react-snap/blob/master/doc/recipes.md
https://github.com/stereobooster/react-snap/blob/master/tests/examples/partial/index.js
https://github.com/stereobooster/react-snap/blob/88ef70dd419158c18b9845034513dc84a3e100d9/index.js

React-snapshot Follows every relative URL to crawl the whole site.
We move build/index.html to build/200.html at the beginning, because it's a nice convention. 
Hosts like surge.sh understand this, serving 200.html if no snapshot exists for a URL. 
If you use a different host I'm sure you can make it do the same.
The default snapshot delay is 50ms.
  
Works with routing strategies using the HTML5 history API. No hash(bang) URLs.
https://github.com/stereobooster/react-snap/blob/master/doc/behind-the-scenes.md

## Notes

python packaging uses dist and webpack does not.

WebP offers 25-35% better compression.

gpu acceleration
- accelerating the cubes improved FPS by 2x to run 60fps w/ more load on the each paint

chrome dev tools -> rendering 
- enable paint flashing to view non-hardware accelerated content).
- wont work on (clip-text, svg path transformations, sitemap/h1 borders)

using requestAnimationFrame instead of setInterval to create the animation loop. Using setInterval can be unreliable, and requestAnimationFrame provides better performance, particularly on mobile devices.

 using the animate() method to animate the cubes. While this method is easy to use, it may not provide the smoothest animation performance. A better approach is to use requestAnimationFrame()

 https://www.stefanjudis.com/snippets/a-picture-element-to-load-correctly-resized-webp-images-in-html/
 
 