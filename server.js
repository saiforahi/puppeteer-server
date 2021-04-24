const set_data=require('./scripts/ebay-scraper')
const express = require("express")
const puppeteer = require('puppeteer');
const bodyParser = require("body-parser");
const cors = require("cors");
var multer = require('multer');
const { json } = require('body-parser');
var forms = multer();
const path = __dirname + '/app/views/';
const app = express();
app.use(express.static(path));

var corsOptions = {
  origin: "http://localhost:3000"
};


app.use(cors(corsOptions));
app.use(express.json());
//app.use(forms.array());
app.use(express.urlencoded({ extended: true }));

// set port, listen for requests
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.get('/', function (req,res) {
  res.sendFile(path + "index.html");
});

app.post('/product', function (req, res) {
  // Launching the Puppeteer controlled headless browser and navigate to the Digimon website
  try {
    puppeteer.launch({
        headless: true,
        timeout: 0,
        ignoreHTTPSErrors: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process']
    }).then(async function (browser) {
        const page = await browser.newPage();
        console.log(req.body.url)
        await page.goto(req.body.url, { waitUntil: 'load', timeout: 0 });
        page.setDefaultNavigationTimeout(0);
        await page.setViewport({ width: 1366, height: 700 });
        await page.waitForTimeout(2000);
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
        //   const [read_more]=await page.$eval('#readFull a')
        //   if(read_more){
        //       await read_more.click()
        //   }
        //await page.waitForTimeout
        const variant_that_has_images=JSON.parse(await page.evaluate(()=>{
            let name=""
            let elements=[]
            let variant_element={}
            let images=[]
            if (document.querySelectorAll("select[id*='msku-sel']").length>0) {
                Array.from(document.querySelectorAll("select[id*='msku-sel']")).forEach(element=>{
                    if(element.getAttribute('name')==='Color' || element.getAttribute('name')==='COLOUR'|| element.getAttribute('name')==='Pattern'){
                        elements.push(element)
                        name=element.getAttribute('name')
                    }
                })
            }
            let li_element=document.querySelectorAll('#vi_main_img_fs ul li')
            Array.from(li_element).forEach(li=>{
                if(!li.querySelector('button table.img tbody tr td div img').getAttribute('src').includes('p.ebaystatic.com')){
                    li.click()
                    if(elements[0].querySelector('option[selected="selected"]')==null){
                        variant_element['default']=document.getElementById("icImg").getAttribute('src')
                    }
                    else{
                        if(variant_element[elements[0].querySelector('option[selected="selected"]').innerText]){
                            variant_element[elements[0].querySelector('option[selected="selected"]').innerText]=variant_element[elements[0].querySelector('option[selected="selected"]').innerText]+','+document.getElementById('icImg').getAttribute('src')
                        }
                        else{
                            variant_element[elements[0].querySelector('option[selected="selected"]').innerText]=document.getElementById('icImg').getAttribute('src')
                        }
                    }
                    images.push(document.getElementById("icImg").getAttribute('src'))
                    // console.log(document.getElementById("icImg").getAttribute('src'))
                    // console.log(variant_element.querySelector('option[selected="selected"]'))
                }
            })
            return JSON.stringify({variant:variant_element,images:images,name:name})
        }))
        //Array.from()
        //
        // await page.screenshot({ path: 'clicks_for_of.png',fullPage: true })
        await page.waitForSelector("div.social-widget.vi-share-widget-tc div.sw a")
        const item_id=await page.evaluate(()=>{
            let item_id=document.querySelector("div.social-widget.vi-share-widget-tc div.sw a").getAttribute('data-itemid')
            return item_id
        })
        //await page.waitForSelector(".mbg-nw")
        const seller= JSON.parse(await page.evaluate(()=>{
            const data={};
            if(document.getElementsByClassName('mbg-nw')!==null){
            const spans=document.getElementsByClassName('mbg-nw');
            Array.from(spans).forEach(span=>{
                if(span.parentNode.parentNode.className==="mbg vi-VR-margBtm3" && span.parentNode.parentNode.parentNode.className==="bdg-90"){
                    data.name=span.innerText;
                    data.profile=span.parentNode.getAttribute('href');
                }
            })
            }
            return JSON.stringify(data);
        }))
        const title = JSON.parse(await page.evaluate(()=>{
            return JSON.stringify(document.getElementById('itemTitle').innerText);
        }))
        const main_image = JSON.parse(await page.evaluate(()=>{
            return JSON.stringify(document.getElementById('icImg').getAttribute('src'));
        }))
        const current_price=JSON.parse(await page.evaluate(()=>{
            let textContent
            if(document.getElementById('mm-saleDscPrc')){
                textContent=document.getElementById('mm-saleDscPrc').textContent
            }
            else if(document.getElementById("prcIsum")){
                textContent=document.getElementById("prcIsum").textContent;
            }
            let price=textContent.split(" ");
            price[1]=price[1].replace('$'," ").trim();
            let currency=price[0]+" $";
            return JSON.stringify({price:price[1],currency:currency})
        }))
        const variants=JSON.parse(await page.evaluate(()=>{
            let variants={};
            let variant_elements=document.querySelectorAll("select[id*='msku-sel']")
            Array.from(variant_elements).forEach(element=>{
                let options=[];
                element.childNodes.forEach(child=>{
                    if(child.innerText!="- Select -" && !child.innerText.includes('[out of stock]')){
                        options.push(child.innerText)
                        console.log(child)
                    }
                })
                variants[element.getAttribute('name')]=options;
                // if(element.getAttribute('name')==="Color" || element.getAttribute('name')==="COLOUR" || element.getAttribute('name')==="Pattern"){
                    
                //     variants[element.getAttribute('name')]=variant_that_has_images;
                // }
                // else{
                //     variants[element.getAttribute('name')]=options;
                // }
            })
            return JSON.stringify(variants);
        }))
      
        const details=JSON.parse(await page.evaluate(()=>{
            let details={};
            let name_cells=document.getElementsByClassName('s-name');
            let value_cells=document.getElementsByClassName('s-value');
            for(let index=0;index<name_cells.length;index++){
                details[name_cells[index].textContent]=value_cells[index].textContent;
            }
            return JSON.stringify(details);
        }))
        const description=JSON.parse(await page.evaluate(()=>{
            let description={};
            let section;
            if(document.getElementsByClassName('prodDetailSec')[0]!==undefined){
                section=document.getElementsByClassName('prodDetailSec')[0];
            }
            else{
                section=document.getElementsByClassName('section')[0]
            }
            let table;
            section.childNodes.forEach((child)=>{
                if(child.nodeName==="TABLE"){
                    table=child;
                }
            })
            let rows=table.rows;
            Array.from(rows).forEach((row)=>{
                if(row.cells.length>0){
                    let span1=document.getElementsByClassName("product-details-title")[0];
                    let span2=document.getElementsByClassName("product-details-title")[1];
                    let span3=document.getElementsByClassName("product-details-title")[2];
                    if(row.cells[0].innerText!==`<br class="br">` && !row.cells[0].contains(span1)&& !row.cells[0].contains(span2)&& !row.cells[0].contains(span3)){
                        if(row.cells[0].textContent.length>0 && row.cells[1]){
                            console.log(row.cells[0].textContent.trim() +' '+row.cells[1].textContent.trim())
                            description[row.cells[0].textContent.trim()]=row.cells[1].textContent.trim();
                            if(row.cells[2]){
                                console.log(row.cells[2].textContent.trim() +' '+row.cells[3].textContent.trim())
                                description[row.cells[2].textContent.trim()]=row.cells[3].textContent.trim();
                            }
                        }
                    }
                }
            })
            return JSON.stringify(description);
        }))
        const shipping_and_payment=JSON.parse(await page.evaluate(()=>{
            let shipping={shipping_to:[],excludes:[]}
            if(document.getElementById('sh-gsp-wrap')!==null){
                console.log('shipping and payment details div found')
                document.getElementById('sh-gsp-wrap').childNodes.forEach(child=>{
                    if(new String(child.innerText).includes('Shipping') && child.className==='sh-sLoc'){
                        shipping.shipping_to=new String(child.innerText).replace('Shipping to:','').trim().split(',')
                    }
                    else if(child.className==='sh-sLoc' && new String(child.innerText).includes('Excludes')){
                        shipping.shipping_to=new String(child.innerText).replace('Excludes:','').trim().split(',')
                    }
                })
            }
            return JSON.stringify(shipping);
        }))
        variants[variant_that_has_images.name]=variant_that_has_images.variant
        await browser.close();
        //variants[variant_that_has_images.name]=variant_that_has_images.images
        res.send({market:'ebay',item_id:item_id,url:req.body.url,title:title.replace("Details about  "," ").trim(),seller:seller,variants:variants,current_price:current_price.price,currency:current_price.currency,default_image:main_image,images:variant_that_has_images.images,details:details,description:description,specification:description,shipping_and_payment:shipping_and_payment})
        // Sending the Digimon names to Postman
        //res.sendFile("emdad.png");
        });
    } catch (error) {
    console.log(error)
  }
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

