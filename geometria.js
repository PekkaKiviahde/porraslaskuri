'use strict';
const num=(v,p=0)=>v.toLocaleString('fi-FI',{minimumFractionDigits:p,maximumFractionDigits:p});
const level=z=>z===0?'±0,000':'+'+(Math.round(z)/1000).toFixed(3).replace('.',',');
function model(room,floor,going){
 const H=room+floor;let n=Math.ceil(H/380);if(n%2===0)n++;n=Math.max(3,n);
 const rise=H/(2*n),run=(n-1)*going,A=850+run,B=A-going,depth=A+going;
 const overlap=20, treadDepth=going+overlap;
 return {room,floor,H,n,rise,going,overlap,treadDepth,landing:850+going,run,A,B,depth,box:rise-100,head:e=>room-(1+(depth-e)/going)*rise};
}
const minHeadroom=1950;
function headroomOk(m,k){
 // Compare the rise line to the finished soffit using whole input millimetres.
 const denominator=2*m.n*m.going;
 const riseLineNumerator=(m.going+m.depth-m[k])*m.H;
 return (m.room-minHeadroom)*denominator>=riseLineNumerator;
}
function headroomLabel(m,k){
 const value=m.head(m[k]);
 return !headroomOk(m,k)&&Math.round(value)===minHeadroom?'alle '+num(minHeadroom):num(value);
}
function headroomWarning(m,k){
 return headroomOk(m,k)?'':'Alittaa asunnon sisäportaan 1 950 mm:n vähimmäiskulkukorkeuden.';
}
