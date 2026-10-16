const T={
light:{background:'#FAF7F2',surface:'#F1EBDF',foreground:'#1E1B16','muted-foreground':'#6B6458',primary:'#2F4A2C',accent:'#B7792B',border:'#E3DACB',halal:process.argv[2]||'#1F6B3A','accent-strong':process.argv[3]||'#8F5A1A','primary-foreground':'#FAF7F2'},
dark:{background:'#100F0C',surface:'#1A1813',foreground:'#F3EEE4','muted-foreground':'#A79F90',primary:'#9CC28F',accent:'#DDA25A',border:'#2B2820',halal:process.argv[4]||'#6FBF86','accent-strong':'#DDA25A','primary-foreground':'#100F0C'}};
const h2r=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const lin=c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
const L=h=>{const [r,g,b]=h2r(h).map(lin);return .2126*r+.7152*g+.0722*b};
const cr=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const ok=h=>{const [r,g,b]=h2r(h).map(lin);
const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
const LL=.2104542553*l+.793617785*m-.0040720468*s,A=1.9779984951*l-2.428592205*m+.4505937099*s,B=.0259040371*l+.7827717662*m-.808675766*s;
let C=Math.hypot(A,B),H=Math.atan2(B,A)*180/Math.PI;if(H<0)H+=360;return `oklch(${(LL*100).toFixed(1)}% ${C.toFixed(3)} ${C<0.002?0:H.toFixed(1)})`};
for(const m of ['light','dark']){console.log('##',m);for(const[k,v]of Object.entries(T[m]))console.log(k.padEnd(20),v,ok(v));
const t=T[m];const pairs=[['foreground','background'],['foreground','surface'],['muted-foreground','background'],['muted-foreground','surface'],['primary','background'],['primary','surface'],['primary-foreground','primary'],['accent','background'],['accent','surface'],['accent-strong','background'],['halal','background'],['halal','surface'],['border','background'],['foreground','primary'],['background','accent'],['foreground','accent']];
for(const[a,b]of pairs)console.log(`  ${a} on ${b}: ${cr(t[a],t[b]).toFixed(2)}`)}
