const h2r=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);const lin=c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
const L=h=>{const [r,g,b]=h2r(h).map(lin);return .2126*r+.7152*g+.0722*b};const cr=(a,b)=>{const x=L(a),y=L(b);return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2)};
const ok=h=>{const [r,g,b]=h2r(h).map(lin);const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
const LL=.2104542553*l+.793617785*m-.0040720468*s,A=1.9779984951*l-2.428592205*m+.4505937099*s,B=.0259040371*l+.7827717662*m-.808675766*s;let C=Math.hypot(A,B),H=Math.atan2(B,A)*180/Math.PI;if(H<0)H+=360;return `oklch(${(LL*100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`};
const rows=[
['light','input','#8C8373','#FAF7F2'],['light','input on surface','#8C8373','#F1EBDF'],
['dark','input','#6E6758','#100F0C'],['dark','input on surface','#6E6758','#1A1813'],
['light','accent-strong','#8F5A1A','#F1EBDF'],
['light','slot-available','#2F4A2C','#FAF7F2'],['light','slot-nearly','#8F5A1A','#FAF7F2'],['light','slot-full','#9A3B2A','#FAF7F2'],['light','slot-closed','#6B6458','#FAF7F2'],
['dark','slot-available','#9CC28F','#100F0C'],['dark','slot-nearly','#DDA25A','#100F0C'],['dark','slot-full','#E8907C','#100F0C'],['dark','slot-closed','#A79F90','#100F0C'],
['light','destructive','#9A3B2A','#F1EBDF'],['dark','destructive','#E8907C','#1A1813'],
['light','halal-fg on halal','#FFFFFF','#1F6B3A'],['dark','halal-fg on halal','#100F0C','#6FBF86'],
['light','bg on primary(btn)','#FAF7F2','#2F4A2C'],['light','fg on accent(btn)','#1E1B16','#B7792B'],['dark','bg on accent(btn)','#100F0C','#DDA25A'],
];
for(const [m,n,a,b] of rows)console.log(m.padEnd(6),n.padEnd(20),a,ok(a),'on',b,cr(a,b));
