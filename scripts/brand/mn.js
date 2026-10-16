const r=n=>+n.toFixed(2);
function P(pts){let a=0;for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];a+=p[0]*q[1]-q[0]*p[1];}
 if(a<0)pts=pts.slice().reverse();return 'M'+pts.map(p=>r(p[0])+' '+r(p[1])).join('L')+'Z';}
function mn(ox,oy,H,{t=0.085,T=0.2,t2=0.075,serif=true,sw=0.095,sh=0.04,W=1.6,vk=0.5}={}){
  t*=H;T*=H;t2*=H;const w=W*H;const xA=0,xC=w-t;const xB=(w-t)*0.5;const X=x=>ox+x;const y0=oy,y1=oy+H;
  const v=xA+(xB+t-xA)*vk+T*0.32; const o=[];
  o.push(P([[X(xA),y0],[X(xA+t),y0],[X(xA+t),y1],[X(xA),y1]]));
  o.push(P([[X(xB),y0],[X(xB+t),y0],[X(xB+t),y1],[X(xB),y1]]));
  o.push(P([[X(xC),y0],[X(xC+t),y0],[X(xC+t),y1],[X(xC),y1]]));
  o.push(P([[X(xA),y0],[X(xA+T),y0],[X(v),y1],[X(v-T),y1]]));          // M thick
  o.push(P([[X(v-t2),y1],[X(v),y1],[X(xB+t),y0],[X(xB+t-t2),y0]]));       // M thin
  o.push(P([[X(xB),y0],[X(xB+T),y0],[X(xC+t),y1],[X(xC+t-T),y1]]));     // N thick
  let minx=0,maxx=w;
  if(serif){const a=sw*H,b=sh*H;const slab=(x,len,top)=>{const y=top?y0:y1-b;o.push(P([[X(x),y],[X(x+len),y],[X(x+len),y+b],[X(x),y+b]]));};
    slab(xA-a,a+T*0.6,true); slab(xC-a,t+2*a,true);
    slab(xA-a,t+2*a,false); slab(xB-a,t+2*a,false);
    minx=-a;maxx=w+a;}
  return {paths:o,minx,maxx};
}
module.exports={mn};
