const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

module.exports = async function createPDF(data) {
  var templateHtml = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
  var template = handlebars.compile(templateHtml);
  var html = template(data);
  var pdfPath = path.join(__dirname, `CV.pdf`);

  var options = {
    format: "A4",
    headerTemplate: "<p></p>",
    footerTemplate: "<p></p>",
    displayHeaderFooter: false,
    margin: {
      top: "0px",
      bottom: "0px",
      left: "0px",
      right: "0px",
    },
    printBackground: true,
    path: pdfPath,
  };

  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true,
  });

  var page = await browser.newPage();

  await page.goto(`data:text/html;charset=UTF-8,${html}`, {
    waitUntil: "networkidle0",
  });
  await page.pdf(options);
  await browser.close();
  return pdfPath;
};
