const NM = '/home/user/ArticlesGame/node_modules/';
const topo = require(NM + 'us-atlas/states-10m.json');
const { feature, merge } = require(NM + 'topojson-client');
const d3 = require(NM + 'd3-geo');

const fc = feature(topo, topo.objects.states);
const geomOf = n => topo.objects.states.geometries.find(g => g.properties.name === n);

// 1786 boundaries: Maine was a district of Massachusetts; West Virginia was Virginia.
const GROUPS = {
  "New Hampshire":["New Hampshire"], "Massachusetts":["Massachusetts","Maine"],
  "Rhode Island":["Rhode Island"], "Connecticut":["Connecticut"], "New York":["New York"],
  "New Jersey":["New Jersey"], "Pennsylvania":["Pennsylvania"], "Delaware":["Delaware"],
  "Maryland":["Maryland"], "Virginia":["Virginia","West Virginia"],
  "North Carolina":["North Carolina"], "South Carolina":["South Carolina"], "Georgia":["Georgia"]
};
const NEUTRAL = { "Vermont":["Vermont"] };
const combine = names => names.length === 1
  ? feature(topo, geomOf(names[0])).geometry
  : merge(topo, names.map(geomOf));

const all = {};
Object.entries(GROUPS).forEach(([k,v]) => all[k] = combine(v));
Object.entries(NEUTRAL).forEach(([k,v]) => all[k] = combine(v));

// Map on the left, ocean on the right for callout chips.
const MAP_W = 700, H = 950, W = 1000;
const collection = { type:"FeatureCollection",
  features: Object.values(all).map(g => ({ type:"Feature", geometry:g, properties:{} })) };
const proj = d3.geoConicConformal().parallels([33,45]).rotate([76,0])
  .fitExtent([[24,26],[MAP_W-14, H-26]], collection);

const ringArea = r => { let a=0; for (let i=0,n=r.length;i<n;i++){ const [x1,y1]=r[i],[x2,y2]=r[(i+1)%n]; a+=x1*y2-x2*y1; } return Math.abs(a/2); };

function project(geom) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const rings = [];
  polys.forEach(poly => poly.forEach(ring => {
    const pts = []; let last = null;
    ring.forEach(c => {
      const p = proj(c); if (!p || !isFinite(p[0]) || !isFinite(p[1])) return;
      const x = Math.round(p[0]*10)/10, y = Math.round(p[1]*10)/10;
      if (last && Math.abs(x-last[0]) < 0.35 && Math.abs(y-last[1]) < 0.35) return;
      pts.push([x,y]); last = [x,y];
    });
    if (pts.length >= 4 && ringArea(pts) >= 7) rings.push(pts);
  }));
  return rings;
}

const inRing = (pt, ring) => {
  let c = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [xi,yi]=ring[i],[xj,yj]=ring[j];
    if (((yi>pt[1])!==(yj>pt[1])) && (pt[0] < (xj-xi)*(pt[1]-yi)/(yj-yi)+xi)) c = !c;
  }
  return c;
};
const distToRing = (pt, ring) => {
  let m = Infinity;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [x1,y1]=ring[i],[x2,y2]=ring[j];
    const dx=x2-x1, dy=y2-y1, L=dx*dx+dy*dy;
    let t = L ? ((pt[0]-x1)*dx + (pt[1]-y1)*dy)/L : 0;
    t = Math.max(0, Math.min(1, t));
    const ddx = pt[0]-(x1+t*dx), ddy = pt[1]-(y1+t*dy);
    m = Math.min(m, Math.sqrt(ddx*ddx+ddy*ddy));
  }
  return m;
};

// "Pole of inaccessibility": the interior point furthest from any edge. Beats a
// centroid, which can land in a bay or outside a curved state entirely.
function anchor(rings, preferBox) {
  let cands = rings.slice().sort((a,b) => ringArea(b) - ringArea(a));
  if (preferBox) {
    const inBox = cands.filter(r => {
      const cx = r.reduce((s,p)=>s+p[0],0)/r.length, cy = r.reduce((s,p)=>s+p[1],0)/r.length;
      return cx>=preferBox[0] && cx<=preferBox[2] && cy>=preferBox[1] && cy<=preferBox[3];
    });
    if (inBox.length) cands = inBox;
  }
  const ring = cands[0];
  const xs = ring.map(p=>p[0]), ys = ring.map(p=>p[1]);
  const x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  let best=null, bestD=-1;
  for (let s=0;s<26;s++) for (let t=0;t<26;t++){
    const p = [x0+(x1-x0)*(s+0.5)/26, y0+(y1-y0)*(t+0.5)/26];
    if (!inRing(p, ring)) continue;
    const d = distToRing(p, ring);
    if (d > bestD){ bestD = d; best = p; }
  }
  return best ? [Math.round(best[0]*10)/10, Math.round(best[1]*10)/10, Math.round(bestD)] : null;
}

// Massachusetts' largest ring is the Maine district; anchor on the mainland
// around Boston instead, which is what students read as "Massachusetts".
const PREFER = { "Massachusetts": [500, 300, 700, 380] };

// Cramped states get a chip out in the Atlantic with a leader line.
const CHIPS = ["New Hampshire","Massachusetts","Rhode Island","Connecticut","New Jersey","Delaware","Maryland"];

const result = {};
const bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
Object.entries(all).forEach(([name, geom]) => {
  const rings = project(geom);
  const a = anchor(rings, PREFER[name]);
  rings.forEach(r => r.forEach(([x, y]) => {
    if (x < bounds.x0) bounds.x0 = x;  if (x > bounds.x1) bounds.x1 = x;
    if (y < bounds.y0) bounds.y0 = y;  if (y > bounds.y1) bounds.y1 = y;
  }));
  result[name] = {
    d: rings.map(r => "M" + r.map(p=>p[0]+","+p[1]).join("L") + "Z").join(""),
    ax: a[0], ay: a[1], room: a[2],
    neutral: !!NEUTRAL[name]
  };
});

// The seaboard is a long diagonal, so the projected shape never fills its
// box. Hug the actual land instead of the fitted rectangle, or the map
// renders small with oceans of dead space on a projector.
const CHIP_W = 186, GUTTER = 34, PAD = 14;
const chipX = Math.round(bounds.x1 + GUTTER);
// Spread the chips evenly down the land's own vertical run.
const span = bounds.y1 - bounds.y0;
const n = CHIPS.length;
// Order the chips by how far north the state actually is, so the leader
// lines fan out instead of crossing each other.
CHIPS.sort((a, b) => result[a].ay - result[b].ay);
CHIPS.forEach((name, i) => {
  result[name].chipX = chipX;
  result[name].chipY = Math.round(bounds.y0 + span * (0.045 + 0.895 * (i / (n - 1))));
});

const vb = {
  x: Math.round(bounds.x0 - PAD),
  y: Math.round(bounds.y0 - PAD),
  w: Math.round((chipX + CHIP_W + PAD) - (bounds.x0 - PAD)),
  h: Math.round((bounds.y1 + PAD) - (bounds.y0 - PAD))
};
const out = { viewBox: vb.x + " " + vb.y + " " + vb.w + " " + vb.h,
              width: vb.w, height: vb.h, states: result };
const json = JSON.stringify(out);
require('fs').writeFileSync('/home/user/ArticlesGame/assets/map-data.js',
  "/* Generated from us-atlas (US Census cartographic boundaries), projected with\n" +
  "   d3-geo conic conformal. 1786 borders: Maine is part of Massachusetts and\n" +
  "   West Virginia is part of Virginia. Vermont is drawn but was not a state.\n" +
  "   Regenerate with tools/build-map.js. */\n" +
  "window.AOC_MAP = " + json + ";\n");
console.log("bytes:", json.length, "| viewBox:", out.viewBox,
  "| aspect:", (vb.w/vb.h).toFixed(2));
Object.entries(result).forEach(([k,v]) =>
  console.log("  " + k.padEnd(15), "anchor", (v.ax+","+v.ay).padEnd(13), "clearance", String(v.room).padStart(3),
    v.chipX ? "chip" : ""));
