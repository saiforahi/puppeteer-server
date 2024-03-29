const puppeteer = require('puppeteer');


const ebay = async (url) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            timeout: 0,
            ignoreHTTPSErrors: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-web-security', 
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-dev-shm-usage'
            ]
        });
        let browser_pages = await browser.pages()
        const page = browser_pages[0];
        console.log(url)
        await page.setViewport({ width: 1366, height: 700 });
        await page.goto(url, { waitUntil: ['load','networkidle0'], timeout: 0 });
        page.setDefaultNavigationTimeout(0);
        let variant_that_has_images=await page.evaluate(async()=>{
            return new Promise(async(res,rej)=>{
                let name=""
                let elements=[]
                let variants =[]
                if(document.querySelectorAll('#vi_main_img_fs ul li').length>0){
                    if (document.querySelectorAll("select[id*='msku-sel']").length>0) {
                        Array.from(document.querySelectorAll("select[id*='msku-sel']")).forEach(element=>{
                            if(element.getAttribute('name')=='Color' ||element.getAttribute('name')=='Colors'|| element.getAttribute('name')=='Colour'|| element.getAttribute('name')=='Pattern' || element.getAttribute('name')=='Theme'){
                                elements.push(element)
                                name=element.getAttribute('name')
                            }
                        })
                    }
                    Array.from(elements[0].querySelectorAll('option')).forEach(option =>{
                        if(option.getAttribute('value') != '-1'){
                            variants.push({value:option.getAttribute('value'),name:option.textContent})
                        }
                    })
                }
                res({variants:variants,name:name})
            })
        })
        //console.log('variant that has images',variant_that_has_images.variant)
        await page.waitForTimeout(3000)
        if(await page.$("select[id*='msku-sel'][name='Colors']")){
            console.log(Object.keys(variant_that_has_images.variants))
            let temp_obj ={}
            for(let index = 0 ; index<variant_that_has_images.variants.length;index++){
               await page.select("select[id*='msku-sel'][name='Colors']",variant_that_has_images.variants[index].value)
               let price
               if(await page.$('#mm-saleDscPrc')){
                price = await page.$eval('#mm-saleDscPrc',e=>e.textContent.replace('US $','').trim())
               }
               else if(await page.$('#prcIsum')){
                price = await page.$eval('#prcIsum',e=>e.textContent.replace('US $','').trim())
               }
               await page.waitForSelector('#icImg')
               let image = await page.$eval('#icImg',e=>e.getAttribute('src'))
               temp_obj[variant_that_has_images.variants[index].name] = {price:price,image:image}
            }
            variant_that_has_images.variants=temp_obj
        }
        else if(await page.$("select[id*='msku-sel'][name='Colour']")){
            console.log(Object.keys(variant_that_has_images.variants))
            let temp_obj ={}
            for(let index = 0 ; index<variant_that_has_images.variants.length;index++){
               await page.select("select[id*='msku-sel'][name='Colour']",variant_that_has_images.variants[index].value)
               let price
               if(await page.$('#mm-saleDscPrc')){
                price = await page.$eval('#mm-saleDscPrc',e=>e.textContent.replace('US $','').trim())
               }
               else if(await page.$('#prcIsum')){
                price = await page.$eval('#prcIsum',e=>e.textContent.replace('US $','').trim())
               }
               await page.waitForSelector('#icImg')
               let image = await page.$eval('#icImg',e=>e.getAttribute('src'))
               temp_obj[variant_that_has_images.variants[index].name] = {price:price,image:image}
            }
            variant_that_has_images.variants=temp_obj
        }
        else if(await page.$("select[id*='msku-sel'][name='Color']")){
            console.log(Object.keys(variant_that_has_images.variants))
            let temp_obj ={}
            for(let index = 0 ; index<variant_that_has_images.variants.length;index++){
               await page.select("select[id*='msku-sel'][name='Color']",variant_that_has_images.variants[index].value)
               let price
               if(await page.$('#mm-saleDscPrc')){
                price = await page.$eval('#mm-saleDscPrc',e=>e.textContent.replace('US $','').trim())
               }
               else if(await page.$('#prcIsum')){
                price = await page.$eval('#prcIsum',e=>e.textContent.replace('US $','').trim())
               }
               await page.waitForSelector('#icImg')
               let image = await page.$eval('#icImg',e=>e.getAttribute('src'))
               temp_obj[variant_that_has_images.variants[index].name] = {price:price,image:image}
            }
            variant_that_has_images.variants=temp_obj
        }
        else if(await page.$("select[id*='msku-sel'][name='Pattern']")){
            console.log(Object.keys(variant_that_has_images.variants))
            let temp_obj ={}
            for(let index = 0 ; index<variant_that_has_images.variants.length;index++){
               await page.select("select[id*='msku-sel'][name='Pattern']",variant_that_has_images.variants[index].value)
               let price
               if(await page.$('#mm-saleDscPrc')){
                price = await page.$eval('#mm-saleDscPrc',e=>e.textContent.replace('US $','').trim())
               }
               else if(await page.$('#prcIsum')){
                price = await page.$eval('#prcIsum',e=>e.textContent.replace('US $','').trim())
               }
               await page.waitForSelector('#icImg')
               let image = await page.$eval('#icImg',e=>e.getAttribute('src'))
               temp_obj[variant_that_has_images.variants[index].name] = {price:price,image:image}
            }
            variant_that_has_images.variants=temp_obj
        }
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
        const current_price=await page.evaluate(async()=>{
            return new Promise((res,rej)=>{
                let li_element=document.querySelectorAll('#vi_main_img_fs ul li')
                setTimeout(()=>{
                    li_element[0].click()
                },3000)
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
                res({price:price[1],currency:currency})
            })
        })
        const variants=await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                let variants={};
                let variant_elements=document.querySelectorAll("select[id*='msku-sel']")
                Array.from(variant_elements).forEach(element=>{
                    let options=[];
                    element.childNodes.forEach(child=>{
                        if(child.innerText!="- Select -"){
                            options.push(child.innerText)
                            console.log(child)
                        }
                    })
                    variants[element.getAttribute('name')]=options;
                })
                res(variants)
            })
        })
      
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
        if(variant_that_has_images.name.length>0){
            variants[variant_that_has_images.name]=variant_that_has_images.variants
        }

        let pages = await browser.pages();
        await Promise.all(pages.map(page =>page.close()));
        await browser.close();
        res.send({market:'ebay',item_id:item_id,url:url,title:title.replace("Details about  "," ").trim(),seller:seller,variants:variants,current_price:current_price.price,currency:current_price.currency,default_image:main_image,images:variant_that_has_images.images,details:details,description:description,specification:description,shipping_and_payment:shipping_and_payment})
    
    } catch (error) {
    console.log(error)
  }
    return "error"
}


module.exports = ebay