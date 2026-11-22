'use strict';

const el = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const glossLabels = {matta: 'Matta', puolihimmea: 'Puolihimmeä', kiiltava: 'Kiiltävä'};
const colours = {'9005': 'Syvänmusta', '7016': 'Antrasiitinharmaa', '7035': 'Vaaleanharmaa', '9016': 'Liikennevalkoinen'};
const form = el('quoteForm');
const consultation = 'Pyydän KIDEn tuote-ehdotusta';

function readDesign(q) {
  const integer = key => /^\d{1,5}$/.test(q.get(key) || '') ? Number(q.get(key)) : NaN;
  const measured = q.get('tyomaakorot') === '1';
  const total = integer(measured ? 'kerros' : 'kerroskorkeus');
  const floor = measured ? total - integer('vapaaKorkeus') : integer('valipohja');
  // Myös aiemmin jaettu huonekorkeuteen perustuva tarjouslinkki toimii.
  const height = !measured && !q.has('kerroskorkeus') && q.has('huone') ? integer('huone') + floor : total;
  const room = height - floor, going = q.has('etenema') ? integer('etenema') : 250;
  if (!Number.isInteger(room) || room < 2500 || room > 3000 || floor <= 0 || floor > 3000 ||
      !(going >= 250 && going <= 270)) return null;
  const side = q.get('katisyys') || 'right', opening = q.get('aukko') || '';
  if (!['left','right'].includes(side) || !['','A','B'].includes(opening)) return null;
  const ends = ['vasen','oikea'].map(key => q.get(key) || 'open');
  if (ends.some(x => !['open','yes','no'].includes(x))) return null;
  const m = model(room, floor, going);
  const sideName = side === 'right' ? 'oikealla' : 'vasemmalla';
  const endName = {yes: 'kyllä', no: 'ei', open: 'avoin'};
  const dimensions = [
    (measured ? 'Työmaalla mitattu' : 'Suunnittelumitta') + ' · kerroskorkeus ' + num(height) +
      ' mm, välipohja ' + num(floor) + ' mm, vapaa huonekorkeus ' + num(room) + ' mm.',
    'Tilavaraus 1 800 × ' + num(m.depth) + ' mm · kääntötason syvyydet 850 ja ' + num(m.landing) + ' mm.',
    m.n + ' + ' + m.n + ' nousua · nousu ' + num(m.rise,1) + ' mm · etenemä ' + going + ' mm · yläaskelman syvyys ' + m.treadDepth + ' mm.',
    'Kapeat askelmat ' + sideName + ' noustessa · alimman boksin päädyt vasen ' + endName[ends[0]] + ' / oikea ' + endName[ends[1]] + '.',
    opening ? 'Aukko ' + opening + ' · pituus alaboksin kohdalla ' + num(m[opening]) +
      ' mm · vapaa kulkukorkeus ' + headroomLabel(m,opening) + ' mm.' : 'Aukkovalinta avoin.'
  ];
  for (const [key,label] of [['leveys','Työmaan vapaa leveys'],['syvyys','Työmaan vapaa syvyys']]) {
    if (integer(key)>0) dimensions.push(label+' '+num(integer(key))+' mm.');
  }
  const rhythm = 2*m.rise+going;
  if(rhythm<620 || rhythm>640) dimensions.push('Askelrytmi '+num(rhythm)+' mm · '+
    (q.get('rytmi')==='kuitattu'?'poikkeama kuitattu suunnittelunäkymässä.':'KIDE tarkistaa poikkeaman suunnittelijan kanssa.'));
  const drawings = new URL('./',location.href);
  for(const key of ['kerroskorkeus','valipohja','katisyys','vasen','oikea','etenema','aukko','tyomaakorot','kerros','vapaaKorkeus','leveys','syvyys','huone']){
    if(q.has(key))drawings.searchParams.set(key,q.get(key));
  }
  drawings.hash='arkit';
  return {description:'Tilavaraus 1 800 × '+num(m.depth)+' mm. Kapeat askelmat '+sideName+
    (opening?'. Aukko '+opening+'.':'. Aukkovalinta avoin.'), dimensions:dimensions.join('\n'), drawings:drawings.href,
    valid:!opening || headroomOk(m,opening), model:m, right:side==='right'};
}

const design = readDesign(params);
el('glassData').hidden=!design;
if(design)showGlassDimensions(el('glassData'),design.model,design.right);
el('designSummary').textContent=design?.description || 'Pyydä arkkitehdilta voimassa oleva suunnittelulinkki, jotta mitat tulevat tarjouspyyntöön.';
el('quoteDimensions').textContent=design?.dimensions || '';
el('beamSize').textContent='120 × 120 mm';
if(Object.hasOwn(glossLabels,params.get('kiiltoaste')))el('steelGloss').value=params.get('kiiltoaste');
if(Object.hasOwn(colours,params.get('ral')))form.elements.steelRal.value=params.get('ral');

function refresh(){
  const chosen=el('quoteChosen').checked;
  el('quoteProductLabel').hidden=el('quoteProduct').disabled=!chosen;
  el('quoteProduct').required=chosen;
  const problem=!design?'Suunnitelman mitat puuttuvat. Avaa arkkitehdin antama linkki.':
    !design.valid?'Pyydä arkkitehtia tarkistamaan valitun aukon kulkukorkeus.':'';
  el('quoteIssue').textContent=problem;el('quoteIssue').hidden=!problem;el('quoteSend').disabled=!!problem;
  const gloss=glossLabels[el('steelGloss').value], ral=form.elements.steelRal.value;
  const coating=gloss && colours[ral] ? 'Teräspalkin maalaus · '+gloss+' · RAL '+ral+' · '+colours[ral] : '';
  el('quoteDesign').value=problem?'':[design.dimensions,'Koko portaikko asennettuna','Lasikaide hankitaan erikseen.',coating,
    'Avaa piirustukset samoilla mitoilla',design.drawings].filter(Boolean).join('\n');
  el('quotePreference').value=chosen?'Valittu parketti · '+el('quoteProduct').value.trim():el('quoteSuggest').checked?consultation:'';
}
let lastDraft='',reference='';
form.addEventListener('input',()=>{
  el('quoteContact').setCustomValidity('');el('quoteProduct').setCustomValidity('');refresh();
});
form.addEventListener('change',refresh);
form.addEventListener('submit',event=>{
  refresh();
  const contact=el('quoteContact'), value=contact.value.trim(), digits=value.replace(/\D/g,'').length;
  if(!(/^\+?[\d ().-]+$/.test(value)&&digits>=6&&digits<=15) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    contact.setCustomValidity('Anna sähköpostiosoite tai puhelinnumero.');
  if(el('quoteProduct').required&&!el('quoteProduct').value.trim())el('quoteProduct').setCustomValidity('Anna parketin nimi tai tuotekoodi.');
  if(el('quoteSend').disabled || !form.reportValidity()){event.preventDefault();return;}
  contact.value=value;
  const field=el('quoteDesign'), draft=JSON.stringify([field.value,el('quotePreference').value,value]);
  if(lastDraft!==draft){
    reference='KIDE-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
    lastDraft=draft;
  }
  field.value=reference+'\n'+field.value;
});
refresh();
