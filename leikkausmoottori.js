(function (root) {
  "use strict";
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const fmt = value => new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 2, useGrouping: false }).format(value);
  function measure(source, key, allowZero = false) {
    const value = source?.[key];
    if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0) || value > 20000)
      throw new Error("Tarkista lähtömitta " + key + ".");
    return value;
  }
  function generate(input) {
    if (input?.version !== 1) throw new Error("Käytä sahauslistan lähtötietopohjan versiota 1.");
    const { material, lower, landing, upper } = input;
    const t = measure(material, "thickness");
    const skin = measure(material, "skin");
    const gap = measure(material, "sideGap", true);
    const kerf = measure(material, "kerf", true);
    const stockLength = measure(material, "boardLength");
    const slim = measure(material, "narrowWidth");
    const wide = measure(material, "wideWidth");
    const capacities = new Map([[slim, measure(material, "narrowBoards")], [wide, measure(material, "wideBoards")]]);
    if (skin >= t || slim >= wide || [...capacities.values()].some(n => !Number.isInteger(n)))
      throw new Error("Tarkista varastolaudat ja pintasäleen paksuus.");

    const rows = [];
    const stock = new Map([[slim, 0], [wide, 0]]);
    const rebate = round(t - skin);
    const lowerCount = measure(lower, "tiers");
    const upperCount = measure(upper, "treads");
    if (![lowerCount, upperCount].every(n => Number.isInteger(n) && n <= 30))
      throw new Error("Askelmäärän on oltava 1–30.");
    const length = round(measure(lower, "osbWidth") - 2 * gap);
    const firstHeight = round(measure(lower, "floorToOsb") + rebate);
    const faceHeight = measure(lower, "regularFaceHeight");
    const narrowDepth = measure(lower, "narrowDepth");
    const visibleSide = lower.visibleSide;
    if (!["oikea", "vasen"].includes(visibleSide)) throw new Error("Valitse kapean askelman näkyvä sivu.");
    const nominalNarrow = measure(lower, "narrowOsbWidth") + t - gap;
    const narrowBlank = round(measure(lower, "largestNarrowOsbWidth") + t - gap + measure(lower, "narrowTrim", true));
    const rearLength = round(length - nominalNarrow);
    const lowerStrip = round(measure(lower, "lowerStripOpening") - t - gap);
    const rearDepth = round(measure(lower, "wideDepth") - wide);
    const coverSkin = "Huullokseen jää " + fmt(skin) + " mm ehjää pintasälettä.";
    const fitEnds = "Sovita päädyt kuivana ja vähennä mahdollinen päätyviilun lisä raakapituudesta.";
    function part(code, name, l, w, joint, work, kind = "Aihio") {
      return { code, name, length: round(l), width: round(w), thickness: t, joint, work, kind };
    }
    function assign(width, cuts) {
      let span = 0;
      for (const pieces of cuts) {
        for (const p of pieces) {
          if (!(p.length > 0 && p.width > 0)) throw new Error(p.code + " ei mahdu annettuihin lähtömittoihin.");
        }
        const usedWidth = pieces.reduce((sum, p) => sum + p.width, 0) + Math.max(0, pieces.length - 1) * kerf;
        if (usedWidth > width + 1e-8) throw new Error("Rinnakkaiset kaistat eivät mahdu " + fmt(width) + " mm:n lautaan.");
        span += Math.max(...pieces.map(p => p.length)) + kerf;
      }
      if (span > stockLength + 1e-8) throw new Error("Katkaisut eivät mahdu aihioon " + fmt(stockLength) + " mm.");
      const boardNumber = stock.get(width) + 1;
      if (boardNumber > capacities.get(width)) throw new Error(fmt(width) + " mm:n varastolautoja on liian vähän.");
      stock.set(width, boardNumber);
      const board = fmt(width) + "-" + String(boardNumber).padStart(2, "0");
      cuts.forEach((pieces, cut) => pieces.forEach((p, strip) => rows.push({ board, cut: cut + 1, strip: strip + 1, ...p })));
    }
    const numbers = limit => Array.from({ length: limit }, (_, i) => i + 1);
    function assignRuns(stockWidth, cuts, preferredCuts = 2) {
      let pack = [], span = 0;
      for (const cut of cuts) {
        const lengthInStock = Math.max(...cut.map(p => p.length)) + kerf;
        if (pack.length && (pack.length >= preferredCuts || span + lengthInStock > stockLength)) {
          assign(stockWidth, pack); pack = []; span = 0;
        }
        pack.push(cut); span += lengthInStock;
      }
      if (pack.length) assign(stockWidth, pack);
    }
    const side = n => part("KS", "Kapean askelman " + visibleSide + " sivupala " + n, narrowDepth-skin, faceHeight,
      "Poista ulkoneva kieli; varmista näkyvän pintasäleen korkeus. Peittoon jäävä ura tarkistetaan koepalalla.",
      "Sovita etupää KP:n huullokseen ja takapää seuraavaan verhottuun pystypintaan.", "Valmis tavoite");
    numbers(lowerCount).forEach(n => {
      const front = n === 1
        ? part("LP1", "Alin leveä etupala", length, firstHeight, "Etureuna kannen huulloksen alle.",
          "Mittaa C–D vasemmalta, keskeltä ja oikealta huulletulla kansikoepalalla. " + fitEnds, "Valmis tavoite")
        : part("VP", "Leveän etupalan yläkaista " + (n - 1), length, faceHeight-skin, "Yläkaistan alareuna VA:n liitokseen.",
          fitEnds, "Valmis tavoite");
      assign(slim, [[front], [side(n)]]);
    });

    const ratio = measure(upper, "pitchGoing") / measure(upper, "pitchRise");
    const beamWidth = measure(landing, "beamWidth");
    const beamGap = measure(landing, "beamGap", true);
    const near = measure(landing, "beamNearFromRight") - gap - beamGap;
    const far = near + beamWidth + 2 * beamGap;
    const beamX = measure(landing, "beamAtOsb");
    const seam = Math.ceil(beamX - t * ratio + beamGap - 1e-9);
    const firstStrip = round(seam + t);
    const middleStrips = measure(landing, "middleBoards");
    if (!Number.isInteger(middleStrips) || middleStrips > 10)
      throw new Error("Tasanteen kokoleveiden lautojen määrä on oltava 1–10.");
    const tail = round(measure(landing, "osbDepth") + t - gap - firstStrip - middleStrips * wide);
    const beamWork = "Palkin alue oikeasta päästä " + fmt(near) + "–" + fmt(far) + " mm.";
    assign(slim, [[part("VP-taso", "Tasanteen etupalan yläkaista", length, faceHeight-skin,
      "Sovita kaistojen liitos.", beamWork + " Tarkista OSB:stä mitattu lovikorko " +
      fmt(measure(landing, "beamOverOsb")) + " mm ja sovita palkkilovi.", "Valmis tavoite")]]);
    assign(slim, [[part("TA1 V", "Tasanteen etulauta, vasen", length-far, firstStrip, "Säilytä takapontti.",
      "Suora pää palkin sivuun. Etuhuullos koepalalla.")],
      [part("TA1 O", "Tasanteen etulauta, oikea", near, firstStrip, "Säilytä takapontti.",
      "Suora pää palkin sivuun. Etuhuullos koepalalla.")]]);
    assign(slim, [[part("TA5", "Tasanteen takalauta", length, tail, "Säilytä tehdaspontti edessä.",
      "Sovita takaseinään ja jätä sovittu rako.", "Valmis tavoite")]]);
    assignRuns(slim, numbers(lowerCount).map(n => [part("KP", "Kapean askelman etupala " + n, narrowBlank, faceHeight,
      "Etupalan päätyhuullos näkyvän sivun kohdalle. " + coverSkin,
      "Jätä pituus sovitukseen. Tee päätyhuullos vasta työmaalla tarkistetun katkaisun jälkeen.")]));
    assignRuns(slim, numbers(lowerCount).map(n => [part("VA", "Leveän etupalan alakaista " + n, lowerStrip, faceHeight,
      "Säilytä yläreunan liitospontti.", "Sovita näkyvä pää ja vähennä mahdollinen päätyviilun lisä.", "Valmis tavoite")]));

    const finishedUpper = round(measure(upper, "woodWidth") + measure(upper, "overhang", true) + t);
    const upperBlank = round(finishedUpper + measure(upper, "lengthTrim", true));
    const cladDepth = round(measure(upper, "woodDepth") + 2 * t);
    const upperFront = measure(upper, "frontStripDepth");
    const upperRear = round(cladDepth - upperFront);
    const upperFace = round(measure(upper, "pitchRise") - measure(upper, "gap") - 2 * skin);
    const shifts = upper.notchRiseByTread;
    if (!Array.isArray(shifts) || shifts.length !== upperCount || shifts.some(v => !Number.isFinite(v) || v < 0 || v > cladDepth))
      throw new Error("Anna vinopalkin korkosiirtymä jokaiselle yläaskelmalle.");
    const notchStart = measure(upper, "beamFromFinishedLeft");
    const notchEnd = notchStart + measure(upper, "beamWidth");
    const bottomDatum = measure(upper, "bottomBeamInnerDatum");
    const backDatum = measure(upper, "rearBeamInnerDatum");
    const notch = (n, bottom) => {
      const inner = (bottom ? bottomDatum : backDatum) + shifts[n - 1] * (bottom ? ratio : 1);
      const outer = inner + t * (bottom ? ratio : 1 / ratio);
      const start = bottom ? "takareunasta eteen" : "alareunasta ylöspäin";
      return "Mallin vinolovi " + start + ", sisäpinta " + fmt(round(inner)) + " mm, ulkopinta " +
        fmt(round(outer)) + " mm. Sivurajat " + fmt(notchStart) + "–" + fmt(notchEnd) +
        " mm vasemmalta. Kuivasovita kiinnitettyyn askelmaan.";
    };
    const frontPontti = "Säilytä urospontti pitkään takareunaan.";
    const rearPontti = "Säilytä naaraspontti pitkään etureunaan.";
    const upperFit = "Valmis pituustavoite " + fmt(finishedUpper) + " mm. Sovita päät koepalalla.";
    const reserve = measure(material, "narrowBoardReserve", true);
    if (!Number.isInteger(reserve)) throw new Error("Varalautojen määrän on oltava kokonaisluku.");
    const caps = numbers(upperCount).map(n => [part("YR-kansi", "Askelma " + n + " · kannen takakaista",
      upperBlank, upperRear, rearPontti, upperFit)]);
    assignRuns(slim, caps);
    const floors = numbers(upperCount).map(n => [part("YR-pohja-" + n, "Askelma " + n + " · pohjan takakaista",
      upperBlank, upperRear, rearPontti, notch(n, true))]);
    const cutsPerBoard = Math.min(2, Math.floor(stockLength / (upperBlank + kerf)));
    const narrowFree = Math.max(0, capacities.get(slim)-stock.get(slim)-reserve);
    const inNarrow = upperRear <= slim ? Math.min(floors.length, narrowFree*cutsPerBoard) : 0;
    assignRuns(slim, floors.slice(0, inNarrow));

    numbers(lowerCount).forEach(n => assign(wide, [[part("LA", "Leveän askelman etulauta " + n, length, wide,
      "Säilytä takapontti liitokseen.", "Sovita kapean askelman kohdalle takareunan lovi " + fmt(Math.max(0, wide-narrowDepth)) +
      " mm. Etuhuullos koepalalla.")]]));
    assignRuns(wide, numbers(lowerCount).map(n => [part("LB", "Leveän askelman takalauta " + n, rearLength, rearDepth,
      "Säilytä etureunan liitospontti.", "Sovita peittoleveys etulautaan.", "Valmis tavoite")]));
    assignRuns(wide, numbers(lowerCount).map(n => [part("KA", "Kapean askelman kansi " + n, narrowBlank, narrowDepth,
      "Tasoitettavien reunojen huullokset koepalalla. " + coverSkin, "Sovita lopullinen pituus työmaalla ennen päätyhuullosta.")]));
    assign(wide, [[part("TA2", "Tasanteen toinen kansilauta", length, wide, "Säilytä pontit.",
      beamWork + " Mallin sauma " + fmt(seam) + " mm ja viisteen alapää noin " + fmt(Math.round(seam+t*ratio)) +
      " mm OSB:n etureunasta. Jätä viiste sovitukseen.")]]);
    for (let n=3; n<=middleStrips+1; n++) assign(wide, [[part("TA34", "Tasanteen kansilauta " + n, length, wide,
      "Säilytä pitkät liitospontit.", fitEnds)]]);
    for (const bottom of [true, false]) {
      const cuts = numbers(upperCount).map(n => [
        part("YF", "Askelma " + n + (bottom ? " · pohjan etukaista" : " · kannen etukaista"),
          upperBlank, upperFront, frontPontti, upperFit),
        part(bottom ? "YE-etu" : "YE-taka-"+n, "Askelma "+n+(bottom ? " · pystyetupala" : " · pystytakapala"),
          upperBlank, upperFace, "Sovita pää oikean päätypalan viilun taakse.", bottom ? upperFit : notch(n, false))
      ]);
      for (let i=0; i<cuts.length; i+=2) {
        const pair=cuts.slice(i,i+2);
        const edge=part("YS", "Oikea päätypala · askelma "+(bottom ? i+1 : i+2), cladDepth, upperFace,
          "Taustahuullos molempiin päihin. "+coverSkin, "Sovita päädyistä koepalalla.", "Valmis tavoite");
        const hasEdge=bottom || pair.length===2;
        if (pair.length*(upperBlank+kerf)+(hasEdge ? cladDepth+kerf : 0) <= stockLength)
          assign(wide, hasEdge ? [...pair,[edge]] : pair);
        else {
          assignRuns(wide,pair);
          if(hasEdge) assign(wide,[[edge]]);
        }
      }
    }
    assignRuns(wide,floors.slice(inNarrow));
    return { rows, boards: Object.fromEntries(stock), stockLength };
  }
  if (typeof module === "object" && module.exports) module.exports = { generate };
  else root.PorrasLeikkaus = { generate };
})(typeof globalThis === "object" ? globalThis : this);