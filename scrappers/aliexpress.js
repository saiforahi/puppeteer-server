const puppeteer = require('puppeteer');
const aliexpress = async (url) => {
    const browser = await puppeteer.launch({
        headless: false,
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
    try{
        let browser_pages = await browser.pages()
        const page = browser_pages[0];
        console.log(url)
        await page.setViewport({ width: 1366, height: 700 });
        await page.goto(url, { waitUntil: ['load','networkidle0'], timeout: 0 });
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
    }
    catch(error){
        console.log(error)
    }
    
    let pages = await browser.pages();
    await Promise.all(pages.map(page =>page.close()));
    await browser.close();
    return {market:'aliexpress',url:url,title:title,seller:seller,variants:variants}
}

module.exports = aliexpress