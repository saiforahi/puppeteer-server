const puppeteer = require('puppeteer');

async function get_price(page){
    var price={value:'',currency:''}
    if(await page.$('span.price-characteristic')){
        price = await page.evaluate(()=>{
            return new Promise ((res,rej)=>{
                let value = document.querySelector('span.price-characteristic').getAttribute('content').replace('$','').trim()
                let currency = document.querySelector('span.price-currency').getAttribute('content').trim()
                if(value.includes('-')){
                    value = value.split('-')[1]
                }
                res({value:value,currency:currency})
            })
        })
    }
    return price.value
}

// function confirming_identity(page){
//     const div = await page.$('div > div')
// }
function extract_item_id(url){
    let slash_parts = url.split('/')
    let item_id = slash_parts[slash_parts.length-1]
    return item_id
}
const walmart = async (url) => {
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
                res(document.getElementsByClassName('prod-ProductTitle prod-productTitle-buyBox font-bold')[0].getAttribute('content'))
            })
        })
        var seller = ""
        
        //price
        var price
        if(await page.$('span.price-characteristic')){
            price = await page.evaluate(()=>{
                return new Promise ((res,rej)=>{
                    let value = document.querySelector('span.price-characteristic').getAttribute('content').replace('$','').trim()
                    let currency = document.querySelector('span.price-currency').getAttribute('content').trim()
                    if(value.includes('-')){
                        value = value.split('-')[1]
                    }
                    res({value:value,currency:currency})
                })
            })
        }
        
        //main image
        var default_image = await page.$eval('img.hover-zoom-hero-image',el=>el.getAttribute('src').trim())
        //await autoScroll(page)
        var specifications = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                let specifications= {}
                let rows = document.querySelectorAll('table.product-specification-table.table-striped tbody tr')
                console.log('total spec rows --- ',rows.length)
                rows.forEach((row,index)=>{
                    let key = row.querySelector('td').textContent.replace(':','').trim()
                    let value = row.querySelector('td div').textContent.trim()
                    specifications[key] = value
                })
                res(specifications)
            })
        })
        
        await autoScroll(page)
        //variants
        var variants={}
        var images=[]
        
        if((await page.$$('div[label="Color"] div.variants__list input')).length > 0){
            console.log('color items found')
            variants['Color']={}
            let color_items= await page.$$('div[label="Color"] div.variants__list input')
            for(let index =0 ;index<color_items.length;index++){
                await color_items[index].click()
                let image = await page.$eval('img.hover-zoom-hero-image',el=>el.getAttribute('src').trim())
                images.push(image)
                let price = await get_price(page)
                variants['Color'][await color_items[index].getProperty('data-label')] = {image:image,price:price}
            }
        }
        let pages = await browser.pages();
        await Promise.all(pages.map(page =>page.close()));
        await browser.close();
        return {market:'walmart',item_id:item_id,url:url,title:title,seller:seller,variants:variants,current_price:parseFloat(price.value),currency:price.currency,default_image:default_image,images:images,specifications:specifications,description:{},"shipping_and_payment":{"shipping_to":[],"excludes":[]}}
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

module.exports = walmart