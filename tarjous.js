'use strict';

// Yläaskelma on piirustuksessa ja IFC-mallissa valmis 850 mm leveä kotelo.
// Nämä ovat näkyvien pintojen projektioita. Ne eivät sisällä pontti- tai sahausvaraa.
function upperSupplyGroups(m) {
  const count = m.n - 1;
  const width = 850;
  const surfaces = 2 * count;
  const squareMetres = height => num(surfaces * width * height / 1e6, 2);
  return [
    {
      key: 'upper', title: 'Yläaskelmien puuosat ja parketit',
      rows: [
        ['Puurunko, puulevy ja kehikko', 'Valmiin askelman ulkomitta ' + num(width) + ' × ' + num(m.treadDepth) + ' mm', count, 'askelmasarjaa'],
        ['Parketti, kansi ja pohja', surfaces + ' pintaa', squareMetres(m.treadDepth), 'm² netto'],
        ['Parketti, etu- ja takapinta', surfaces + ' pintaa · kotelon korkeus noin ' + num(m.box) + ' mm', squareMetres(m.box), 'm² netto'],
        ['Yläaskelmien päätyverhous', 'Näkyvät päädyt vahvistetaan kohteessa', 'Avoin', '']
      ],
      note: 'KIDE tarkentaa puuosien aihiomitat, päätypinnat ja parkettipaketit valitun tuotteen, ponttien ja sahausjaon perusteella.'
    },
    {
      key: 'steel', title: 'Yläsyöksyn metallirunko ja askelkannakkeet',
      rows: [
        ['Metallirunko', 'Yläsyöksyn vaakapituus ' + num(m.run) + ' mm · tasanteelta ylälattiaan noin ' + num(m.H / 2) + ' mm', 1, 'kokonaisuus'],
        ['Askelkannakkeet', 'Yksi kiinnityskohta kutakin yläaskelmaa kohti', count, 'kannakepaikkaa']
      ],
      note: 'Metallitoimittaja hinnoittelee rungon ja kannakkeet. Profiili, levypaksuudet, kiinnitystapa ja teräksen määrä vahvistetaan rakennesuunnitelmasta.'
    }
  ];
}

function supplyGroupHtml(group) {
  const rows = group.rows.map(([part, description, quantity, unit]) =>
    '<tr><td><b>' + part + '</b><small>' + description + '</small></td><td>' + quantity + ' ' + unit + '</td></tr>');
  return '<h3>' + group.title + '</h3><table class="materialTable"><thead><tr><th>Tarjottava osa</th><th>Määrä</th></tr></thead><tbody>' +
    rows.join('') + '</tbody></table><small>' + group.note + '</small>';
}

function quoteDimensions(m, checks) {
  const measured = el('measured').checked;
  const lines = [
    (measured ? 'Työmaalla mitattu' : 'Suunnittelumitta') + ' · kerroskorkeus ' + num(m.H) +
      ' mm, välipohja ' + num(m.floor) + ' mm, vapaa huonekorkeus ' + num(m.room) + ' mm.',
    'Tilavaraus 1 800 × ' + num(m.depth) + ' mm · kääntötason syvyydet 850 ja ' + num(m.landing) + ' mm.',
    m.n + ' + ' + m.n + ' nousua · nousu ' + num(m.rise, 1) + ' mm · etenemä ' + m.going +
      ' mm · yläaskelman syvyys ' + m.treadDepth + ' mm.',
    'Kapeat askelmat ' + (el('hand').value === 'right' ? 'oikealla' : 'vasemmalla') +
      ' noustessa · alimman boksin päädyt ' + sheetEndSelection() + '.'
  ];
  const opening = el('choice').value;
  lines.push(opening ? 'Aukko ' + opening + ' · pituus alaboksin kohdalla ' + num(m[opening]) +
    ' mm · vapaa kulkukorkeus ' + headroomLabel(m, opening) + ' mm. ' + headroomWarning(m, opening) : 'Aukkovalinta avoin.');
  for (const [id, label] of [['siteW', 'Työmaan vapaa leveys'], ['siteD', 'Työmaan vapaa syvyys']]) {
    const value = readField(id);
    if (Number.isInteger(value) && value > 0) lines.push(label + ' ' + num(value) + ' mm.');
  }
  return lines.concat(checks).join('\n');
}

let quoteBasis = null;
let quoteProblem = '';

function setQuoteBasis(basis, problem = '') {
  quoteBasis = basis;
  quoteProblem = problem;
  refreshQuote();
}

function refreshQuote() {
  const scopes = [...el('quoteScopes').querySelectorAll('input:checked')].map(input => input.value);
  const wood = scopes.some(key => key === 'lower' || key === 'upper');
  const chosen = wood && el('quoteChosen').checked;
  el('quoteParquet').hidden = el('quoteParquet').disabled = !wood;
  el('quoteProductLabel').hidden = el('quoteProduct').disabled = !chosen;
  el('quoteProduct').required = chosen;
  const problem = !quoteBasis ? quoteProblem : !scopes.length ? 'Valitse vähintään yksi toimituserä.' :
    scopes.includes('lower') && !quoteBasis.lower ? 'Tarkista alaboksin pintakerrokset, levyaihio ja hukkavara ostolistalta.' : '';
  el('quoteIssue').textContent = problem;
  el('quoteIssue').hidden = !problem;
  el('quoteSend').disabled = Boolean(problem) || !quoteBasis;
  const groups = quoteBasis ? [quoteBasis.lower, ...quoteBasis.extra].filter(g => g && scopes.includes(g.key)) : [];
  const summary = groups.map(g => [
    g.title,
    ...g.rows.map(([part, detail, qty, unit]) => part + ' · ' + qty + (unit ? ' ' + unit : '') + ' · ' + detail),
    g.note
  ].join('\n'));
  const preview = problem || !quoteBasis ? '' : [quoteBasis.dimensions, ...summary].join('\n\n');
  el('quotePreview').textContent = preview;
  el('quoteMaterials').value = preview && quoteBasis.link ? preview + '\n\nAvaa piirustukset samoilla mitoilla\n' + quoteBasis.link : preview;
  el('quotePreference').value = !wood ? 'Vain metallitoimitus' : chosen ? 'Valittu parketti · ' + el('quoteProduct').value.trim() :
    el('quoteSuggest').checked ? 'Pyydän KIDEn tuote-ehdotusta' : '';
}

function initQuoteForm() {
  const form = el('quoteForm');
  const contact = el('quoteContact'), product = el('quoteProduct');
  let lastDraft = '', reference = '';
  form.addEventListener('input', () => {
    contact.setCustomValidity('');
    product.setCustomValidity('');
    refreshQuote();
  });
  form.addEventListener('submit', event => {
    refreshQuote();
    const reply = contact.value.trim();
    const digits = reply.replace(/\D/g, '');
    const phone = /^\+?[\d ().-]+$/.test(reply) && digits.length >= 6 && digits.length <= 15;
    if (!phone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply))
      contact.setCustomValidity('Anna sähköpostiosoite tai puhelinnumero suuntanumeroineen.');
    if (product.required && !product.value.trim()) product.setCustomValidity('Kirjoita valitun parketin nimi tai tuotekoodi.');
    if (el('quoteSend').disabled || !form.reportValidity()) {
      event.preventDefault();
      return;
    }
    contact.value = reply;
    const materials = el('quoteMaterials');
    const draft = JSON.stringify([materials.value, el('quotePreference').value, reply]);
    if (draft !== lastDraft) {
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      reference = 'KIDE-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      lastDraft = draft;
    }
    materials.value = reference + '\n' + materials.value;
    // Selain näyttää vastaanottavan palvelun oman kuittauksen vasta tallennuksen jälkeen.
  });
}
