import express, { static, json, urlencoded } from "express";
import { launch } from 'puppeteer';
import cors from "cors";
import multer from 'multer';
import PCR  from 'puppeteer-chromium-resolver'
var forms = multer();
const path = __dirname + '/app/views/';
const app = express();
app.use(static(path));

var corsOptions = {
  origin: "http://localhost:3000"
};

app.use(cors(corsOptions));
app.use(json());
app.use(forms.array());
app.use(urlencoded({ extended: true }));

// set port, listen for requests
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.get('/', function (req,res) {
  res.sendFile(path + "index.html");
});
// app.post('/product', function (req, res) {
//   puppeteer.launch().then(async function (browser) {
//     const page = await browser.newPage();
//     await page.goto(req.body.product_url);
//     // Targeting the DOM Nodes that contain the Digimon names
//     const digimonNames = await page.$$eval('#digiList tbody tr td:nth-child(2) a', function (digimons) {
//       // Mapping each Digimon name to an array
//       return digimons.map(function (digimon) {
//         return digimon.innerText;
//       });
//     });
//     // Closing the Puppeteer controlled headless browser
//     await browser.close();
//   })
// })
app.post('/product', function (req, res) {
  // Launching the Puppeteer controlled headless browser and navigate to the Digimon website
  launch().then(async function (browser) {
    const page = await browser.newPage();
    console.log(req.body.url)
    await page.goto(req.body.url, {
      waitUntil: 'networkidle2',
    });
    //await page.pdf({ path: 'hn.pdf', format: 'a4' });
    //await page.screenshot({ path: 'ss.png' });
    // const digimonNames = await page.$('#itemTitle', function (tag) {
    //   console.log(tag)
    //   return tag.innerText
    //   // Mapping each Digimon name to an array
    //   // return tag.children.map(function (digimon) {
    //   //   return digimon.innerText;
    //   // });
    // });
    const header = JSON.parse(await page.evaluate(() => {
      const element = document.getElementById('itemTitle');
      const main_image=document.getElementById('icImg').getAttribute('src')
      console.log(element);
      //scraper()
      return JSON.stringify({title:element.innerText,main_image:main_image});
    }));
    await browser.close();
    res.send(header)
    // Sending the Digimon names to Postman
    //res.sendFile("emdad.png");
    //res.send(JSON.stringify(digimonNames))
  });
});
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});
