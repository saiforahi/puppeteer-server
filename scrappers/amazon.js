const puppeteer = require('puppeteer');
function extract_item_id(url){
    let item_id = url.split('/')[5]
    return item_id
}

const amazon = async (url) => {
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
                res(document.getElementById('productTitle').textContent.trim())
            })
        })
        var seller = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                res('')
            })
        })
        var price = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                let price = document.getElementById('priceblock_ourprice').textContent.replace('$','').trim()
                if(price.includes('-')){
                    let price_parts=price.split('-')
                    res(price_parts[1].replace('$','').trim())
                }
                else{
                    res(price)
                }
            })
        })
        
        //main image
        var default_image = await page.$eval('div.imgTagWrapper img',el=>el.getAttribute('src').trim())
        var variants={}
        var images=new Array()
        if(await page.$('#variation_size_name')){
            console.log('sizes found')
            variants['Size']=await page.evaluate(()=>{
                return new Promise((res,rej)=>{
                    let sizes=[]
                    let options=document.querySelectorAll('select[name="dropdown_selected_size_name"] option')
                    Array.from(options).forEach((option,idx)=>{
                        if(option.getAttribute('data-a-html-content')!=null){
                            sizes.push(option.getAttribute('data-a-html-content'))
                        }
                    })
                    res(sizes)
                })
            })
        }
        if(await page.$('#variation_color_name')){
            let color_variants_div= await page.$$('#variation_color_name > ul > li')
            if(color_variants_div.length>0){
                variants['Color']={}
                for(let index=0;index<color_variants_div.length;index++){
                    await color_variants_div[index].click()
                    await page.waitForSelector('li.image.item.itemNo0.maintain-height.selected div.imgTagWrapper img', {
                        visible: true,timeout: 0
                    }).then(()=>{})
                    //let image = await page.$eval('#imgTagWrapperId img',el=>el.getAttribute('src').trim())
                    let color_name = await page.$eval('#variation_color_name > div.a-row span.selection',el=>el.textContent.trim())
                    let item_image = await page.evaluate(()=>{
                        return new Promise((res,rej)=>{
                            if(document.querySelector('li.image.item.itemNo0.maintain-height.selected div.imgTagWrapper img')){
                                res(document.querySelector('li.image.item.itemNo0.maintain-height.selected div.imgTagWrapper img').getAttribute('data-old-hires').trim())
                            }
                            else{
                                res()
                            }
                        })
                    })
                    images.push(item_image)
                    let price = await page.$eval('#priceblock_ourprice',el=>el.textContent.replace('$','').trim())
                    if(price.includes('-')){
                        price=price.split('-')[1].replace('$','').trim()

                    }
                    variants['Color'][color_name] = {image:item_image,price:price}
                }
            }
        }
        
        
        // var description = await page.evaluate(()=>{
        //     return new Promise((res,rej)=>{
        //         res(document.getElementById('productDescription').querySelector('p').textContent.trim())
        //     })
        // })
        var specification = await page.evaluate(()=>{
            return new Promise((res,rej)=>{
                let specification = {}
                let li_items = document.querySelectorAll('#detailBullets_feature_div > ul.a-unordered-list.a-nostyle.a-vertical.a-spacing-none.detail-bullet-list > li > span.a-list-item')
                if(li_items.length>0){
                    Array.from(li_items).forEach((item,idx)=>{
                        if(item.querySelectorAll('span').length == 2){
                            specification[item.querySelectorAll('span')[0].textContent.replace(':','').replace(/\n/g,'').trim()] = item.querySelectorAll('span')[1].textContent.trim()
                        }
                    })
                }
                else if(document.querySelectorAll('table.a-keyvalue.prodDetTable').length>0){
                    let table_rows = document.querySelectorAll('table.a-keyvalue.prodDetTable tbody tr')
                    Array.from(table_rows).forEach((row,idx)=>{
                        specification[row.children[0].textContent.replace(/\n/g, '').trim()]=row.children[1].textContent.replace(/\n/g, '').trim()
                    })
                }
                res(specification)
            })
        })
        for (const [key, value] of Object.entries(specification)) {
            // console.log(`${key}: ${value}`);
            if(key.includes('ASIN')){
                console.log('ASIN found',value)
                item_id=value
            }
        }
        // for (const [key, value] of Object.entries(variants['Color'])) {
        //     console.log(value.image)
        //     images.push(value.image)
        // }
        
        let pages = await browser.pages();
        await Promise.all(pages.map(page =>page.close()));
        await browser.close();
        return {
            market:'amazon',
            item_id:item_id,
            url:url,
            title:title,
            seller:seller,
            variants:variants,
            current_price:price,
            currency:'USD',
            default_image:default_image,
            images:images,
            specification:specification,
            description:specification,
            "shipping_and_payment":{"shipping_to":[],"excludes":[]}
        }
        //return {market:'amazon',item_id:item_id,url:url,title:title,seller:seller,variants:variants,current_price:parseFloat(price.value),currency:price.currency,default_image:default_image,images:images,specifications:specifications,description:specifications,"shipping_and_payment":{"shipping_to":[],"excludes":[]}}
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

module.exports = amazon