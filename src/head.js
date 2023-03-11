import React from "react";
import ReactDOMServer from 'react-dom/server';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Pulls header.json for default values of non-pwa website
// Header.json will specify pages with a custom json spec to merge w/.
// Otherwise gets merged w/ any YAML frontmatter.
// Each manifest must first be auto-generated once using webpack and copied to src/ before being conditionally imported (default no).

(async () => {
  const page = window.location.pathname.replace("/",'').replace('.html','') || 'index';
  if(page=='404')return

  //let hr = JSON.parse((await import(`./header.json`) ).default)
  let hr = await (await fetch((await import(`./header.json`) ).default)).json() 
  try{
    let get = ( hr.pwapages.split(',').some(x=>page==x)?'':'posts/')+page
    let content = await (await fetch((await import( `./${ get}.json`) ).default)).json() 
    hr = {...hr, ...content.meta}
  }catch(e){console.log('<~~~~~~~~~~~~~~~~~~~~~~~~NO CONFIG DATA~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>',e)}
  let header = <HelmetProvider>
        <Helmet>    
          <meta charset="UTF-8"/>
          <meta http-equiv="Content-Security-Policy" content="img-src 'self' https://charleskarpati.com/ data:;"/>
          <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1"/>
          <title>{hr.tab||hr.longName}</title>
          <meta name="author"             content={hr.author}/>
          <meta name="description"        content={hr.description}/> 

          <meta http-equiv="Cache-Control" content="no-cache, must-revalidate"/>

          { /*
          {forBlog && <link rel="manifest" href="/manifest.json"/> }
          <meta name="HandheldFriendly"   content="True"/>
          <meta name="MobileOptimized"    content="420"/>
          <meta name="subject"            content={hr.type}/>
          <meta name="application-name"   content={hr.applicationname}/> // TODO: Conditionally ENABLE FOR APPs
          */ }

          {hr.pwa && <link rel="manifest" href={page+'_manifest.json'}/>}
          {hr.pwa && <link rel="apple-touch-icon" href={ hr.icon512 }></link>}

          <link rel="license"             href="https://opensource.org/licenses/MIT"/>
          <link rel="canonical"           href={`https://${hr.title}.com/${page}`} /> 
          <link rel="icon" type="image/ico" sizes="16x16"     href={hr.icon16}/>
          { /*
          <link rel="author"              href={hr.author}/>
          <link rel="me"                  href={hr.owneremail} type="text/html"/>
          <link rel="me"                  href={hr.ownername}/>
          <link rel="me"                  href={hr.ownerphone}/>

          <meta name="geo.region"         content="US-MD" />
          <meta name="geo.placename"      content="Baltimore" />
          <meta name="geo.region"         content={hr.title} />
          <meta name="geo.placename"      content={hr.title} />
          <meta name="geo.position"       content={hr.geoposition} />
          <meta name="ICBM"               content={hr.geoposition} />
          <link rel="icon" type="image/ico" sizes="24x24"     href={hr.icon24}/>
          <link rel="icon" type="image/ico" sizes="32x32"     href={hr.icon32}/>
          <link rel="icon" type="image/ico" sizes="64x64"     href={hr.icon64}/>
          <meta itemprop="image"          content={hr.image}/>
          <meta property="article:author" content={hr.author}/>
          */}
          <meta name="theme-color"        content={hr.themecolor}/>
          <meta name="robots"             content="index,follow"/>
          <noscript>Your browser does not support JavaScript!</noscript>
          <meta property="og:url" content={`http://www.${hr.title}.com/${page}`} />
          <meta property="og:title"       content={hr.title}/>
          <meta property="og:description" content={hr.summary || hr.description}/>
          <meta property="og:type"        content={hr.type} />
          <meta property="og:site_name"   content={hr.applicationname}/>
          <meta property="og:locale"      content="en_US"/>
          <meta property="op:markup_version" content="v1.0"/>
          <meta property="fb:article_style"content="default"/>
          <meta property="og:image"       content={hr.image}/>
          <meta name="twitter:card"       content={hr.summary || hr.description} />
          <meta name="twitter:site"       content={hr.twittersite}/>
          <meta name="twitter:creator"    content={hr.twitterauthor}/>
          {/*
          <meta itemprop="name"           content={hr.title}/>
          <meta itemprop="description"    content={hr.summary || hr.description}/>
          <meta name="pinterest"          content="nopin" description={"Sorry, you can't save from this website!"}/> 
          */}
        </Helmet>
    </HelmetProvider>
    
  let rootElement = document.querySelector("#head")
  if(rootElement){ 
    ReactDOMServer.renderToString(header) 
  } 

  // Onload Event
  setTimeout(()=>{  
    window.redirect&&window.redirect(); 
    setTimeout(()=>{
      //document.querySelector("#sitemap").setAttribute("data-server-rendered", "true");
      document.querySelectorAll('[data-rh]').forEach(e=>{
        // console.log('removing', e.asElement? e.asElement().outerHTML : e.outerHTML);
        // https://pptr.dev/api/puppeteer.jshandle
        (e.asElement? e.asElement():e).removeAttribute('data-rh')
      });
    }, 20) 

  }, 20)

  // Runs in Dev / React Snap. Removes prerender scripts
  Array.from(document.getElementsByTagName("script")).forEach(script => { 
      if (new RegExp("head|helmet", "i").test(script.getAttribute('src')) ||
          !script.type && script.src.includes('webpack-dev-server') || 
          (script.textContent.includes('webpackBootstrap')) ) { 
            script.remove(); return; 
      }  
  });      

} )()