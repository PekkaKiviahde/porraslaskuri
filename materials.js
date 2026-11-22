'use strict';

// Menekkiperusteena on pintojen projektio. Saman tuotteen määrät yhdistetään ennen pyöristystä.
function purchaseRows(m, top, front, allowance, panelLength, panelWidth) {
  const horizontal = 1800 * m.depth;
  const risers = 1800 * m.H / 2;
  const returns = ((m.n - 1) / 2) * m.going * m.rise;
  const items = new Map();
  function add(product, size, area, unitArea, unit, use) {
    const key = product + size;
    if (!items.has(key)) items.set(key, {product,size,area:0,unitArea,unit,uses:[]});
    const row = items.get(key);
    row.area += area / 1e6;
    row.uses.push(use);
  }
  function panel(thickness, area, use) {
    add('Pintalevy', panelLength+' × '+panelWidth+' × '+thickness+' mm',
      area,panelLength*panelWidth/1e6,'levyä',use);
  }
  function parquet(width, thickness, boards, area, use) {
    add('Parketti', '2 180 × '+width+' × '+thickness+' mm · '+boards+' lautaa/pkt',
      area,2180*width*boards/1e6,'pkt',use);
  }
  panel(top.board,horizontal,'alaboksin vaakapinnat ja tasanne');
  panel(front.board,risers+returns,'alaboksin otsat ja kapeiden askelmien sivut');
  parquet(260,top.wood,4,horizontal,'alaboksin vaakapinnat ja tasanne');
  parquet(185,front.wood,6,risers+returns,'alaboksin otsat ja kapeiden askelmien sivut');
  const rows = Array.from(items.values());
  for (const row of rows) row.quantity = Math.ceil(row.area*(1+allowance/100)/row.unitArea);
  return rows;
}

function initStockControls() {
  el('buy').insertAdjacentHTML('beforebegin','<div id="stockControls" class="fields"><label>Levyaihion pituus (mm)<input id="stockLength" type="number" value="2500" min="1" required></label><label>Levyaihion leveys (mm)<input id="stockWidth" type="number" value="1250" min="1" required></label><label>Hukkavara (%)<input id="stockWaste" type="number" value="15" min="0" max="100" step="any" required></label></div>');
  el('stockControls').addEventListener('input',render);
}

function updateMaterials(m,top,front,siteChecks=[]) {
  const buy = el('buy'), supply = el('supply'), download = el('exportSupply');
  const extra = upperSupplyGroups(m);
  const link = selectedUrl();
  const basisForQuote = {dimensions:quoteDimensions(m,siteChecks),lower:null,extra,link:''};
  if (link) {
    const drawings = new URL(link);
    drawings.hash = 'arkit';
    basisForQuote.link = drawings.href;
  }
  function showInputError(field,message) {
    download.disabled=true;
    download.onclick=null;
    supply.textContent=message+' ';
    const jump=document.createElement('a');
    jump.href='#'+field.id;
    jump.textContent='Korjaa '+field.labels[0].textContent.trim().replace(/\s*\(mm\)$/,'').toLocaleLowerCase('fi')+'.';
    jump.onclick=event=>{
      event.preventDefault();
      for(let parent=field.parentElement;parent;parent=parent.parentElement){
        if(parent.tagName==='DETAILS')parent.open=true;
      }
      field.focus({preventScroll:true});
      field.scrollIntoView({block:'center'});
    };
    supply.append(jump);
    for (const box of [buy,supply]) box.insertAdjacentHTML('beforeend',extra.map(supplyGroupHtml).join(''));
    setQuoteBasis(basisForQuote);
  }
  const invalidField=Object.values(shareFields).map(el).find(field=>!field.validity.valid);
  const length=readField('stockLength'),width=readField('stockWidth'),waste=readField('stockWaste');
  if (!frameLayersFit(m,top,front) || ![length,width,waste].every(Number.isFinite) || !Number.isInteger(length) || !Number.isInteger(width) || length<=0 || width<=0 || waste<0 || waste>100) {
    buy.textContent='Tarkista pintakerrokset, levyaihion mitat ja hukkavara.';
    const target=invalidField || (!top || top.total>=m.rise ? el('topWood') : el('frontWood'));
    showInputError(target,'Tarkista materiaalin mitta tai hukkavara ennen latausta.');
    return;
  }
  if (!link && invalidField) {
    buy.textContent='Tarkista lähtötiedot.';
    const instruction=siteChecks.find(text=>text.startsWith('Anna mitta')) || 'Tarkista lähtötieto ennen latausta.';
    showInputError(invalidField,instruction);
    return;
  }
  download.disabled=!link;
  const rows=purchaseRows(m,top,front,waste,length,width);
  const basis='Kerroskorkeus '+num(m.H)+' mm · välipohja '+num(m.floor)+' mm · etenemä '+num(m.going)+' mm · aukko '+(el('choice').value||'avoin')+
    ' · kapeat askelmat '+(el('hand').value==='right'?'oikealla':'vasemmalla')+' noustessa · päädyt '+sheetEndSelection()+
    ' · '+m.n+' + '+m.n+' nousua · hukkavara '+waste.toLocaleString('fi-FI',{maximumFractionDigits:20})+' %.';
  const panels=endPanels();
  const endStates={yes:'1 kpl',no:'0 kpl',open:'avoin'};
  const endSummary=panels.map(p=>p.name.toLowerCase()+' '+endStates[p.state]).join(', ');
  const separate=panels.some(p=>p.state==='yes')?' Valitut päädyt hinnoitellaan erikseen, kun materiaali ja rakenne on vahvistettu.':'';
  const pending=panels.some(p=>p.state==='open')?' Vahvista avoin päätyvalinta ennen tilausta.':'';
  const endNote='Alimman boksin päädyt ('+endSummary+').'+separate+pending;
  const scopeNote='Alaboksin pintalevyjen ja parkettien määräarvio perustuu näkyvien pintojen alaan. Pakkauskoot ja lautaleveydet ovat demotietoja. KIDE tarkentaa tuotteen hyötyleveyden, levyjen laadun ja sahausjaon ennen tilausta.';
  const note=endNote+' '+scopeNote;
  function productTable(showUse) {
    return '<table class="materialTable"><thead><tr><th scope="col">Materiaali</th><th scope="col">Määräarvio</th></tr></thead><tbody>'+
      rows.map(r=>{
        const detail=showUse?'<small>'+r.uses.join(', ')+' · netto '+num(r.area,3)+' m²</small>':'';
        return '<tr><td><b>'+r.product+'</b><br>'+r.size+detail+'</td><td>'+r.quantity+' '+r.unit+'</td></tr>';
      }).join('')+'</tbody></table>';
  }
  const headers=['Tuote','Toimituskoko','Määräarvio','Yksikkö'];
  const opening=el('choice').value;
  const headroomStatus=opening && !headroomOk(m,opening)
    ? 'Luonnos · aukko '+opening+', vapaa kulkukorkeus '+headroomLabel(m,opening)+' mm. '+headroomWarning(m,opening) : '';
  const review=headroomStatus?'<p>'+headroomStatus+'</p>':'';
  const delivery=rows.map(r=>[r.product,r.size,r.quantity,r.unit]);
  const frameRow=['Alaboksin ja kääntötason runkopuut','Poikkileikkaukset ja juoksumetrit vahvistetaan runkosuunnitelmasta','Avoin',''];
  basisForQuote.lower={
    key:'lower', title:'Alaboksi ja kääntötaso',
    rows:[...rows.map(r=>[r.product,r.size+' · '+r.uses.join(', ')+' · netto '+num(r.area,2)+' m²',r.quantity,r.unit]),frameRow],
    note:'Askelpinnan levy '+top.board+' mm ja parketti '+top.wood+' mm. Otsapinnan levy '+front.board+
      ' mm ja parketti '+front.wood+' mm. Hukkavara '+waste.toLocaleString('fi-FI')+' %. '+note
  };
  setQuoteBasis(basisForQuote);
  const brief='<h3>Alaboksi ja kääntötaso</h3><p>'+endNote+'</p>';
  const extraTables=extra.map(supplyGroupHtml).join('');
  for(const box of [buy,supply]){
    const open=box.querySelector('details')?.open?' open':'';
    const basisDetails='<details'+open+'><summary>Laskentaperusteet</summary><p>'+basis+'</p><p>'+scopeNote+'</p></details>';
    box.innerHTML=brief+review+productTable(box===buy)+'<p><b>'+frameRow[0]+'.</b> '+frameRow[1]+'.</p>'+basisDetails+extraTables;
  }
  download.onclick=link?()=>{
    const supplierUrl=new URL(link);
    supplierUrl.hash='supply';
    const siteRows=siteChecks.length?[['Työmaan tilavaraustarkistus',siteChecks.join(' ')]]:[];
    const reviewRows=headroomStatus?[[headroomStatus]]:[];
    const extraRows=extra.flatMap(group=>[[group.title],...group.rows,[group.note]]);
    const csv=[['Portaikon materiaalit · tarjousarvio'],[basisForQuote.dimensions],[basis],...reviewRows,...siteRows,['Avaa laskuri näillä valinnoilla',supplierUrl.href],['Alaboksi ja kääntötaso'],headers,...delivery,frameRow,[note],...extraRows].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='portaikon-toimituserittely.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }:null;
}
