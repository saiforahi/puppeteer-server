console.log('hello from scraper')
const get_images_structure2=()=>{
    let images={};
    if(document.getElementsByClassName('cc-image')[0]){
        images['thumbnail']=document.getElementsByClassName(' cc-image')[0].src;
    }
    if(document.getElementsByClassName('vi-image-gallery__image vi-image-gallery__image--absolute-center')[0]){
        images['image']=document.getElementsByClassName('vi-image-gallery__image vi-image-gallery__image--absolute-center')[0].src;
    }
    return images;
}
const get_product_details=()=>{
    //let details_section=document.getElementById('ProductDetails');
    let details={};
    let name_cells=document.getElementsByClassName('s-name');
    let value_cells=document.getElementsByClassName('s-value');
    for(let index=0;index<name_cells.length;index++){
        details[name_cells[index].textContent]=value_cells[index].textContent;
    }
    return details;
}
function get_description(){
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
    rows.forEach((row)=>{
        if(row.cells.length>0){
            let span1=document.getElementsByClassName("product-details-title")[0];
            let span2=document.getElementsByClassName("product-details-title")[1];
            let span3=document.getElementsByClassName("product-details-title")[2];
            if(row.cells[0].innerText!==`<br class="br">` && !row.cells[0].contains(span1)&& !row.cells[0].contains(span2)&& !row.cells[0].contains(span3)){
                description[row.cells[0].innerText]=row.cells[1].innerText;
            }
        }
    })
    return {description:description,table:table.outerHTML};
}
function set_color_variant_images(images,options){
    let new_options_array=new Array()
    for(let index=0;index<options.length;index++){
        let variant={color:options[index],image:images[index+1]}
        variant.image=images[index+1]
        new_options_array.push(variant)
    }
    return new_options_array
}
function get_variants(){
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
            let images=get_images()
            console.log('images',images)
            document.getElementById('msku-sel-2').childNodes.forEach(child=>{
                if(child.innerText!=="- Select -"){
                    options.push(child.innerText)
                }
            })
            variants[document.getElementById('msku-sel-2').getAttribute('name')]=set_color_variant_images(images,options);
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
        return variants;
    }
    return variants;
}
function get_images(){
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
    return images;
}
function get_seller_info(){
    let seller={};
    if(document.getElementsByClassName('mbg-nw')!==null){
        let spans=document.getElementsByClassName('mbg-nw');
        spans.forEach(span=>{
            if(span.parentNode.parentNode.className==="mbg vi-VR-margBtm3" && span.parentNode.parentNode.parentNode.className==="bdg-90"){
                seller.name=span.innerText;
                seller.profile=span.parentNode.getAttribute('href');
            }
        })
    }
    return seller;
}
function get_price(text){ 
    let textContent=new String(text);
    let price=textContent.split(" ");
    price[1]=price[1].replace('$'," ").trim();
    let currency=price[0]+" $";
    return {price:price[1],currency:currency};
}
function get_item_id(){ //done
    let item_id="";
    let element=document.querySelector("div.social-widget.vi-share-widget-tc div.sw a")
    item_id=element.getAttribute('data-itemid');
    return item_id;
}
exports.set_data=function(){
    let titleElement=document.getElementById("itemTitle");
    let priceElement=document.getElementById("prcIsum");
    let mainImage = document.getElementById("icImg");
    data={market:"ebay",item_id:get_item_id(),url:location.href,seller:get_seller_info(),title:titleElement.textContent.replace("Details about  "," ").trim(),variants:get_variants(),current_price:parseInt(get_price(priceElement.textContent).price),currency:get_price(priceElement.textContent).currency, default_image:mainImage.src,images:get_images(),details:get_product_details(),description:get_description().description,specification:get_description().table,shipping_and_payment:get_shipping_and_payment_details()};
    //chrome.storage.local.set({product_details:data})
    console.log("Captured JSON object: "+JSON.stringify(data));
    return data
}
function get_shipping_and_payment_details(){
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
    return shipping;
}

