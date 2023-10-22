// Uses ECMAScript modules for Browser and Node.js
import { marked } from "marked";
import fetch from "isomorphic-fetch";
// const path = typeof process === 'undefined' ? false : (await import('path')).default;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export async function ipynb_publish(file = "index") {
  /*
    1. Publish ipynb to json or html.
    */
  ///console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', '\n\n');
  //console.log('START:', {saveto, file, type}, '\n');
  let final = await nb2json(file);
  let { filename, ...meta } = final.meta;
  //console.log(final)
  try {
    filename = filename?.toLowerCase().replaceAll(" ", "_");
  } catch (e) {
    console.log("ERROR: ", e); // Typically undefined
  }
  final.meta = { filename, ...meta };
  file = filename;
  ///console.log(('Saving ', final, '\n\n');
  ///console.log(('As: ', file, '\n')
  ///console.log(('To ', saveto, '\n\n');
  return final;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export async function nb2json(fname) {
  /* 
        1a. Must be in directory of ipynb you want to convert to html.
    */
  if (typeof process !== "undefined") {
    fname = `http://localhost:8085/${fname}.ipynb`;
  }
  //else{ fname = 'http://localhost:8081' + fname }
  //console.log({fname})
  let ipynb = await fetch(fname, { headers: { "Content-Type": "application/json; charset=utf-8" } });
  const nb = await ipynb.json();
  const meta = get_metadata(nb.cells[0]);
  // console.log('- get_metadata', meta, '\n');
  let content = convertNb(nb.cells.slice(1), meta).flat().join(" ");

  meta.prettify &&
    (content += `
  <script src="https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js"></script>
  <link rel="stylesheet" href="https://cdn.rawgit.com/google/code-prettify/master/styles/desert.css"/>
  `);

  // console.log('- - content Ran ~~~~~~~~~~~', content, '~~~~~~~~~~~\n');
  let resp = replaceEmojis(content);
  resp = convertNotes(resp);
  // console.log('- - replaceEmojis Ran', '\n');
  meta.filename = fname.split("/")[fname.split("/").length - 1].replace(".ipynb", "");
  return { meta, content: resp };
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function get_metadata(data) {
  /*
        2. Get markdown (title, summary) and yaml from 1st cell in ipynb.
    */
  const y = {};
  for (const x of data.source) {
    if (x.startsWith("#")) {
      y.title = x.replaceAll("\n", "").replaceAll("# ", "", 2);
    } else if (x.startsWith(">")) {
      y.summary = x.replaceAll("\n", "").replaceAll("> ", "", 1);
    } else if (x.startsWith("-")) {
      const key = x.slice(x.indexOf("- ") + 2, x.indexOf(": "));
      const val = x
        .slice(x.indexOf(": ") + 2)
        .replaceAll("\n", "")
        .trim();
      y[key] = val;
    }
  }
  return y;
}

function convertNb(cells, meta) {
  ///console.log('- convertNb Running');
  /*
        3. passes each cell to decision fn.
    */
  return cells.map((c) => cleanCell(c, meta));
}

function replaceEmojis(text) {
  // console.log('- replaceEmojis Running');
  /* 
        8. Convert emojis to html entities
    */
  text = text.replaceAll("🙂", "&#1F642");
  text = text.replaceAll("😳", "&#128563");
  text = text.replaceAll("\u2003", "&#8195");
  text = text.replaceAll("👷", "&#128119");
  text = text.replaceAll("🧡", "&#129505");
  text = text.replaceAll("💖", "&#128150");
  // Dec => Code => https://apps.timwhitlock.info/unicode/inspect/hex/1F633 
  return text;
}

function convertNotes(str) {
  let matchCount = 0;
  const regex = /(<p)(.*?)\(\(\((.*?)\)\)\)(.*?)(<\/p>)/g;

  const replacement = (_, p1, p2, p3, p4, p5) => { 
    matchCount++;
    // console.log({p1}, p1.includes('p') ); 
    let pStart = ""// style='display:inline' ";
    let lbl = `<label ${pStart} tabindex="0" for='note${matchCount}' class='notelbl'>[${matchCount}]</label>`
    let fin = `<div>
    <input type='checkbox' id='note${matchCount}' class='notebox'>${p1 + pStart + p2  }
    ${lbl + p4 + p5}
    <aside>${lbl} ${p3} </aside> </div>
`;
    // console.log({_,p1, p2, p3, p4, p5, fin})
    return fin
  };
  return str.replace(regex, replacement);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let replaceAndLog = (text, input, output) => {  
  return text.replace(input, function(match, capture) {
    // output == '<li><div>$1</div></li>' && console.log('\n Caught: \n', {capture});
    return output.replace?.('$1', capture) || output(match, capture);
  });
};

function processMarkdown(x){   
  let flag = false
  // check if matches regex
  x.match(/\(\(\(([^:]+)::([^)]+)\)\)\)/g)?.forEach((match, key, value ) => {
    flag=true; 
  })
  // flag && console.log('1', {x})
 
  // replace with aside
  x = x.replace(/\(\(\(([^:]+)::(.*?)\)\)\)/g, function (match, key, value ) {   
    flag=true;
    // Create a div element with the appropriate style and inner text 
    // console.log('KEY VALUE', {match, key, value})
    return `<aside class="${key}">${marked.parse(value)}</aside>`;
  }); 

  // flag && console.log('2', {x})
   
  x = marked.parse(x) 

  // flag && console.log('3', {x})
  // wrap li's in a div or p
  x = x.replace(/<li>(.*?)<\/li>/g, (match, innerContent) => {
    const containsBlockLevel = /<(p|div|blockquote|pre|hr|form)/.test(innerContent);  
    let returnThis =  `<li>${containsBlockLevel ? `<div>${innerContent}</div>` : `<p>${innerContent}</p>`}</li>`
    // console.log({returnThis})
    return returnThis;
  });


    // replace code blocks with pre.prettyprint
    x = replaceAndLog(x, /<pre><code>([\s\S]*?)<\/code><\/pre>/g, "<pre class='prettyprint'>$1</pre>");

    // local redirects pingServer
    x = replaceAndLog(x, /<a\s+(?:[^>]*?\s+)?href="(.*?)"/g, (match, href) => {
      // open links in new tab
      if (!href.startsWith("./")) {
        match += ' onclick="window.pingServer(this)" target="_blank" rel="noopener noreferrer nofollow"';
      }
      return match;
    });
    return x
}

function cleanCell(cell, meta) {
  ///console.log('- - cleanCell Running');//, cell ,'\n');
  /* 4. returns text or passes cell to 'code cell' processor */
  let x;
  if (cell["cell_type"] == "markdown") {
    ///console.log('- - - Parsing Markdown');
    x = processMarkdown(cell["source"].join(" "))
  } else {
    x = processCode(cell, meta);
  }
  return x;
}

function processCode(cell, meta) {
  ///console.log('- - - processCode Running');
  /*
        5. Calls getFlags, processSource, processOutput 
    */
  let x = [];
  let flags = [];
  // source
  if (cell["source"].length) {
    // ///console.log('- - - - Raw Input Source', cell['source'])
    let source = cell["source"];
    flags = getFlags(source[0]);
    ///console.log('- - - - - Flags: ', flags);

    source = processSource(source.slice(1).join(" "), flags);
    ///console.log('- - - - - processSource: ', source);

    source && x.push(meta.prettify ? `<pre class='prettyprint'>${source}</pre>` : source);
  }
  // output
  if (cell["outputs"].length) {
    // ///console.log('- - - - Raw Process Outputs', cell['outputs'])
    for (let o of cell["outputs"]) {
      x.push(processOutput(o, flags));
    }
    ///console.log('- - - - - processOutput: ', x);
    // ///console.log('Processed Output');
    // clear_output();
  }
  ///console.log('- - - processCode Ran');
  return x;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function getFlags(source) {
  /*
        6a. Detect and stripout and handle flags.
    */
  const input_aug = [
    "#collapse_input_open",
    "#collapse_input",
    "#collapse_output_open",
    "#collapse_output",
    "#hide_input",
    "#hide_output",
    "#hide ",
    "%%capture",
    "%%javascript",
    "%%html",
  ];
  return input_aug.filter((x) => new RegExp(x).test(source));
}

function processSource(source, flags) {
  /*
        6b. Strip Flags from text, make details, hide all.
    */
  // ///console.log('processSource... ', source);
  for (let lbl of flags) {
    // console.log('processSource... ', lbl);
    source = source.replaceAll(lbl + "\r\n", "");
    source = source.replaceAll(lbl + "\n", ""); // Strip the Flag
    if (lbl == "#collapse_input_open") source = makeDetails(source, true);
    if (lbl == "#collapse_input") source = makeDetails(source, false);
    if (lbl == "#hide ") source = "";
    if (lbl == "#hide_input") source = "";
    if (lbl == "%%javascript") source = "";
    if (lbl == "%%html") source = "";
    if (lbl == "%%capture") source = "";
  }
  return source;
}

function processOutput(source, flags) {
  /*
        6c. Strip Flags from output, make details, hide all.
    */
  if (source["output_type"] == "error") {
    return "";
  }
  if (source["output_type"] == "stream") {
    if (source["name"] == "stderr") {
      return "";
    }
    source["data"] = { "text/html": source["text"] }; // This will have the stream process as text/html.
  }

  const keys = Object.keys(source["data"]);
  if (keys.includes("text/html")) {
    source = source["data"]["text/html"];
    source = source.join("");
  } else if (keys.includes("application/javascript")) {
    source = "<script>" + source["data"]["application/javascript"] + "</script>";
  } else if (keys.includes("image/png")) {
    source = '<img src="data:image/png;base64,' + source["data"]["image/png"] + "\" alt='Image Alt Text'>";
  } else if (keys.includes("text/plain")) {
    source = !/<Figure/.test(source["data"]["text/plain"]) ? source["data"]["text/plain"] : "";
  }

  for (let lbl of flags) {
    try {
      source = source.replaceAll(lbl + "\r\n", "");
      source = source.replaceAll(lbl + "\n", "");
    } catch {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!processOutput... ", typeof source, source);
    }
    if (lbl == "#collapse_output_open") {
      source = makeDetails(source, true);
    }
    if (lbl == "#collapse_output") {
      source = makeDetails(source, false);
    }
    if (lbl == "#hide_output") {
      source = "";
    }
    if (lbl == "#hide ") {
      source = "";
    }
  }

  return source;
  //output_type == 'stream' ==> text
  //output_type == 'display_data' ==> data{'application/javascript' or 'text/html' or 'execute_result'}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function makeDetails(content, open) {
  /*
        7. Called by processOutput and processSource.
    */
  return "<details " + (open ? "open" : "") + "> <summary>Click to toggle</summary> " + content + "</details>";
}
