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
app.use(forms.array());
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
    puppeteer.launch({headless: true,slowMo: 100}).then(async function (browser) {
      const page = await browser.newPage();
      console.log(req.body.url)
      await page.goto(req.body.url, {
        waitUntil: 'domcontentloaded',
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
      await page.waitForSelector("div.social-widget.vi-share-widget-tc div.sw a")
      await page.waitForSelector(".mbg-nw")
      let item_id=await page.$eval("div.social-widget.vi-share-widget-tc div.sw a",el=>el.getAttribute('data-itemid'))
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
        let textContent=new String(document.getElementById("prcIsum").textContent);
        let price=textContent.split(" ");
        price[1]=price[1].replace('$'," ").trim();
        let currency=price[0]+" $";
        return JSON.stringify({price:price[1],currency:currency})
      }))
      const variants=JSON.parse(await page.evaluate(()=>{
        let variants={};
        if(document.getElementsByClassName('nonActPanel ').length===1){
            if(document.getElementById('msku-sel-1')!==null){
                let options=[];
                document.getElementById('msku-sel-1').childNodes.forEach(child=>{
                    if(child.innerText!=="- Select -"){
                        options.push(child.innerText)
                    }
                })
                variants[document.getElementById('msku-sel-1').getAttribute('name')]=options;
            }
            if(document.getElementById('msku-sel-2')!==null){
                let options=[];
                let images=[]
                if(document.querySelector('#vi_main_img_fs')!==null){
                  let tableDatas=document.querySelector('#vi_main_img_fs');
                  if(tableDatas.hasChildNodes()){
                      if(tableDatas.children[0].nodeName==="UL" && tableDatas.children[0].getAttribute('class')==='lst icon'){
                          tableDatas.children[0].childNodes.forEach((td)=>{
                              if(td.hasChildNodes){
                                  td.childNodes.forEach((item)=>{
                                      if(item.hasChildNodes){
                                          item.childNodes.forEach((item)=>{ //table
                                              if(item.hasChildNodes){
                                                  item.childNodes.forEach((item)=>{ //tbody
                                                      if(item.hasChildNodes){
                                                          item.childNodes.forEach((item)=>{
                                                              if(item.hasChildNodes){
                                                                  item.childNodes.forEach(item=>{ //td
                                                                      if(item.hasChildNodes){
                                                                          item.childNodes.forEach(item=>{
                                                                              if(item.hasChildNodes){
                                                                                  item.childNodes.forEach(img=>{
                                                                                      if(img.src!==undefined){
                                                                                          images.push(img.src);
                                                                                      }
                                                                                  })
                                                                              }
                                                                          })
                                                                      }
                                                                  })
                                                              }
                                                          })
                                                      }
                                                  })
                                              }
                                          })
                                      }
                                  })
                              }
                          })
                      }
                  }
                }
                console.log('images',images)
                document.getElementById('msku-sel-2').childNodes.forEach(child=>{
                    if(child.innerText!=="- Select -"){
                        options.push(child.innerText)
                    }
                })
                let new_options_array=new Array()
                for(let index=0;index<options.length;index++){
                    let variant={color:options[index],image:images[index+1]}
                    variant.image=images[index+1]
                    new_options_array.push(variant)
                }
                variants[document.getElementById('msku-sel-2').getAttribute('name')]=new_options_array;
            }
            if(document.getElementById('msku-sel-3')!==null){
                let options=[];
                document.getElementById('msku-sel-3').childNodes.forEach(child=>{
                    if(child.innerText!=="- Select -"){
                        options.push(child.innerText)
                    }
                })
                variants[document.getElementById('msku-sel-3').getAttribute('name')]=options;
            }
            if(document.getElementById('msku-sel-4')!==null){
                let options=[];
                document.getElementById('msku-sel-4').childNodes.forEach(child=>{
                    if(child.innerText!=="- Select -"){
                        options.push(child.innerText)
                    }
                })
                variants[document.getElementById('msku-sel-4').getAttribute('name')]=options;
            }
            //console.log(variants);
            return JSON.stringify(variants);
        }
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
                    description[row.cells[0].innerText]=row.cells[1].innerText;
                }
            }
        })
        return JSON.stringify({description:description,table:table.outerHTML});
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
      const images=JSON.parse(await page.evaluate(()=>{
        let images=[];
        if(document.querySelector('#vi_main_img_fs')!==null){
            let tableDatas=document.querySelector('#vi_main_img_fs');
            if(tableDatas.hasChildNodes()){
                if(tableDatas.children[0].nodeName==="UL" && tableDatas.children[0].getAttribute('class')==='lst icon'){
                    tableDatas.children[0].childNodes.forEach((td)=>{
                        if(td.hasChildNodes){
                            td.childNodes.forEach((item)=>{
                                if(item.hasChildNodes){
                                    item.childNodes.forEach((item)=>{ //table
                                        if(item.hasChildNodes){
                                            item.childNodes.forEach((item)=>{ //tbody
                                                if(item.hasChildNodes){
                                                    item.childNodes.forEach((item)=>{
                                                        if(item.hasChildNodes){
                                                            item.childNodes.forEach(item=>{ //td
                                                                if(item.hasChildNodes){
                                                                    item.childNodes.forEach(item=>{
                                                                        if(item.hasChildNodes){
                                                                            item.childNodes.forEach(img=>{
                                                                                if(img.src!==undefined){
                                                                                    images.push(img.src);
                                                                                }
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }
        }
    
        return JSON.stringify(images);
      }))
      //await browser.close();
      res.send({market:'ebay',item_id:item_id,url:req.body.url,title:title.replace("Details about  "," ").trim(),seller:seller,variants:variants,current_price:current_price.price,currency:current_price.currency,default_image:main_image,images:images,details:details,description:description.description,specification:description.table,shipping_and_payment:shipping_and_payment})
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

