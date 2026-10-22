const {F,text,measure}=require('./gen.js');const {mn}=require('./mn.js');const fs=require('fs');
const OUT=process.argv[2]||'out';fs.mkdirSync(OUT,{recursive:true});const r=n=>+n.toFixed(2);
function letters(S,detail){const H=S*(detail?0.36:0.5); const opt=detail?{}:{t:0.15,T:0.27,serif:false,W:1.5};
  const probe=mn(0,0,H,opt); const gw=probe.maxx-probe.minx; const ox=(S-gw)/2-probe.minx, oy=(S-H)/2;
  return mn(ox,oy,H,opt).paths;}
function seal(S,{detail=true,id='m'}={}){
  const R=S*(detail?0.1:0.16); let m=`<rect width="${S}" height="${S}" fill="#fff"/>`;
  if(detail){const a=S*0.07,lw=S*0.016,ir=R*0.5;
    m+=`<rect x="${r(a)}" y="${r(a)}" width="${r(S-2*a)}" height="${r(S-2*a)}" rx="${r(ir)}" fill="none" stroke="#000" stroke-width="${r(lw)}"/>`;
    const c=S*0.16,d=S*0.04,dr=S*0.013;
    for(const [cx,cy,sx,sy] of [[c,c,1,1],[S-c,c,-1,1],[c,S-c,1,-1],[S-c,S-c,-1,-1]]){
      m+=`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(dr*1.3)}" fill="#000"/><circle cx="${r(cx+sx*d)}" cy="${r(cy)}" r="${r(dr)}" fill="#000"/><circle cx="${r(cx)}" cy="${r(cy+sy*d)}" r="${r(dr)}" fill="#000"/>`;}
  }
  m+=`<path fill="#000" d="${letters(S,detail).join('')}"/>`;
  return {defs:`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${S}" height="${S}">${m}</mask>`,body:`<rect width="${S}" height="${S}" rx="${r(R)}" mask="url(#${id})"/>`};}
function svg(w,h,inner,label){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" role="img" aria-label="${label}" fill="currentColor">\n${inner}\n</svg>\n`;}
function wordmark(x,top,size,align='left',boxW=0){
  const tr=-0.012;const wm=measure(F.disp,'Tempe Mak Nuk',size,tr);const cap=-wm.bb.y1;const ww=wm.bb.x2-wm.bb.x1;
  const subSize=size*0.2,track=0.26;const sub=measure(F.ui,'SEJAK 2001 · KLATEN',subSize,track);const sw=sub.bb.x2-sub.bb.x1;
  let wx=x-wm.bb.x1,sx=x-sub.bb.x1+size*0.02;if(align==='center'){wx=x+(boxW-ww)/2-wm.bb.x1;sx=x+(boxW-sw)/2-sub.bb.x1;}
  const base=top+cap;const gap=size*0.42;const subBase=base+gap+(-sub.bb.y1);
  return {svg:`<path d="${text(F.disp,'Tempe Mak Nuk',wx,base,size,tr).d}"/>\n<path d="${text(F.ui,'SEJAK 2001 · KLATEN',sx,subBase,subSize,track).d}"/>`,w:Math.max(ww,sw),h:subBase-top,cap};}
const meta={};
{const S=120,gap=30,size=60;const t=wordmark(0,0,size);const top=(S-t.h)/2;const s=seal(S,{id:'tmn-h'});const wm=wordmark(S+gap,top,size);const W=S+gap+wm.w;
 fs.writeFileSync(`${OUT}/logo-horizontal.svg`,svg(W,S,`<defs>${s.defs}</defs>\n${s.body}\n${wm.svg}`,'Tempe Mak Nuk, sejak 2001, Klaten'));meta.h={W,H:S};}
{const size=60;const t=wordmark(0,0,size);const W=t.w;const S=140,gap=30;const s=seal(S,{id:'tmn-s'});const wm=wordmark(0,S+gap,size,'center',W);
 fs.writeFileSync(`${OUT}/logo-stacked.svg`,svg(W,S+gap+wm.h,`<defs>${s.defs}</defs>\n<g transform="translate(${r((W-S)/2)} 0)">${s.body}</g>\n${wm.svg}`,'Tempe Mak Nuk, sejak 2001, Klaten'));}
{const S=120;const s=seal(S,{id:'tmn-m'});fs.writeFileSync(`${OUT}/monogram.svg`,svg(S,S,`<defs>${s.defs}</defs>\n${s.body}`,'Tempe Mak Nuk'));}
{const S=32;const s=seal(S,{detail:false,id:'tmn-f'});fs.writeFileSync(`${OUT}/favicon.svg`,svg(S,S,`<defs>${s.defs}</defs>\n${s.body}`,'Tempe Mak Nuk'));}
// ---- emit TSX ----
const parse=f=>{const s=fs.readFileSync(`${OUT}/${f}`,'utf8');const vb=s.match(/viewBox="([^"]+)"/)[1];const body=s.replace(/^[\s\S]*?<svg[^>]*>\n?/,'').replace(/\n?<\/svg>\s*$/,'');return {vb,body};};
function toJsx(body,idName){return body.replace(/id="[^"]+"/g,'id={maskId}').replace(/url\(#[^)]+\)/g,'MASK').replace(/mask="MASK"/g,'mask={`url(#${maskId})`}')
 .replace(/stroke-width=/g,'strokeWidth=');}
const V={horizontal:parse('logo-horizontal.svg'),stacked:parse('logo-stacked.svg'),monogram:parse('monogram.svg'),favicon:parse('favicon.svg')};
let tsx=`/**
 * Tempe Mak Nuk — logo system.
 * GENERATED from the same geometry as public/brand/*.svg (Fraunces 144pt Medium + Geist SemiBold outlined to paths,
 * custom "MN" shared-stem ligature). Do not hand-edit paths; regenerate instead.
 * Colour = currentColor → set text colour (e.g. \`text-primary\`) to theme for light/dark.
 * Sizing: set height (or width) via className; aspect ratio is preserved by viewBox.
 * Minimum sizes: horizontal ≥ 160px wide, stacked ≥ 120px wide, monogram ≥ 32px; below that use variant="favicon".
 */
import { useId, type SVGProps } from 'react'

export type LogoVariant = 'horizontal' | 'stacked' | 'monogram' | 'favicon'

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'children'> {
  variant?: LogoVariant
  className?: string
  /** Accessible name. Pass an empty string to mark the logo decorative (aria-hidden). */
  'aria-label'?: string
}

const DEFAULT_LABEL = 'Tempe Mak Nuk, sejak 2001, Klaten'

export function Logo({ variant = 'horizontal', className, 'aria-label': ariaLabel = DEFAULT_LABEL, ...rest }: LogoProps) {
  const maskId = \`tmn-\${useId().replace(/[^a-zA-Z0-9_-]/g, '')}\`
  const decorative = ariaLabel === ''
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': ariaLabel }
  const common = { xmlns: 'http://www.w3.org/2000/svg', fill: 'currentColor', className, focusable: 'false' as const, ...a11y, ...rest }
`;
for(const [k,v] of Object.entries(V)){tsx+=`
  if (variant === '${k}') {
    return (
      <svg viewBox="${v.vb}" {...common}>
        ${toJsx(v.body).split('\n').join('\n        ')}
      </svg>
    )
  }
`;}
tsx+=`  return null
}

export default Logo
`;
// default variant fallthrough: horizontal handled first; replace final null not reachable
fs.writeFileSync(`${OUT}/logo.tsx`,tsx);
