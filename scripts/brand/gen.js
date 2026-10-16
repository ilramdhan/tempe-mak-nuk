const o=require('opentype.js');const fs=require('fs');
const F={disp:o.loadSync('fonts/fr500.ttf'),dispB:o.loadSync('fonts/fr72_600.ttf'),semi:o.loadSync('fonts/fr144_700.ttf'),ui:o.loadSync('fonts/geist600.ttf'),ui5:o.loadSync('fonts/geist500.ttf')};
// text -> {d,bbox}; tracking in em
function text(font,str,x,y,size,track=0){let d='',cx=x;const glyphs=font.stringToGlyphs(str);let bb={x1:1e9,y1:1e9,x2:-1e9,y2:-1e9};
for(let i=0;i<glyphs.length;i++){const g=glyphs[i];const p=g.getPath(cx,y,size);const b=p.getBoundingBox();if(b.x2>b.x1){bb.x1=Math.min(bb.x1,b.x1);bb.y1=Math.min(bb.y1,b.y1);bb.x2=Math.max(bb.x2,b.x2);bb.y2=Math.max(bb.y2,b.y2);}
d+=p.toPathData(1);let adv=g.advanceWidth*size/font.unitsPerEm;if(i<glyphs.length-1)adv+=font.getKerningValue(g,glyphs[i+1])*size/font.unitsPerEm;cx+=adv+track*size;}
return {d,bb,w:cx-x-track*size};}
function measure(font,str,size,track=0){return text(font,str,0,0,size,track);}
module.exports={F,text,measure};
