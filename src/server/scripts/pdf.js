const { execSync } = require("child_process"); 
const path = require("path");


async function generate_pdf(req, res) {
  console.log("Generating PDF", req)
  const { latex } = req.body;
  if (!latex) return false;  
  execSync(`pdflatex -interaction=nonstopmode ./content.tex`, { stdio: "inherit" });
  const fileName = './content.pdf'
  if (!fileName) return res.status(500).send("PDF generation failed");
  return res.sendFile(fileName, err => err && console.error(err) && res.status(500).end())
}

module.exports = { generate_pdf };