// Uses ECMAScript modules for Browser and Node.js
import { marked } from "marked";
import fetch from "isomorphic-fetch";
import { makeDetails, replaceEmojis, convertNotes, replaceAndLog } from './convert_util.mjs'
// const path = typeof process === 'undefined' ? false : (await import('path')).default;

/*
Where processing happens
-1 - calling nb2json - yaml filename returned gets formatted
0 - nb2json - meta.filename is fixed up right before returning too
0 - nb2json - meta.prettify inserts script
0 - nb2json - replaceEmojies
0 - nb2json - convertNotes
1 - get_metadata - yaml is parsed, title, summary, keyValues set
*/

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// fname = ./src/ipynb/route/filename (wihout the .ipynb extension, when server calling it)
// fname = /route/filename when from client
// meta.filename = fname UNDERCASED WITH SPACES REPLACED WITH UNDERSCORES.
let prettify = false;
let pyCode = [];
export async function nb2json(ipynbPath) {
  pyCode = []
  /* 
        1a. Must be in directory of ipynb you want to convert to html.
  */
  prettify = false;
  let url = ipynbPath;
  if (typeof process !== "undefined") {
    url = `http://localhost:8085/${ipynbPath}.ipynb`;
  }

  // Get file
  let ipynb = await fetch(url, { headers: { "Content-Type": "application/json; charset=utf-8" } });
  const nb = await ipynb.json();

  // Get Metadata
  const meta = get_metadata(nb.cells[0]);
  // Strip PATH to IPYNB.
  meta.filename = ipynbPath.split("/")[ipynbPath.split("/").length - 1].toLowerCase().replaceAll(" ", "_");
  // console.log('- get_metadata', meta, '\n');

  // Convert file 
  let content = convertNb(nb.cells.slice(1), meta).flat().join(" ");
  // pyCode.length && console.log({pyCode});

  meta.pyCode = pyCode;

  // 
  (meta.prettify || prettify) &&
    (content += `
  <script src="https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/run_prettify.js"></script>
  <link rel="stylesheet" href="https://cdn.rawgit.com/google/code-prettify/master/styles/desert.css"/>
  `);

  // console.log('- - content Ran ~~~~~~~~~~~', content, '~~~~~~~~~~~\n');
  let resp = replaceEmojis(content);
  // console.log('- - replaceEmojis Ran', '\n');
  return { meta, content: resp };
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function get_metadata(data) {
  /*
        2. Get markdown and check EACH LINE for yaml. Special characters must have a space after them.
        ("# Title", "> summary", "- key1: value1")")
        returns: { title: "Title", summary: "summary", key1: "value1" }
  */
  const returnThis = {};
  for (const line of data.source) {
    if (line.startsWith("#")) {
      returnThis.title = line.replaceAll("\n", "").replaceAll("# ", "", 2);
    } else if (line.startsWith(">")) {
      returnThis.summary = line.replaceAll("\n", "").replaceAll("> ", "", 1);
    } else if (line.startsWith("-")) {
      const key = line.slice(line.indexOf("- ") + 2, line.indexOf(": "));
      const val = line
        .slice(line.indexOf(": ") + 2)
        .replaceAll("\n", "")
        .trim();
      returnThis[key] = val;
    }
  }
  return returnThis;
}

function convertNb(cells, meta) {
  ///console.log('- convertNb Running');
  /*
        3. passes each cell to decision fn.
    */
  return cells.map((c) => cleanCell(c, meta));
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function processMarkdown(x) {
  // check if matches regex: (((key1::value1))) and replace with aside
  x = x.replace(/\(\(\((.*?)::(.*?)\)\)\)/g, function (match, key, value) {
    if (key == 'note') { return match }
    return `<aside class="${key}">${value}</aside>`;
  });
  x = marked.parse(x)
  // wrap li's in a div or p
  x = x.replace(/<li>(.*?)<\/li>/g, (match, innerContent) => {
    const containsBlockLevel = /<(p|div|blockquote|pre|hr|form)/.test(innerContent);
    let returnThis = `<li>${containsBlockLevel ? `<div>${innerContent}</div>` : `<p>${innerContent}</p>`}</li>`
    return returnThis;
  });

  // replace code blocks with pre.prettyprint
  x = replaceAndLog(x, /<pre><code>([\s\S]*?)<\/code><\/pre>/g, () => { prettify = true; "<pre class='prettyprint'>$1</pre>" });
  x = replaceAndLog(x, /<code>([\s\S]*?)<\/code>/g, () => { prettify = true; "<pre class='prettyprint'>$1</pre>" });

  // local redirects pingServer
  x = replaceAndLog(x, /<a\s+(?:[^>]*?\s+)?href="(.*?)"/g, (match, href) => {
    // open links in new tab
    if (!href.startsWith("./")) {
      match += ' onclick="window.pingServer(this)" target="_blank" rel="noopener noreferrer nofollow"';
    }
    return match;
  });

  x = convertNotes(x);

  return x
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function processCode(cell, meta) {
  ///console.log('- - - processCode Running');
  /* 5. Calls getFlags, processSource, processOutput */
  let x = [];
  let flags = [];
  // source
  if (cell["source"].length) {
    // ///console.log('- - - - Raw Input Source', cell['source'])
    let source = cell["source"];
    flags = getFlags(source[0]);
    ///console.log('- - - - - Flags: ', flags);
    if (flags.length > 0) { source = source.slice(1) }
    source = processSource(source.join(" "), flags, meta);
    x.push(source);
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
    "#hide",
    "%%capture",
    "%%javascript",
    "%%html",
    "#export"
  ];
  const sourceFlags = source.split(/\s+/); // Split by whitespace
  return input_aug.filter((x) => sourceFlags.includes(x));
}

function processSource(source, flags, meta) {
  /* 6b. Strip Flags from text, make details, hide all. Append to pyCode*/
  if ('#export' == flags[flags.length - 1]) { pyCode.push(source); }
  for (let lbl of flags) {
    let skipList = ["#hide", "#hide_input", "%%javascript", "%%html", "%%capture"]
    if (skipList.includes(lbl)) { return ""; }
  }
  if (meta.prettify) { source = `<pre class='prettyprint'>${source}</pre>`; }
  let flagg = flags && !!flags.includes('#collapse_input_open')
  // if (flagg) { console.log(flags) }
  for (let lbl of flags) {
    source = source.replaceAll(lbl + "\r\n", "");
    source = source.replaceAll(lbl + "\n", ""); // Strip the Flag  
    if (lbl == "#collapse_input_open") source = makeDetails(source, true);
    else if (lbl == "#collapse_input") source = makeDetails(source, false);
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
      // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!processOutput... ", typeof source, source);
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
    if (lbl == "#hide") {
      source = "";
    }
  }

  return source;
  //output_type == 'stream' ==> text
  //output_type == 'display_data' ==> data{'application/javascript' or 'text/html' or 'execute_result'}
}
