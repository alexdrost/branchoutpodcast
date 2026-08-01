import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.pf_index':'application/octet-stream','.pf_fragment':'application/octet-stream','.pf_meta':'application/octet-stream','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  let f=path.join('dist',p);
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory()) f=path.join(f,'index.html');
  if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf');}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r=>server.listen(4321,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
const shots=[['/','home'],['/episodes/','episodes'],['/themes/','themes'],
  ['/themes/business-development/','theme-bd'],
  ['/episodes/the-art-science-of-business-development-stephen-madsen/','episode'],
  ['/guests/','guests']];
for(const [u,name] of shots){
  await pg.goto('http://localhost:4321'+u,{waitUntil:'networkidle'});
  await pg.screenshot({path:`../shots/${name}.png`,fullPage:false});
  console.log('shot',name);
}
// search test
await pg.goto('http://localhost:4321/search/',{waitUntil:'networkidle'});
for(const q of ['Stockdale','quality of earnings']){
  await pg.fill('input[type=text]',q);
  await pg.waitForTimeout(1800);
  const n=await pg.locator('.pagefind-ui__result').count();
  console.log(`SEARCH "${q}" -> ${n} results`);
  if(q==='Stockdale'){await pg.screenshot({path:'../shots/search.png'});}
}
await b.close(); server.close();
