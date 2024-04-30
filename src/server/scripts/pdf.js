const { execSync } = require("child_process"); 

async function generate_pdf(req, res) {
  const { latex } = req.body;
  if (!latex) return false;  
  execSync(`pdflatex -interaction=nonstopmode ./content.tex`, { stdio: "inherit" });
  return res.download("./content.pdf");
}

module.exports = { generate_pdf };
