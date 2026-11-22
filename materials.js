'use strict';

// Menekkiperusteena on pintojen projektio. Saman tuotteen määrät yhdistetään ennen pyöristystä.
function purchaseRows(m, top, front, allowance, panelLength, panelWidth) {
  const horizontal = 1800 * m.depth;
  const risers = 1800 * m.H / 2;
  const returns = ((m.n - 1) / 2) * 250 * m.rise;
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

function updateMaterials(m,top,front) {
  const buy = el('buy'), supply = el('supply'), download = el('exportSupply');
  if (!el('stockControls')) {
    buy.insertAdjacentHTML('beforebegin','<div id="stockControls" class="fields"><label>Levyaihion pituus (mm)<input id="stockLength" type="number" value="2500" min="1"></label><label>Levyaihion leveys (mm)<input id="stockWidth" type="number" value="1250" min="1"></label><label>Hukkavara (%)<input id="stockWaste" type="number" value="15" min="0" max="100"></label></div>');
    el('stockControls').addEventListener('input',render);
  }
  const length=readField('stockLength'),width=readField('stockWidth'),waste=readField('stockWaste');
  if (!top || !front || ![length,width,waste].every(Number.isFinite) || length<=0 || width<=0 || waste<0 || waste>100 || top.total>=m.rise || front.total>=250) {
    buy.textContent=supply.textContent='Tarkista pintakerrokset, levyaihion mitat ja hukkavara.';
    download.disabled=true;
    return;
  }
  download.disabled=false;
  const rows=purchaseRows(m,top,front,waste,length,width);
  const basis='Huone '+num(m.room)+' mm · välipohja '+num(m.floor)+' mm · kapeat '+(el('hand').value==='right'?'oikealla':'vasemmalla')+
    ' · aukko '+(el('choice').value||'avoin')+' · '+m.n+' + '+m.n+' nousua · hukkavara '+num(waste,1)+' %.';
  const note='Alaboksin pintamateriaalien tarjousmäärät perustuvat näkyvien pintojen alaan. Pakkauskoot ja lautaleveydet ovat demotietoja. Tarkista parketin hyötyleveys, levyjen laatu ja sahausjako ennen tilausta. Runkojäsenten, yläsyöksyn, liiman ja kiinnikkeiden määrät edellyttävät erillistä osaluetteloa.';
  function table(headers,data) {
    return '<div style="overflow:auto"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
      data.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  const headers=['Tuote','Toimituskoko','Määrä','Yksikkö'];
  const delivery=rows.map(r=>[r.product,r.size,r.quantity,r.unit]);
  buy.innerHTML='<p>'+basis+'</p>'+table(['Materiaali','Käyttö','Netto m²','Hankinta-arvio'],rows.map(r=>[r.product+' '+r.size,r.uses.join(', '),num(r.area,3),r.quantity+' '+r.unit]))+'<p>'+note+'</p>';
  supply.innerHTML='<p>Tarjouspyynnön liite · alaboksin pintamateriaalit</p><p>'+basis+'</p>'+table(headers,delivery)+'<p>'+note+'</p>';
  download.onclick=()=>{
    const csv=[['Alaboksin pintamateriaalit · tarjousarvio'],[basis],headers,...delivery,[note]].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='alaboksi-toimituserittely.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
}
