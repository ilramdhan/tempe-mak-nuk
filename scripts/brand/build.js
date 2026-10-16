const {F,text,measure}=require('./gen.js');const fs=require('fs');
const OUT=process.argv[2]||'out';fs.mkdirSync(OUT,{recursive:true});
const r=n=>+n.toFixed(2);
// ---- Monogram seal (size S at origin) ----
function mnPath(S,font,scale){ // centered MN
  const size=S*scale; const m=measure(font,'MN',size,-0.02);
  const x=(S-(m.bb.x2-m.bb.x1))/2-m.bb.x1; const capH=-m.bb.y1; const y=(S+capH)/2;
  return text(font,'MN',x,y,size,-0.02).d;}
function seal(S,{detail=true,id='m'}={}){
  const R=S*0.12; const inset=S*0.075, lw=S*0.018;
  let maskInner=`<rect width="${S}" height="${S}" fill="#fff"/>`;
  if(detail){
    const a=inset, b=S-inset, ir=R*0.55;
    maskInner+=`<rect x="${r(a)}" y="${r(a)}" width="${r(b-a)}" height="${r(b-a)}" rx="${r(ir)}" fill="none" stroke="#000" stroke-width="${r(lw)}"/>`;
    // batik 'cecek' dots: three-dot clusters in corners
    const c=S*0.155, d=S*0.042, dr=S*0.0135;
    for(const [cx,cy,sx,sy] of [[c,c,1,1],[S-c,c,-1,1],[c,S-c,1,-1],[S-c,S-c,-1,-1]]){
      maskInner+=`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(dr*1.25)}" fill="#000"/>`;
      maskInner+=`<circle cx="${r(cx+sx*d)}" cy="${r(cy)}" r="${r(dr)}" fill="#000"/>`;
      maskInner+=`<circle cx="${r(cx)}" cy="${r(cy+sy*d)}" r="${r(dr)}" fill="#000"/>`;
    }
    // tiny ticks centred on each side (stamp registration marks)
  }
  maskInner+=`<path d="${mnPath(S,detail?F.disp:F.dispB,detail?0.52:0.6)}" fill="#000"/>`;
  return {defs:`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${S}" height="${S}">${maskInner}</mask>`,
    body:`<rect width="${S}" height="${S}" rx="${r(R)}" fill="currentColor" mask="url(#${id})"/>`};
}
function svg(w,h,inner,label){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" role="img" aria-label="${label}" fill="currentColor">\n${inner}\n</svg>\n`;}
// ---- Wordmark block at (x,y) baseline-top; returns {svg,w,h}
function wordmark(x,top,size,align='left',boxW=0){
  const wm=measure(F.disp,'Tempe Mak Nuk',size,-0.012);
  const cap=-wm.bb.y1; const ww=wm.bb.x2-wm.bb.x1;
  const subSize=size*0.205, track=0.24;
  const sub=measure(F.ui,'SEJAK 2001 · KLATEN',subSize,track); const sw=sub.bb.x2-sub.bb.x1;
  let wx=x-wm.bb.x1, sx=x-sub.bb.x1;
  if(align==='center'){wx=x+(boxW-ww)/2-wm.bb.x1; sx=x+(boxW-sw)/2-sub.bb.x1;}
  const base=top+cap; const gap=size*0.36; const subBase=base+gap+(-sub.bb.y1);
  // hairline rule between? use thin rule left of sub in horizontal
  const p1=text(F.disp,'Tempe Mak Nuk',wx,base,size,-0.012).d;
  const p2=text(F.ui,'SEJAK 2001 · KLATEN',sx,subBase,subSize,track).d;
  return {svg:`<path d="${p1}"/>\n<path d="${p2}"/>`,w:Math.max(ww,sw),h:subBase-top+ (sub.bb.y2>0?sub.bb.y2:0),ww,sw};
}
// Horizontal: seal + wordmark
{ const S=120, gap=30; const size=62; const wmTest=wordmark(0,0,size); const H=S;
  const top=(H-wmTest.h)/2; const s=seal(S,{id:'tmn-h'}); const wm=wordmark(S+gap,top,size);
  const W=S+gap+wm.w;
  fs.writeFileSync(`${OUT}/logo-horizontal.svg`,svg(W,H,`<defs>${s.defs}</defs>\n${s.body}\n${wm.svg}`,'Tempe Mak Nuk — sejak 2001, Klaten'));
  fs.writeFileSync(`${OUT}/meta.json`,'');}
// Stacked
{ const size=62; const wmT=wordmark(0,0,size); const W=wmT.w; const S=150; const gap=34;
  const s=seal(S,{id:'tmn-s'}); const sx=(W-S)/2; const wm=wordmark(0,S+gap,size,'center',W);
  fs.writeFileSync(`${OUT}/logo-stacked.svg`,svg(W,S+gap+wm.h,`<defs>${s.defs}</defs>\n<g transform="translate(${r(sx)} 0)">${s.body}</g>\n${wm.svg}`,'Tempe Mak Nuk — sejak 2001, Klaten'));}
// Monogram
{ const S=120; const s=seal(S,{id:'tmn-m'}); fs.writeFileSync(`${OUT}/monogram.svg`,svg(S,S,`<defs>${s.defs}</defs>\n${s.body}`,'Tempe Mak Nuk'));}
// Favicon (simplified)
{ const S=32; const s=seal(S,{detail:false,id:'tmn-f'}); fs.writeFileSync(`${OUT}/favicon.svg`,svg(S,S,`<defs>${s.defs}</defs>\n${s.body}`,'Tempe Mak Nuk'));}
fs.unlinkSync(`${OUT}/meta.json`);
