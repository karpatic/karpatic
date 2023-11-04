function makeDetails(content, open) {
  console.log("- makeDetails Running", content, open)
  /*
        7. Called by processOutput and processSource.
    */
  return "<details " + (open ? "open" : "") + "> <summary>Click to toggle</summary> " + content + "</details>";
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
  const regex = /(<p)(.*?)\(\(\((.*?)::(.*?)\)\)\)(.*?)(<\/p>)/g;

  const replacement = (_, p1, p2, key, value, p4, p5) => { 
    matchCount++;
    let pStart = ""; // style='display:inline' ";
    let lbl = `<label ${pStart} tabindex="0" for='note${matchCount}' class='notelbl'>[${matchCount}]</label>`;
    let fin = `<div>
      <input type='checkbox' id='note${matchCount}' class='notebox'>
      ${p1}${pStart}${p2}${lbl}${p4}${p5}
      <aside>${lbl} ${value} </aside> 
    </div>`;
    return fin;
  };

  return str.replace(regex, replacement);
}

function replaceAndLog(text, input, output) {  
  return text.replace(input, function(match, capture) {
    // output == '<li><div>$1</div></li>' && console.log('\n Caught: \n', {capture});
    return output.replace?.('$1', capture) || output(match, capture);
  });
};

export { makeDetails, replaceEmojis, convertNotes, replaceAndLog } // ES6 exports
if (typeof module !== 'undefined' && module.exports) { // CommonJS exports
  module.exports = { makeDetails, replaceEmojis, convertNotes, replaceAndLog };
}
