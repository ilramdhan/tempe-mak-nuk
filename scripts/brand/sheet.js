// contact sheet: inline each svg at multiple widths on light and dark bg
const fs=require('fs');const dir=process.argv[2];const files=process.argv.slice(3);
let y=20, parts=[];const W=1400;
function inner(f){const s=fs.readFileSync(f,'utf8');const vb=s.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
 let body=s.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');return {vb,body};}
let uid=0;
for(const f of files){const {vb,body}=inner(f);
 for(const [bg,fg] of [['#FAF7F2','#2F4A2C'],['#100F0C','#F3EEE4']]){
  let x=20;const sizes=vb[2]/vb[3]>2?[400,200,100]:[200,64,32,16];const rowH=Math.max(...sizes.map(s=>s*vb[3]/vb[2]))+20;
  parts.push(`<rect x="0" y="${y-10}" width="${W}" height="${rowH+10}" fill="${bg}"/>`);
  for(const s of sizes){const h=s*vb[3]/vb[2];uid++;
   const b=body.replace(/id="([^"]+)"/g,`id="$1-${uid}"`).replace(/url\(#([^)]+)\)/g,`url(#$1-${uid})`);
   parts.push(`<svg x="${x}" y="${y}" width="${s}" height="${h}" viewBox="${vb.join(' ')}" color="${fg}" fill="currentColor" style="color:${fg}">${b}</svg>`);x+=s+30;}
  y+=rowH+10;}}
fs.writeFileSync(dir+'/sheet.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="100%" height="100%" fill="#888"/>${parts.join('\n')}</svg>`);
