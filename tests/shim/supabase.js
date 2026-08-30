/* Test double for the Supabase REST layer.

   Implements the same eight functions supabase-setup.sql defines, with the
   same jsonb_set semantics — including the detail that jsonb_set does NOT
   create missing intermediate parents — so a mismatch between the SQL and
   the client shows up here rather than in a classroom. State lives in Node,
   shared by every tab, exactly like the real thing. */
const STORE = { games: {}, states: {}, deals: {}, seq: 0, stamp: 0 };

function bump() { return ++STORE.stamp; }

// mirrors: d := jsonb_set(d, string_to_array(k,'.'), v, true)
function jsonbSet(doc, dotted, value) {
  const parts = String(dotted).split('.');
  let node = doc;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    if (node === null || typeof node !== 'object' || !(seg in node)) return doc; // no parent, no-op
    node = node[seg];
  }
  if (node === null || typeof node !== 'object') return doc;
  node[parts[parts.length - 1]] = value;
  return doc;
}

function applyPatch(doc, patch) {
  Object.keys(patch).forEach(k => {
    if (k.includes('.')) jsonbSet(doc, k, patch[k]);
    else doc[k] = patch[k];
  });
  return doc;
}

const FN = {
  aoc_create_game({ p_code, p_game, p_states }) {
    STORE.games[p_code] = { data: JSON.parse(JSON.stringify(p_game)), t: bump() };
    STORE.states[p_code] = {};
    p_states.forEach(s => {
      STORE.states[p_code][s.name] = { data: JSON.parse(JSON.stringify(s)), t: bump() };
    });
    STORE.deals[p_code] = [];
    return p_code;
  },
  aoc_patch_game({ p_code, p_patch }) {
    const row = STORE.games[p_code];
    if (!row) return null;
    row.data = applyPatch(row.data, JSON.parse(JSON.stringify(p_patch)));
    row.t = bump();
    return row.data;
  },
  aoc_patch_state({ p_code, p_name, p_patch }) {
    const row = (STORE.states[p_code] || {})[p_name];
    if (!row) return null;
    row.data = applyPatch(row.data, JSON.parse(JSON.stringify(p_patch)));
    row.t = bump();
    return row.data;
  },
  aoc_patch_states({ p_code, p_updates }) {
    p_updates.forEach(u => FN.aoc_patch_state({ p_code, p_name: u.name, p_patch: u.patch }));
    return null;
  },
  aoc_push_deal({ p_code, p_deal }) {
    (STORE.deals[p_code] = STORE.deals[p_code] || [])
      .push({ id: ++STORE.seq, t: bump(), data: JSON.parse(JSON.stringify(p_deal)) });
    return null;
  },
  aoc_replace_deals({ p_code, p_deals }) {
    // Rows are deleted and re-inserted, so each one carries a fresh
    // updated_at — which is what moves the pulse even when the count is
    // unchanged. The SQL gets this from `default now()`.
    STORE.deals[p_code] = p_deals.map(d =>
      ({ id: ++STORE.seq, t: bump(), data: JSON.parse(JSON.stringify(d)) }));
    return null;
  },
  aoc_snapshot({ p_code }) {
    const g = STORE.games[p_code];
    const st = STORE.states[p_code] || {};
    return {
      game: g ? g.data : null,
      states: Object.keys(st).sort().map(n => st[n].data),
      deals: (STORE.deals[p_code] || []).sort((a, b) => a.id - b.id).map(d => d.data)
    };
  },
  aoc_pulse({ p_code }) {
    if (!STORE.games[p_code]) return 'empty';
    let t = STORE.games[p_code].t, n = 1;
    Object.values(STORE.states[p_code] || {}).forEach(r => { t = Math.max(t, r.t); n++; });
    (STORE.deals[p_code] || []).forEach(r => { t = Math.max(t, r.t); n++; });
    return t + ':' + n;
  }
};

const TEST_CFG = {
  backend: 'supabase',
  // key length matters: the client treats a short one as unconfigured
  supabase: { url: 'https://test.supabase.co',
              anonKey: 'test-anon-key-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
  firebase: {}
};

/** Install onto a Playwright BrowserContext. */
async function install(ctx, cfg) {
  const config = Object.assign({}, TEST_CFG, cfg || {});
  await ctx.route('**/assets/config.js', r =>
    r.fulfill({ contentType: 'application/javascript',
                body: 'window.AOC_CONFIG = ' + JSON.stringify(config) + ';' }));

  await ctx.route('https://test.supabase.co/rest/v1/rpc/*', async r => {
    const fn = r.request().url().split('/').pop();
    if (!FN[fn]) return r.fulfill({ status: 404, body: 'no function ' + fn });
    let args = {};
    try { args = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    const out = FN[fn](args);
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out ?? null) });
  });
}

module.exports = { install, STORE, FN };
