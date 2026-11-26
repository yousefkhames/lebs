import puppeteer from 'puppeteer-core';
const [,, url, out, w='390', h='844', hash='', lang='en'] = process.argv;
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const p = await b.newPage(); await p.setViewport({width:+w,height:+h,deviceScaleFactor:1});
p.on('pageerror',e=>console.log('PAGEERR',e.message)); p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
await p.goto(url); await p.evaluate(l=>{localStorage.setItem('lebs:zahra-studio:lang',JSON.stringify(l))},lang);
await p.goto(url+hash); await p.reload(); await new Promise(r=>setTimeout(r,600));
await p.screenshot({path:out,fullPage:process.env.FULL==='1'}); await b.close();
