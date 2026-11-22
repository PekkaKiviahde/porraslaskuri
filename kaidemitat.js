'use strict';

function showGlassDimensions(container, m, right) {
  container.replaceChildren();
  if (!m) return;
  const side = right ? 'oikealla' : 'vasemmalla';
  const upper = right ? 'vasemmalla' : 'oikealla';
  const entries = [
    ['Syöksyjen välinen kaidevara', '100 mm'],
    ['Yläsyöksyn vaakamitta ensimmäisen askelman etureunasta ylälattian reunaan', num(m.run) + ' mm'],
    ['Kääntötason valmiista pinnasta yläkerran valmiiseen lattiaan', num(m.H/2) + ' mm'],
    ['Kääntötason syvyys yläsyöksyn kohdalla / alaboksin kohdalla', '850 / '+num(m.landing)+' mm'],
    ['Yksi nousu / etenemä', num(m.rise,1)+' / '+num(m.going)+' mm']
  ];
  const orientation = 'Alhaalta ylöspäin katsottuna kapeat askelmat ovat '+side+' ja yläsyöksy '+upper+'.';
  const note = 'Mitat ovat valmiiden porraspintojen suunnittelumittoja. Lasitoimittaja määrittää lasien koot, liitosvälit ja kiinnitykset työmaamittojen perusteella.';
  const summary = document.createElement('summary');summary.textContent='Lasikaiteen lähtömitat';
  const direction = document.createElement('p');direction.textContent=orientation;
  const dl = document.createElement('dl');
  for(const [name,value] of entries){
    const term=document.createElement('dt'),detail=document.createElement('dd');
    term.textContent=name;detail.textContent=value;detail.style.fontWeight='650';
    detail.style.margin='0 0 .6rem';dl.append(term,detail);
  }
  const info=document.createElement('p');info.textContent=note;
  const download=document.createElement('button');download.type='button';download.textContent='Lataa kaiteen lähtömitat (CSV)';
  download.addEventListener('click',()=>{
    const rows=[['Lasikaiteen lähtömitat','Kerroskorkeus '+num(m.H)+' mm'],...entries,['Kätisyys',orientation],['Mittausperuste',note]];
    const csv=rows.map(row=>row.map(cell=>'"'+cell.replaceAll('"','""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='kaiteen-lahtomitat-'+m.H+'-'+m.going+'.csv';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  });
  container.append(summary,direction,dl,info,download);
}
