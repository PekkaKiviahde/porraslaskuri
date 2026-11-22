// Standalone IFC4 design model. Coordinates and length properties use millimetres.
function stairIfc(m, right, opening, endPanelsArray) {
  const entities = [];
  function add(type, fields) {
    entities.push('#' + (entities.length + 1) + '=' + type + '(' + fields + ');');
    return '#' + entities.length;
  }
  function str(s) {
    return "'" + s.replaceAll("'", "''").replace(/[^\x20-\x7e]/g, ch =>
      '\\X2\\' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0') + '\\X0\\') + "'";
  }
  function real(v) {
    if (!Number.isFinite(v)) throw new Error('IFC-mitta puuttuu');
    const s = String(Number(v.toFixed(8)));
    return s.includes('.') ? s : s + '.';
  }
  function guid() {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let n = 0n;
    for (const b of bytes) n = n * 256n + BigInt(b);
    let s = '';
    for (let i = 0; i < 22; i++, n >>= 6n) s = alphabet[Number(n & 63n)] + s;
    return str(s);
  }
  const point = (...xyz) => add('IFCCARTESIANPOINT', '(' + xyz.map(real).join(',') + ')');
  const origin = add('IFCAXIS2PLACEMENT3D', point(0, 0, 0) + ',$,$');
  const placement = add('IFCLOCALPLACEMENT', '$,' + origin);
  const vertical = add('IFCDIRECTION', '(0.,0.,1.)');
  const context = add('IFCGEOMETRICREPRESENTATIONCONTEXT', "$,'Model',3,0.001," + origin + ',$');
  const length = add('IFCSIUNIT', '*,.LENGTHUNIT.,.MILLI.,.METRE.');
  const angle = add('IFCSIUNIT', '*,.PLANEANGLEUNIT.,$,.RADIAN.');
  const units = add('IFCUNITASSIGNMENT', '(' + [length,angle].join(',') + ')');
  const project = add('IFCPROJECT', [guid(), '$', str('Portaikon tilavaraus'), '$,$,$,$', '('+context+')', units]);
  const building = add('IFCBUILDING', [guid(), '$', str('Rakennus'), '$,$', placement, '$,$,.ELEMENT.,$,$,$']);
  const storey = add('IFCBUILDINGSTOREY', [guid(), '$', str('Alakerta'), '$,$', placement, '$,$,.ELEMENT.,0.']);
  function aggregate(parent, children) {
    add('IFCRELAGGREGATES', [guid(), '$,$,$', parent, '('+children.join(',')+')']);
  }
  aggregate(project, [building]);
  aggregate(building, [storey]);
  const stair = add('IFCSTAIR', [guid(), '$', str('Alaboksiportaat'), str('Arkkitehdin tilavarausluonnos'), '$', placement, '$,$,.HALF_TURN_STAIR.']);
  const rep = (items, name='Body', type='SweptSolid') => {
    const shape = add('IFCSHAPEREPRESENTATION', [context, str(name), str(type), '('+items.join(',')+')']);
    return add('IFCPRODUCTDEFINITIONSHAPE', '$,$,('+shape+')');
  };
  // x from the left when ascending the lower flight; y=0 at the back wall.
  function solid(x, distance, z, width, depth, height) {
    const profile = add('IFCRECTANGLEPROFILEDEF', ['.AREA.,$,$', real(width), real(depth)]);
    const pos = add('IFCAXIS2PLACEMENT3D', point(x+width/2, -distance-depth/2, z) + ',$,$');
    return add('IFCEXTRUDEDAREASOLID', [profile, pos, vertical, real(height)]);
  }
  const lower = [], upper = [];
  for (let i=1; i<m.n; i+=2) {
    const back = m.depth-(i+1)*m.going;
    lower.push(solid(0, back, 0, 1800, 2*m.going, i*m.rise));
    lower.push(solid(right ? 950 : 0, back, i*m.rise, 850, m.going, m.rise));
  }
  for (let i=1; i<m.n; i++) {
    upper.push(solid(right ? 0 : 950, 850+(i-1)*m.going, (m.n+i)*m.rise-m.box, 850, m.treadDepth, m.box));
  }
  function flight(name, solids) {
    return add('IFCSTAIRFLIGHT', [guid(), '$', str(name), '$,$', placement, rep(solids), '$', m.n, m.n-1, real(Math.round(m.rise*10)/10), real(m.going), '.STRAIGHT.']);
  }
  const landing = add('IFCSLAB', [guid(), '$', str('Kääntötason tilavaraus'), '$,$', placement,
    rep([solid(0, 0, 0, 1800, m.landing, m.H/2)]), '$,.LANDING.']);
  aggregate(stair, [flight('Alaboksi', lower), landing, flight('Yläsyöksy', upper)]);
  const contained = [stair];
  function prop(name, value) {
    return add('IFCPROPERTYSINGLEVALUE', [str(name), '$', value, '$']);
  }
  const props = [];
  function measurement(name, value) {
    props.push(prop(name, 'IFCLENGTHMEASURE('+real(name==='Nousu'?Math.round(value*10)/10:Math.round(value))+')'));
  }
  for (const [name, value] of Object.entries({
    Kerroskorkeus:m.H, VälipohjanPaksuus:m.floor, VapaaHuonekorkeus:m.room,
    Nousu:m.rise, Etenemä:m.going, Askelsyvyys:m.treadDepth, Limitys:m.overlap,
    TilavarauksenLeveys:1800, TilavarauksenSyvyys:m.depth
  })) measurement(name,value);
  props.push(prop('Kapeiden askelmien puoli noustessa', 'IFCLABEL('+str(right?'Oikea':'Vasen')+')'));
  for (const p of endPanelsArray) {
    props.push(prop(p.name+' pääty', 'IFCLABEL('+str(({yes:'Kyllä', no:'Ei'})[p.state] || 'Avoin')+')'));
  }
  props.push(prop('Aukkovalinta', 'IFCLABEL('+str(opening || 'Avoin')+')'));
  // An annotation marks the selected finished opening without inventing floor extents.
  if (opening === 'A' || opening === 'B') {
    const e = m[opening];
    measurement('Aukon pituus alaboksin kohdalla', e);
    measurement('Vapaa kulkukorkeus aukon reunalla', m.head(e));
    const outline = opening==='A' ? [[0,0],[1800,0],[1800,e],[0,e]] :
      [[0,0],[1800,0],[1800,m.A],[850,m.A],[850,e],[0,e]];
    const pts = outline.map(([x,d])=>point(right?1800-x:x,-d,m.H));
    const curve = add('IFCPOLYLINE', '('+[...pts,pts[0]].join(',')+')');
    contained.push(add('IFCANNOTATION', [guid(),'$',str('Aukon '+opening+' reunaviiva'),'$,$',placement,rep([curve],'FootPrint','Curve3D')]));
  }
  const pset = add('IFCPROPERTYSET', [guid(), '$', str('Porras_Tilavaraus'), '$', '('+props.join(',')+')']);
  add('IFCRELDEFINESBYPROPERTIES', [guid(), '$,$,$', '('+stair+')', pset]);
  add('IFCRELCONTAINEDINSPATIALSTRUCTURE', [guid(), '$,$,$', '('+contained.join(',')+')', storey]);
  return ["ISO-10303-21;", "HEADER;", "FILE_DESCRIPTION(('Arkkitehdin tilavaraus'),'2;1');",
    "FILE_NAME('portaikko.ifc','"+new Date().toISOString().slice(0,19)+"',(''),(''),'Porraslaskuri','Porraslaskuri','');",
    "FILE_SCHEMA(('IFC4'));", "ENDSEC;", "DATA;", ...entities, "ENDSEC;", "END-ISO-10303-21;", ""].join('\n');
}
