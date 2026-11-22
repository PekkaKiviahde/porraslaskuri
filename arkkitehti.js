'use strict';
function architectStations(m){
 const lower=Array.from({length:m.n},(_,i)=>m.depth-(m.n-1-i)*250);
 const upper=Array.from({length:m.n-1},(_,i)=>850+i*250);
 const levels=Array.from({length:2*m.n+1},(_,i)=>i*m.rise);
 const stations=(...lists)=>[...new Set([0,...lists.flat()])].sort((a,b)=>a-b);
 return {lower:stations(lower,upper),upper:stations(upper,[m.A]),levels};
}
function drawArchitectSheets(m,right){
 const n=m.n,r=m.rise,D=m.depth,W=1800,H=m.H;
 const scale=Math.min(1/30,102/H,112/D);
 const f=v=>num(v,Math.abs(v-Math.round(v))<1e-7?0:1);
 let parts=[];
 function line(x,y,X,Y,w=.25,dash=''){
  parts.push('<line x1="'+x+'" y1="'+y+'" x2="'+X+'" y2="'+Y+'" stroke="#142629" stroke-width="'+w+'" stroke-dasharray="'+(dash||'none')+'"/>');
 }
 function text(x,y,value,size=3,align='middle',rotate=0){
  parts.push('<text transform="translate('+x+' '+y+') rotate('+rotate+')" style="text-anchor:'+align+'" font-size="'+size+'">'+value+'</text>');
 }
 function tick(x,y){line(x-.65,y+.85,x+.65,y-.85,.18)}
 function dimH(x,X,y,value){
  line(x,y,X,y,.13);for(const p of [x,X]){line(p,y-1.25,p,y+1.25,.13);tick(p,y)}
  text((x+X)/2,y-1.25,value);
 }
 function dimV(y,Y,x,value){
  line(x,y,x,Y,.13);for(const p of [y,Y]){line(x-1.25,p,x+1.25,p,.13);tick(x,p)}
  text(x-1.2,(y+Y)/2,value,2.9,'middle',-90);
 }
 function arrow(x,y,X,Y){
  line(x,y,X,Y,.28);const a=Math.atan2(Y-y,X-x);
  for(const d of [-.45,.45])line(X,Y,X-2.1*Math.cos(a+d),Y-2.1*Math.sin(a+d),.28);
 }
 function run(values,position,axis,vertical){
  const P=v=>vertical?[axis,position(v)]:[position(v),axis];
  line(...P(0),...P(values.at(-1)),.13);
  for(const v of values){
   const [x,y]=P(v);
   if(vertical)line(x-1,y,x+1,y,.13);else line(x,y-1,x,y+1,.13);
   if(v===0)parts.push('<circle cx="'+x+'" cy="'+y+'" r=".65" fill="white" stroke="#142629" stroke-width=".13"/>');
   else tick(x,y);
   if(vertical)text(x+2,y+1,f(v),2.6,'start');else text(x,y+3.6,f(v),2.6);
  }
 }
 const stations=architectStations(m);
 function header(title,page){
  parts=[];text(9,11,title,5.4,'start');text(411,10,'ARK  ·  '+page+'/2  ·  A3  ·  LUONNOS',3,'end');
  line(9,15,411,15,.35);
 }
 function finish(id,caption){
  line(9,279,411,279,.25);text(9,285,caption,3,'start');
  text(9,292,'Valmiit pinnat · mitat mm · alakerran valmis lattia ±0,000 · kapeat askelmat '+(right?'oikealla':'vasemmalla')+' noustessa',3,'start');
  document.getElementById(id).innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" role="img" aria-label="'+caption+'">'+parts.join('')+'</svg>';
 }
 const Xp=(left,v)=>left+(right?W-v:v)*scale;
 function plan(left,y,variant){
  const x=v=>Xp(left,v),Y=v=>y+v*scale;
  const seg=(a,b,c,d,w=.25,dash='')=>line(x(a),Y(b),x(c),Y(d),w,dash);
  if(!variant){
   seg(0,0,W,0);seg(0,0,0,D);seg(W,0,W,D);
   for(let i=1;i<=n;i++){
    const b=D-(i-1)*250, narrow=i%2===0;
    seg(0,b,narrow?850:W,b);if(narrow)seg(850,b,850,b-250);
   }
   for(let i=0;i<n-1;i++)seg(950,850+i*250,W,850+i*250,.18,'2 1');
   for(const [v,sgn,label] of [[160,right?-1:1,'L'],[1640,right?1:-1,'M']]){
    line(x(v),y-2,x(v),Y(D)+2,.25,'3 1 .5 1');
    for(const yy of [y-2,Y(D)+2]){arrow(x(v)-5*sgn,yy,x(v),yy);text(x(v)-7*sgn,yy+1,label);}
   }
   arrow(x(540),Y(D-130),x(540),Y(D-670));arrow(x(1350),Y(1150),x(1350),Y(1750));
   run(stations.lower,Y,left+W*scale+5,true);
   dimV(y,Y(D),left-6,f(D));dimV(y,Y(1100),left-14,'1 100');
   dimV(y,Y(850),left+W*scale+22,'850');
   dimH(x(0),x(W),y-15,'1 800');
   const middle=y-7;dimH(x(0),x(850),middle,'850');dimH(x(950),x(W),middle,'850');
   const cx=x(900);line(x(850),middle,x(950),middle,.13);line(cx,middle,cx+5,middle-4,.13);text(cx+6,middle-4,'100',2.7,'start');
  }else{
   const e=m[variant],q=[[0,0],[W,0],[W,m.A],[850,m.A],[850,e],[0,e],[0,0]];
   for(let j=1;j<q.length;j++)seg(...q[j-1],...q[j],.5);
   dimH(x(0),x(W),y-4,'1 800');
   dimV(y,Y(e),x(0)+(right?6:-6),f(e));dimV(y,Y(m.A),x(W)+(right?-6:6),f(m.A));
   if(variant==='B'){dimH(x(0),x(850),Y(e)-5,'850');dimV(Y(e),Y(m.A),x(850)+(right?6:-6),'250');}
   for(const v of stations.upper.slice(1,-1))seg(950,v,W,v,.25);
   run(stations.upper,Y,left+W*scale+19,true);
   const cut=x(160),direction=right?-1:1;
   line(cut,y-2,cut,Y(m.A)+3,.25,'3 1 .5 1');
   for(const yy of [y-2,Y(m.A)+3]){arrow(cut-direction*5,yy,cut,yy);text(cut-direction*7,yy+1,'L');}
   arrow(x(430),Y(e-130),x(430),Y(e-600));
  }
  run([0,right?950:850,W],v=>left+v*scale,Y(variant?m.A:D)+7,false);
 }
 function profile(left,base,wide,opening){
  const dir=(right===wide)?1:-1;
  const x=v=>left+(dir===1?v:D+270-v)*scale,y=z=>base-z*scale;
  const seg=(a,b,c,d,w=.25,dash='')=>line(x(a),y(b),x(c),y(d),w,dash);
  seg(0,0,D+200,0);
  for(let i=1;i<n;i++){
   const a=D-(i-1)*250, full=i%2===1, w=!wide||full?.7:.25;
   // The raised landing projects 250 mm further on the lower-flight side.
   const prev=wide&&full?Math.max(0,i-2):i-1;
   seg(a,prev*r,a,i*r,w);seg(a,i*r,a-(wide&&full?500:250),i*r,w);
  }
  // Lower flight reaches the 1 100 mm landing edge on both lower tread lanes.
  seg(0,H/2,1100,H/2,.7);
  seg(1100,(wide?n-2:n-1)*r,1100,H/2,.7);
  const upperCut=wide;
  for(let i=1;i<n;i++){
   const a=850+(i-1)*250,z=(n+i)*r,w=upperCut?.7:.25;
   seg(a,z,a+270,z,w);seg(a+270,z,a+270,z-m.box,w);seg(a+270,z-m.box,a,z-m.box,w);seg(a,z-m.box,a,z,w);
  }
  const e=opening?m[opening]:m.A;
  seg(e,H,D+270,H,.7);seg(e,m.room,D+270,m.room,.7);seg(e,H,e,m.room,.7);
  text(x(340),y(H/2)-1.8,level(H/2),2.7);
  text(x(D+160),y(H)-1.5,level(H),2.7);
  if(opening){
   seg(1100,H/2,D,r,.13,'2 1');
   const head=m.head(e),z=m.room-head;
   dimV(y(z),y(m.room),x(e),f(Math.round(head)));
   dimH(x(0),x(e),y(H)-5,f(e));
   text(x(e)+dir*4,(y(z)+y(m.room))/2,'vapaa',2.7,'middle',-90);
  }else{
   dimH(x(0),x(1100),y(H/2)+6,'1 100');
   dimH(x(0),x(850),y((n+1)*r)-5,'850');
   const i=wide?3:4,a=D-(i-1)*250,step=wide?500:250;
   dimH(x(a),x(a-step),y(i*r)+5,f(step));
   dimV(y(i*r),y((i-(wide?2:1))*r),x(a)+dir*4,f((wide?2:1)*r));

   const ux=850+250;dimH(x(ux),x(ux+250),y((n+2)*r)-7,'250');
  }
  run(stations.lower,x,base+4,false);
  run(stations.levels,y,left+(D+270)*scale+8,true);
 }
 function front(left,base){
  const x=v=>left+v*scale,y=z=>base-z*scale, edge=right?950:850;
  line(x(0),base,x(W),base);line(x(0),base,x(0),y(H/2));line(x(W),base,x(W),y(H/2));
  for(let i=1;i<=n;i++){
   const small=i%2===0,a=small&&right?edge:0,b=small&&!right?edge:W;
   line(x(a),y(i*r),x(b),y(i*r));if(small)line(x(edge),y(i*r),x(edge),y((i-1)*r));
  }
  for(const isLeft of [true,false]){
   const heights=[0];for(let i=1;i<=n;i++)if(i%2===1||isLeft!==right)heights.push(i*r);
   run(heights,y,isLeft?left-20:x(W)+4,true);
  }
  dimH(x(0),x(edge),y(H/2)-5,f(edge));dimH(x(edge),x(W),y(H/2)-5,f(W-edge));
  dimH(x(0),x(W),base+4,'1 800');run([0,edge,W],x,base+10,false);
 }
 header('Portaikon tilavaraus · valmiit mitat',1);
 text(12,24,'Pohja · alaboksi ja yläsyöksy',4,'start');plan(32,49,null);
 text(12,171,'Etukuva · alaboksi alapäästä',4,'start');front(43,248);
 text(191,24,'Pituusleikkaus L–L · kapeiden askelmien kautta',4,'start');profile(208,137,false,null);
 text(191,161,'Pituusleikkaus M–M · leveiden askelmien kautta',4,'start');profile(208,268,true,null);
 text(120,65,'Tasanteen siirto 250 mm',3,'start');
 text(117,73,'Kaidevara 100 mm',3,'start');
 text(117,86,'L–L ja M–M',3.4,'start');text(117,92,'160 mm sivureunasta',3,'start');
 text(117,111,'Yläaskelma',3.4,'start');text(117,117,'Syvyys 270',3,'start');text(117,123,'Etenemä 250',3,'start');text(117,129,'Vapaa rako 100',3,'start');
 finish('ark1','Tilavaraus '+f(W)+' × '+f(D)+' · kerroskorkeus '+f(H)+' · '+n+' + '+n+' nousua · yksi nousu '+f(r));
 header('Yläkerran vapaan aukon vertailu',2);
 for(const [k,off] of [['A',0],['B',207]]){
  text(off+12,25,k+(k==='A'?' · Suorakaiteinen aukko':' · Porrastettu aukko'),4.5,'start');
  plan(off+47,38,k);
  text(off+12,146,'L–L · vapaa korkeus aukon reunalla',4,'start');
  profile(off+43,261,false,k);
  text(off+12,273,'Vapaa kulkukorkeus '+f(Math.round(m.head(m[k])))+' mm',3.8,'start');
 }
 finish('ark2','Kulkukorkeus mitataan pystysuoraan etureunojen yhdysviivasta välipohjan alapintaan. A:n ja B:n ero '+f(Math.round(m.head(m.A)-m.head(m.B)))+' mm.');
}
