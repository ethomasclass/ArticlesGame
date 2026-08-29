/* Minimal Firestore stand-in backed by localStorage so two tabs in one
   browser context really do sync. Test-only. */
const KEY = "__fsdb__";
const read  = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e){ return {}; } };
const write = (o) => { localStorage.setItem(KEY, JSON.stringify(o));
                       window.dispatchEvent(new Event("__fslocal__")); };

export function getFirestore(){ return { __db:true }; }
export function doc(db, ...seg){ return { path: seg.join("/"), type:"doc" }; }
export function collection(db, ...seg){ return { path: seg.join("/"), type:"col" }; }
export function serverTimestamp(){ return Date.now(); }
export function arrayUnion(...vals){ return { __arrayUnion: vals }; }

function snapOf(path){
  const d = read()[path];
  return { exists: () => d !== undefined, data: () => d, id: path.split("/").pop() };
}
export async function getDoc(ref){ return snapOf(ref.path); }

function childrenOf(colPath){
  const db = read(), depth = colPath.split("/").length + 1, out = [];
  for (const p in db) {
    if (p.startsWith(colPath + "/") && p.split("/").length === depth) {
      out.push({ id: p.split("/").pop(), data: () => db[p], exists: () => true });
    }
  }
  return out;
}
export async function getDocs(ref){ const docs = childrenOf(ref.path); return { docs, size: docs.length }; }

function applyPatch(target, patch){
  for (const k in patch) {
    const v = patch[k];
    if (v && v.__arrayUnion) {
      const cur = Array.isArray(target[k]) ? target[k].slice() : [];
      v.__arrayUnion.forEach(x => { if (!cur.some(y => JSON.stringify(y)===JSON.stringify(x))) cur.push(x); });
      target[k] = cur;
    } else if (k.includes(".")) {
      const parts = k.split("."); let o = target;
      for (let i=0;i<parts.length-1;i++){ if (typeof o[parts[i]] !== "object" || o[parts[i]]===null) o[parts[i]] = {}; o = o[parts[i]]; }
      o[parts[parts.length-1]] = v;
    } else target[k] = v;
  }
  return target;
}
export async function setDoc(ref, data){ const db = read(); db[ref.path] = JSON.parse(JSON.stringify(data)); write(db); }
export async function updateDoc(ref, patch){
  const db = read();
  if (db[ref.path] === undefined) throw new Error("No document to update: " + ref.path);
  db[ref.path] = applyPatch(db[ref.path], JSON.parse(JSON.stringify(patch, (k,v)=> v && v.__arrayUnion ? v : v)));
  write(db);
}
export async function deleteDoc(ref){ const db = read(); delete db[ref.path]; write(db); }

export function writeBatch(){
  const ops = [];
  return {
    set:(ref,data)=>ops.push({t:"set",ref,data}),
    update:(ref,patch)=>ops.push({t:"update",ref,patch}),
    commit: async () => {
      const db = read();
      for (const o of ops) {
        if (o.t==="set") db[o.ref.path] = JSON.parse(JSON.stringify(o.data));
        else { if (db[o.ref.path]===undefined) throw new Error("No document: "+o.ref.path);
               db[o.ref.path] = applyPatch(db[o.ref.path], o.patch); }
      }
      write(db);
    }
  };
}

export function onSnapshot(ref, cb){
  let last = null;
  const fire = () => {
    const cur = ref.type === "col"
      ? JSON.stringify(childrenOf(ref.path).map(d=>d.data()))
      : JSON.stringify(read()[ref.path] ?? null);
    if (cur === last) return;
    last = cur;
    if (ref.type === "col") { const docs = childrenOf(ref.path); cb({ docs, size: docs.length }); }
    else cb(snapOf(ref.path));
  };
  fire();
  const iv = setInterval(fire, 90);
  window.addEventListener("storage", fire);
  window.addEventListener("__fslocal__", fire);
  return () => { clearInterval(iv); window.removeEventListener("storage", fire);
                 window.removeEventListener("__fslocal__", fire); };
}
