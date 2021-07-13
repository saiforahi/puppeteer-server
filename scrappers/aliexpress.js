const puppeteer = require('puppeteer');

async function get_price(page){
    var price 
    if(await page.$('span.product-price-value')){
        price = await page.evaluate(()=>{
            return new Promise ((res,rej)=>{
                let text = document.querySelector('span.product-price-value').textContent.trim()
                let value
                let currency = ''
                if(text.includes('US')){
                    value = text.replace('US $','')
                    currency = 'USD'
                }
                else if(text.includes('EUR')){
                    currency = 'EUR'
                }
                else if(text.includes('GBP')){
                    currency='GBP'
                }
                if(value.includes('-')){
                    value=value.split('-')[1]
                }
                res({value:value,currency:currency})
            })
        })
    }
    else if(await page.$('span.uniform-banner-box-price')){
        price = await page.evaluate(()=>{
            return new Promise ((res,rej)=>{
                let text = document.querySelector('span.uniform-banner-box-price').textContent.trim()
                let value
                let currency = ''
                if(text.includes('US')){
                    value = text.replace('US $','')
                    currency = 'USD'
                }
                else if(text.includes('EUR')){
                    currency = 'EUR'
                }
                else if(text.includes('GBP')){
                    currency='GBP'
                }
                if(value.includes('-')){
                    value = value.split('-')[1]
                }
                res({value:value,currency:currency})
            })
        })
    }
    return price.value
}
function extract_item_id(url){
    let slash_parts = url.split('/')
    let item_id
    slash_parts.forEach((part,index)=>{
        if(part.includes('html')){
            let what_parts = part.split('?')
            item_id=what_parts[0]
            item_id = String(item_id).replace('.html','').trim()
            console.log('item_id',item_id)
        }
    })
    return item_id
}
const aliexpress = async (url) => {
    try{
        var item_id=extract_item_id(url)
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
        await page.goto(url, { waitUntil: ['load','networkidle2'], timeout: 0 });
        await page.addStyleTag({ content: "{scroll-behavior: auto !important;}" });
        var title = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                res(document.getElementsByClassName('product-title-text')[0].textContent.trim())
            })
        })
        var seller = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                res(document.getElementsByClassName('shop-name')[0].children[0].textContent.trim())
            })
        })
        var variants = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                let sku_wrappers = document.querySelectorAll('div.sku-property')
                for(let index = 0 ; index < sku_wrappers.length ; index ++){
                    
                }
                res()
            })
        })
        //price
        var price
        if(await page.$('span.product-price-value')){
            price = await page.evaluate(()=>{
                return new Promise ((res,rej)=>{
                    let text = document.querySelector('span.product-price-value').textContent.trim()
                    let value
                    let currency = ''
                    if(text.includes('US')){
                        value = text.replace('US $','')
                        currency = 'USD'
                    }
                    else if(text.includes('EUR')){
                        currency = 'EUR'
                    }
                    else if(text.includes('GBP')){
                        currency='GBP'
                    }
                    if(value.includes('-')){
                        value = value.split('-')[1]
                    }
                    res({value:value,currency:currency})
                })
            })
        }
        else if(await page.$('span.uniform-banner-box-price')){
            price = await page.evaluate(()=>{
                return new Promise ((res,rej)=>{
                    let text = document.querySelector('span.uniform-banner-box-price').textContent.trim()
                    let value
                    let currency = ''
                    if(text.includes('US')){
                        value = text.replace('US $','')
                        currency = 'USD'
                    }
                    else if(text.includes('EUR')){
                        currency = 'EUR'
                    }
                    else if(text.includes('GBP')){
                        currency='GBP'
                    }
                    if(value.includes('-')){
                        value = value.split('-')[1]
                    }
                    res({value:value,currency:currency})
                })
            })
        }
        
        //main image
        var default_image = await page.$eval('img.magnifier-image',el=>el.getAttribute('src').trim())
        //collecting variants with images
        var variants={}
        var images=[]
        let color_variants_div= await page.$$('div.sku-property-image img')
        if(color_variants_div.length>0){
            variants['Color'] ={}
            for(let index = 0 ; index<color_variants_div.length ; index++){
                await color_variants_div[index].click()
                //await page.waitForSelector(".magnifier-image")
                let color_name = String(await color_variants_div[index].getProperty('alt')).replace('JSHandle:','')
                let image =await page.$eval('img.magnifier-image',el=>el.getAttribute('src').trim())
                images.push(image)
                let price = await get_price(page)
                variants['Color'][color_name] = {image:image,price:price} 
            }
        }

        var variants_2 = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                let variants ={}
                let sku_property = document.querySelectorAll('div.sku-property')
                sku_property.forEach((element,index) => {
                    let temp_variant_name = element.querySelector('div.sku-title').textContent.replace(':','').trim()
                    if(temp_variant_name == 'Size'){
                        variants[temp_variant_name]=new Array()
                        element.querySelectorAll('div > ul.sku-property-list > li.sku-property-item').forEach((el,index)=>{
                            variants[temp_variant_name] = [...variants[temp_variant_name],el.firstChild.textContent.trim()]
                        })
                    }
                });
                res(variants)
            })
        })
        if(variants_2!=undefined){
            variants['Size']=variants_2['Size']
        }
        //specification
        if(await page.$('li[ae_object_type="specs"]')){
            console.log('specification tab found')
            await page.$eval('li[ae_object_type="specs"]',el=>el.click())
        }
        await autoScroll(page)
        await page.waitForSelector('div.product-specs', {
            visible: true,timeout: 0
        }).then(()=>{console.log('specs div found')})
        
        var specifications = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                let specifications= {}
                let specs = document.querySelectorAll('div.product-specs > ul.product-specs-list.util-clearfix > li.product-prop.line-limit-length')
                console.log('total specs --- ',specs.length)
                specs.forEach((spec,index)=>{
                    let key = spec.querySelector('span.property-title').textContent.replace(':','').trim()
                    let value = spec.querySelector('span.property-desc.line-limit-length').textContent.trim()
                    specifications[key] = value
                })
                res(specifications)
            })
        })
        let pages = await browser.pages();
        await Promise.all(pages.map(page =>page.close()));
        await browser.close();
        return {market:'aliexpress',item_id:item_id,url:url,title:title,seller:seller,variants:variants,current_price:parseFloat(price.value),currency:price.currency,default_image:default_image,images:images,variants:variants,specifications:specifications,description:specifications,"shipping_and_payment":{"shipping_to":[],"excludes":[]}}
    }
    catch(error){
        console.log(error)
    }
    return "error"
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

module.exports = aliexpress