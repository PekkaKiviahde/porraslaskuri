// Sama malli palvelee suunnittelua, rakentamista ja tarjousvertailua.
const workNavigation=document.createElement('nav');
workNavigation.setAttribute('aria-label','Siirry työvaiheeseen');
workNavigation.className='workNavigation';
const destinations=[
  ['Piirustukset','arkit'],['Runkoarkki','runkoarkki'],
  ['Ostolista','buy'],['Toimituserittely','supply'],
  ['Pyydä tarjous KIDEltä','tarjous']
];
function openWorkStage(target){
  let section=document.getElementById(target);
  if(target==='arkit' && document.getElementById('mobileOpenings').offsetHeight)
    section=document.getElementById('mobileOpenings');
  if(document.getElementById('results').hidden){
    section=document.getElementById('error');
  }else{
    for(let parent=section;parent;parent=parent.parentElement){
      if(parent.tagName==='DETAILS')parent.open=true;
    }
    if(target==='buy'||target==='supply')section=section.closest('details').querySelector('summary');
    if(target==='tarjous')section=section.querySelector('summary');
  }
  section.tabIndex=-1;
  section.focus({preventScroll:true});
  section.scrollIntoView({block:'start'});
}
for(const [title,target] of destinations){
  const link=document.createElement('a');
  link.textContent=title;link.href='#'+target;
  link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    if(!document.getElementById('results').hidden && location.hash!=='#'+target)
      history.pushState(null,'','#'+target);
    openWorkStage(target);
    updateShareQr();
  });
  workNavigation.append(link);
}
document.querySelector('main > header').after(workNavigation);
function restoreWorkStage(){
  const target=location.hash.slice(1);
  if(destinations.some(([,id])=>id===target))openWorkStage(target);
  updateShareQr();
}
window.addEventListener('hashchange',restoreWorkStage);
if(location.hash)window.addEventListener('load',restoreWorkStage,{once:true});
