'use strict';

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

const ICONS = {
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  crosshair: '<circle cx="12" cy="12" r="10"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/>',
  sparkles: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 3v4M17 5h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  vote: '<path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/>',
  crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  rain: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 14v6M8 14v6M12 16v6"/>',
  snow: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); el.removeAttribute('data-icon'); }); }

let toastTimer;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { action.fn(); t.classList.remove('show'); };
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 6000 : 3200);
}

async function fetchTimeout(url, opts = {}, ms = 15000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); } finally { clearTimeout(timer); }
}

/* ---------- food vocabulary ---------- */
// Each group is something a person might type. Aliases are matched against OSM cuisine tags
// (e.g. "fried_chicken", "pizza;italian") and against restaurant names.
const GROUPS = [
  { k: 'pizza', a: ['pizza', 'pizzeria', 'italian pizza'], meal: { s: 'pizza' } },
  { k: 'burgers', a: ['burger', 'hamburger'], meal: { s: 'burger' } },
  { k: 'tacos', a: ['taco', 'taqueria'], meal: { s: 'taco' } },
  { k: 'mexican', a: ['tex-mex', 'tex mex', 'taco', 'taqueria', 'burrito', 'quesadilla', 'latin american'], meal: { a: 'Mexican' } },
  { k: 'chinese', a: ['dim sum', 'dumpling', 'szechuan', 'sichuan', 'cantonese', 'hunan'], meal: { a: 'Chinese' } },
  { k: 'sushi', a: ['poke'], meal: { s: 'sushi' } },
  { k: 'ramen', a: [], meal: { s: 'ramen' } },
  { k: 'japanese', a: ['sushi', 'ramen', 'udon', 'teriyaki', 'izakaya', 'hibachi'], meal: { a: 'Japanese' } },
  { k: 'thai', a: [], meal: { a: 'Thai' } },
  { k: 'indian', a: ['curry', 'tandoori', 'biryani', 'nepalese', 'pakistani'], meal: { a: 'Indian' } },
  { k: 'italian', a: ['pasta', 'trattoria'], meal: { a: 'Italian' } },
  { k: 'korean', a: ['korean bbq', 'bibimbap'], meal: { a: 'South Korean' } },
  { k: 'vietnamese', a: ['pho', 'banh mi'], meal: { a: 'Vietnamese' } },
  { k: 'pho', a: [], meal: { s: 'pho' } },
  { k: 'greek', a: ['gyro', 'gyros'], meal: { a: 'Greek' } },
  { k: 'mediterranean', a: ['greek', 'lebanese', 'middle eastern', 'falafel', 'kebab', 'gyro', 'turkish', 'shawarma', 'persian'], meal: { a: 'Lebanese' } },
  { k: 'middle eastern', a: ['lebanese', 'falafel', 'kebab', 'shawarma', 'persian', 'turkish', 'arab'], meal: { a: 'Lebanese' } },
  { k: 'bbq', a: ['barbecue', 'smokehouse', 'brisket'], meal: { s: 'beef' } },
  { k: 'wings', a: ['chicken wings', 'wingstop'], meal: { s: 'wings' } },
  { k: 'chicken', a: ['fried chicken', 'wings', 'rotisserie', 'hot chicken', 'chicken wings'], meal: { c: 'Chicken' } },
  { k: 'sandwiches', a: ['sandwich', 'sub', 'deli', 'hoagie', 'banh mi'], meal: { s: 'sandwich' } },
  { k: 'breakfast', a: ['brunch', 'pancake', 'waffle', 'diner', 'bagel', 'breakfast'], meal: { c: 'Breakfast' } },
  { k: 'seafood', a: ['fish', 'fish and chips', 'oyster', 'crab', 'lobster', 'shrimp', 'poke'], meal: { c: 'Seafood' } },
  { k: 'steak', a: ['steak house', 'steakhouse'], meal: { s: 'steak' } },
  { k: 'salad', a: ['healthy', 'bowl', 'bowls', 'juice', 'salad'], meal: { s: 'salad' } },
  { k: 'american', a: ['diner', 'burger'], meal: { a: 'American' } },
  { k: 'hot dogs', a: ['hot dog', 'hotdog'], meal: { s: 'sausage' } },
  { k: 'soup', a: ['pho', 'ramen', 'chowder'], meal: { s: 'soup' } },
  { k: 'noodles', a: ['noodle', 'ramen', 'pho', 'udon', 'lo mein'], meal: { s: 'noodle' } },
  { k: 'southern', a: ['soul food', 'cajun', 'creole', 'cajun creole'], meal: { s: 'chicken' } },
  { k: 'caribbean', a: ['jamaican', 'cuban', 'haitian', 'puerto rican'], meal: { a: 'Jamaican' } },
  { k: 'latin', a: ['latin american', 'peruvian', 'colombian', 'salvadoran', 'venezuelan', 'cuban', 'brazilian', 'argentinian'], meal: { a: 'Peruvian' } },
  { k: 'french', a: ['crepe'], meal: { a: 'French' } },
  { k: 'ethiopian', a: ['eritrean'], meal: { a: 'Ethiopian' } },
  { k: 'filipino', a: [], meal: { a: 'Filipino' } },
  { k: 'hawaiian', a: ['poke'], meal: { s: 'salmon' } },
  { k: 'german', a: ['bratwurst'], meal: { a: 'German' } },
  { k: 'polish', a: ['pierogi'], meal: { a: 'Polish' } },
  { k: 'asian', a: ['chinese', 'japanese', 'thai', 'korean', 'vietnamese', 'sushi', 'ramen', 'pho', 'asian fusion', 'pan asian'], meal: { a: 'Chinese' } },
  { k: 'pasta', a: ['italian'], meal: { c: 'Pasta' } },
  { k: 'coffee', a: ['coffee shop', 'cafe', 'espresso'], meal: { c: 'Dessert' } },
  { k: 'ice cream', a: ['ice cream', 'gelato', 'frozen yogurt', 'custard'], meal: { c: 'Dessert' } },
  { k: 'donuts', a: ['donut', 'doughnut'], meal: { c: 'Dessert' } },
  { k: 'bakery', a: ['pastry', 'bread'], meal: { c: 'Dessert' } },
  { k: 'dessert', a: ['ice cream', 'frozen yogurt', 'donut', 'doughnut', 'cake', 'cupcake', 'gelato', 'crepe', 'bakery', 'cookie', 'sweets', 'bubble tea'], meal: { c: 'Dessert' } },
  { k: 'spicy', a: ['szechuan', 'sichuan', 'hunan', 'thai', 'indian', 'hot chicken', 'nashville', 'korean'], meal: null },
  { k: 'fast food', a: [], special: 'fast' },
  { k: 'vegetarian', a: ['vegetarian', 'vegan'], special: 'veg' },
  { k: 'vegan', a: ['vegan'], special: 'vegan' },
];
for (const g of GROUPS) g.tokens = [...new Set([g.k, ...g.a].map(normTerm))];
const GROUP_INDEX = new Map();
for (const g of GROUPS) GROUP_INDEX.set(normTerm(g.k), g);
for (const g of GROUPS) for (const a of g.a) if (!GROUP_INDEX.has(normTerm(a))) GROUP_INDEX.set(normTerm(a), g);

const AREAS = new Map(Object.entries({
  american: 'American', british: 'British', canadian: 'Canadian', chinese: 'Chinese', french: 'French', greek: 'Greek',
  indian: 'Indian', irish: 'Irish', italian: 'Italian', jamaican: 'Jamaican', japanese: 'Japanese', malaysian: 'Malaysian',
  mexican: 'Mexican', moroccan: 'Moroccan', polish: 'Polish', portuguese: 'Portuguese', russian: 'Russian', spanish: 'Spanish',
  thai: 'Thai', turkish: 'Turkish', ukrainian: 'Ukrainian', vietnamese: 'Vietnamese', ethiopian: 'Ethiopian', peruvian: 'Peruvian',
  lebanese: 'Lebanese', cuban: 'Cuban', brazilian: 'Brazilian', colombian: 'Colombian', german: 'German', korean: 'South Korean',
  nepalese: 'Nepalese', pakistani: 'Pakistani', persian: 'Iranian', taiwanese: 'Taiwanese', indonesian: 'Indonesian',
  salvadoran: 'Salvadoran', venezuelan: 'Venezuelan', syrian: 'Syrian', hungarian: 'Hungarian', filipino: 'Filipino', haitian: 'Haitian',
}));

const NOT_ORDERABLE = /\b(dining hall|dining commons|cafeteria|canteen|mess hall|employee|staff only)\b/i;
const MEATY = ['steak house', 'steakhouse', 'barbecue', 'bbq', 'chicken', 'fried chicken', 'wings', 'chicken wings', 'burger', 'hot dog', 'seafood', 'fish', 'brisket'];
const COZY = ['soup', 'ramen', 'noodles', 'indian', 'italian', 'pizza', 'bbq', 'southern', 'korean'];
const COOL = ['ice cream', 'salad', 'sushi', 'mexican', 'mediterranean', 'hawaiian'];
const SUGGESTIONS = ['pizza', 'burgers', 'tacos', 'mexican', 'chinese', 'sushi', 'ramen', 'japanese', 'thai', 'indian', 'italian', 'pasta',
  'korean', 'vietnamese', 'pho', 'mediterranean', 'greek', 'middle eastern', 'bbq', 'chicken', 'wings', 'sandwiches', 'breakfast',
  'seafood', 'steak', 'salad', 'american', 'hot dogs', 'soup', 'noodles', 'southern', 'caribbean', 'latin', 'french', 'ethiopian',
  'filipino', 'hawaiian', 'asian', 'coffee', 'ice cream', 'donuts', 'bakery', 'dessert', 'spicy', 'fast food', 'vegetarian', 'vegan'];
const DIETS = [['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['gluten_free', 'Gluten-free'], ['halal', 'Halal'], ['kosher', 'Kosher']];
const PALETTE = ['#ff5a2c', '#1f9d63', '#3b7ddd', '#c2489a', '#d08a00', '#7a5af8', '#0f9fb0', '#8c5a3c'];

function normTerm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`.]/g, '').replace(/&/g, ' and ').replace(/[_;,/]+/g, ' ').replace(/[^a-z0-9 -]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function normName(s) { return ' ' + normTerm(s).replace(/-/g, ' ') + ' '; }

const termCache = new Map();
function resolveTerm(term) {
  const t = normTerm(term);
  if (termCache.has(t)) return termCache.get(t);
  const g = GROUP_INDEX.get(t) || GROUP_INDEX.get(t.replace(/s$/, '')) || GROUP_INDEX.get(t.replace(/es$/, '')) || GROUP_INDEX.get(t + 's');
  const r = g ? { group: g, tokens: g.tokens, special: g.special } : { group: null, tokens: [t], free: true };
  termCache.set(t, r);
  return r;
}

function tokenHits(place, tk, free) {
  if (!tk) return false;
  for (const c of place.cz) {
    if (c === tk) return true;
    if (!tk.includes(' ') && c.split(' ').includes(tk)) return true;
  }
  const n = place.nn;
  if (n.includes(' ' + tk + ' ') || n.includes(' ' + tk + 's ') || n.includes(' ' + tk + 'es ')) return true;
  if ((free ? tk.length >= 3 : tk.length >= 5) && n.includes(' ' + tk)) return true;
  return false;
}
function matchTerm(place, term) {
  const r = resolveTerm(term);
  if (r.special === 'fast') return place.amenity === 'fast_food';
  if (r.special === 'veg') return !!(place.diet.vegetarian || place.diet.vegan || place.cz.has('vegetarian') || place.cz.has('vegan'));
  if (r.special === 'vegan') return !!(place.diet.vegan || place.cz.has('vegan'));
  return r.tokens.some(tk => tokenHits(place, tk, r.free));
}

/* ---------- state ---------- */
const KEY = 'forkcast.v1';
const state = Object.assign({ people: [], loc: null, radius: 3, noFast: false, history: [] }, store.get(KEY, {}));
function newPerson(name, extra = {}) {
  const used = new Set(state.people.map(p => p.color));
  const color = PALETTE.find(c => !used.has(c)) || PALETTE[state.people.length % PALETTE.length];
  return { id: uid(), name, color, likes: [], nopes: [], diet: [], eating: true, ...extra };
}
if (!state.people.length) state.people = [newPerson('You')];
function save() { store.set(KEY, state); }
const initial = n => (String(n).trim()[0] || '?').toUpperCase();
let run = null;     // the current set of results
let weather = null;
let map = null;

/* ---------- people UI ---------- */
function chip(text, kind, i) {
  return `<span class="chip ${kind}">${esc(text)}<button type="button" data-act="rm" data-kind="${kind === 'like' ? 'likes' : 'nopes'}" data-i="${i}" aria-label="Remove ${esc(text)}">${icon('x')}</button></span>`;
}
function renderPeople(focus) {
  $('#people').innerHTML = state.people.map(p => `
    <article class="person ${p.eating ? '' : 'out'}" data-id="${p.id}">
      <div class="person-top">
        <div class="avatar" style="background:${p.color}">${esc(initial(p.name))}</div>
        <input class="name-in" value="${esc(p.name)}" maxlength="24" aria-label="Name" data-act="name">
        <button class="eating ${p.eating ? 'on' : ''}" data-act="eat" type="button" title="Toggle whether they're eating tonight"><span class="pip"></span>${p.eating ? 'Eating' : 'Sitting out'}</button>
        <button class="icon-btn" data-act="del" type="button" title="Remove ${esc(p.name)}" aria-label="Remove ${esc(p.name)}">${icon('trash')}</button>
      </div>
      <div>
        <div class="list-label like">${icon('heart')}Usually likes</div>
        <div class="chips">${p.likes.map((t, i) => chip(t, 'like', i)).join('')}<input class="chip-in" list="foods" data-act="add" data-kind="likes" placeholder="${p.likes.length ? 'Add more' : 'pizza, tacos, Chipotle...'}" aria-label="Add a food ${esc(p.name)} likes"></div>
      </div>
      <div>
        <div class="list-label nope">${icon('ban')}Won't eat</div>
        <div class="chips">${p.nopes.map((t, i) => chip(t, 'nope', i)).join('')}<input class="chip-in" list="foods" data-act="add" data-kind="nopes" placeholder="${p.nopes.length ? 'Add more' : 'sushi, spicy...'}" aria-label="Add a food ${esc(p.name)} won't eat"></div>
      </div>
      <div class="diets">${DIETS.map(([k, l]) => `<button type="button" class="diet ${p.diet.includes(k) ? 'on' : ''}" data-act="diet" data-diet="${k}" aria-pressed="${p.diet.includes(k)}">${l}</button>`).join('')}</div>
    </article>`).join('') + `<button class="add-person" id="addPerson" type="button">${icon('plus')}Add someone</button>`;
  if (focus) $(`.person[data-id="${focus.id}"] .chip-in[data-kind="${focus.kind}"]`)?.focus();
}
const personOf = el => state.people.find(p => p.id === el.closest('.person')?.dataset.id);

function addTerms(p, kind, raw) {
  const other = kind === 'likes' ? 'nopes' : 'likes';
  let added = 0;
  for (let t of String(raw).split(',')) {
    t = t.trim().replace(/\s+/g, ' ').slice(0, 32);
    if (!t) continue;
    const lc = t.toLowerCase();
    p[other] = p[other].filter(x => x.toLowerCase() !== lc);
    if (!p[kind].some(x => x.toLowerCase() === lc)) { p[kind].push(t); added++; }
  }
  return added;
}
function crewChanged(focus) { save(); renderPeople(focus); if (run) rerank(); }

function bindPeople() {
  const root = $('#people');
  root.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'addPerson') {
      const p = newPerson(`Person ${state.people.length + 1}`);
      state.people.push(p); crewChanged();
      const inp = $(`.person[data-id="${p.id}"] .name-in`); inp.focus(); inp.select();
      return;
    }
    const p = personOf(btn); if (!p) return;
    const act = btn.dataset.act;
    if (act === 'eat') { p.eating = !p.eating; crewChanged(); }
    else if (act === 'diet') { const d = btn.dataset.diet; p.diet = p.diet.includes(d) ? p.diet.filter(x => x !== d) : [...p.diet, d]; crewChanged(); }
    else if (act === 'rm') { p[btn.dataset.kind].splice(+btn.dataset.i, 1); crewChanged(); }
    else if (act === 'del') {
      const idx = state.people.indexOf(p);
      state.people.splice(idx, 1); crewChanged();
      toast(`Removed ${p.name}`, { label: 'Undo', fn: () => { state.people.splice(idx, 0, p); crewChanged(); } });
    }
  });
  root.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.act === 'name') {
      const p = personOf(el); p.name = el.value; save();
      el.closest('.person').querySelector('.avatar').textContent = initial(el.value);
    } else if (el.dataset.act === 'add' && (e.inputType === 'insertReplacementText' || e.inputType === undefined)) {
      // picked from the suggestion list
      const p = personOf(el), v = el.value; el.value = '';
      if (addTerms(p, el.dataset.kind, v)) crewChanged({ id: p.id, kind: el.dataset.kind });
    }
  });
  root.addEventListener('change', e => { if (e.target.dataset.act === 'name' && run) rerank(); });
  root.addEventListener('keydown', e => {
    const el = e.target;
    if (el.dataset.act === 'name' && e.key === 'Enter') { el.blur(); return; }
    if (el.dataset.act !== 'add') return;
    const p = personOf(el);
    if ((e.key === 'Enter' || e.key === ',') && el.value.trim()) {
      e.preventDefault();
      const v = el.value; el.value = '';
      addTerms(p, el.dataset.kind, v); crewChanged({ id: p.id, kind: el.dataset.kind });
    } else if (e.key === 'Backspace' && !el.value && p[el.dataset.kind].length) {
      p[el.dataset.kind].pop(); crewChanged({ id: p.id, kind: el.dataset.kind });
    }
  });
  root.addEventListener('focusout', e => {
    const el = e.target;
    if (el.dataset?.act === 'add' && el.value.trim()) {
      const p = personOf(el), v = el.value; el.value = '';
      if (p && addTerms(p, el.dataset.kind, v)) setTimeout(() => crewChanged(), 0);
    }
  });
}

const SAMPLE = [
  ['Mom', { likes: ['thai', 'sushi', 'salad', 'mediterranean'], nopes: ['fast food'] }],
  ['Dad', { likes: ['bbq', 'burgers', 'mexican', 'wings'], nopes: ['sushi'] }],
  ['Maya', { likes: ['pizza', 'chicken', 'pasta', 'ice cream'], nopes: ['spicy'] }],
  ['Leo', { likes: ['tacos', 'pizza', 'Chipotle'], nopes: ['seafood'] }],
];
function loadSample() {
  const before = state.people;
  state.people = [];
  for (const [n, x] of SAMPLE) state.people.push(newPerson(n, { likes: [...x.likes], nopes: [...x.nopes] }));
  crewChanged();
  toast('Loaded a sample family', { label: 'Undo', fn: () => { state.people = before; crewChanged(); } });
}

/* ---------- location + weather ---------- */
function setLocStatus(html, ok) { const s = $('#locStatus'); s.innerHTML = html; s.classList.toggle('set', !!ok); }
function showLoc() {
  if (state.loc) setLocStatus(`${icon('pin')}${esc(state.loc.label)}`, true);
  else setLocStatus('Set a location so we can find places near you.');
}
function labelFrom(a = {}, fallback = '') {
  const city = a.city || a.town || a.village || a.suburb || a.hamlet || a.county;
  const region = a.state || a.country;
  return [a.neighbourhood && !city ? a.neighbourhood : null, city, region].filter(Boolean).join(', ') || fallback.split(',').slice(0, 2).join(',');
}
async function setLocation(lat, lon, label, cc) {
  state.loc = { lat: +lat, lon: +lon, label, cc: cc || '' };
  save(); showLoc(); loadWeather();
}
async function geocode(q) {
  const zip = /^\d{5}(-\d{4})?$/.test(q.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&accept-language=en${zip ? '&countrycodes=us' : ''}&q=${encodeURIComponent(q)}`;
  const res = await fetchTimeout(url, {}, 12000);
  if (!res.ok) throw new Error('geocode ' + res.status);
  const [hit] = await res.json();
  return hit;
}
function bindLocation() {
  $('#locForm').addEventListener('submit', async e => {
    e.preventDefault();
    const q = $('#locInput').value.trim();
    if (!q) return $('#locInput').focus();
    setLocStatus('Looking that up...');
    try {
      const hit = await geocode(q);
      if (!hit) return setLocStatus(`Couldn't find "${esc(q)}". Try a ZIP code or "City, State".`);
      const a = hit.address || {};
      const label = (a.postcode && /^\d/.test(q) ? a.postcode + ' · ' : '') + labelFrom(a, hit.display_name);
      await setLocation(hit.lat, hit.lon, label, a.country_code);
      $('#locInput').value = '';
    } catch { setLocStatus('Location lookup failed. Check your connection and try again.'); }
  });
  $('#geoBtn').addEventListener('click', () => {
    if (!navigator.geolocation) return setLocStatus('Your browser has no location access. Type a ZIP code instead.');
    setLocStatus('Asking your browser for your location...');
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      let label = 'Your current location', cc = '';
      try {
        const r = await fetchTimeout(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=en&lat=${lat}&lon=${lon}`, {}, 10000);
        const j = await r.json(); label = labelFrom(j.address, label) || label; cc = j.address?.country_code || '';
      } catch {}
      setLocation(lat, lon, label, cc);
    }, err => setLocStatus(err.code === 1 ? 'Location permission was blocked. Type a ZIP code instead.' : "Couldn't get your location. Type a ZIP code instead."),
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  });
  $('#radius').value = String(state.radius);
  $('#radius').addEventListener('change', e => { state.radius = +e.target.value; save(); });
  $('#noFast').checked = !!state.noFast;
  $('#noFast').addEventListener('change', e => { state.noFast = e.target.checked; save(); if (run) rerank(); });
}

const WMO = c => c === 0 ? ['Clear', 'sun'] : c <= 3 ? ['Cloudy', 'cloud'] : c <= 48 ? ['Foggy', 'cloud'] : c <= 57 ? ['Drizzle', 'rain']
  : c <= 67 ? ['Rain', 'rain'] : c <= 77 ? ['Snow', 'snow'] : c <= 82 ? ['Showers', 'rain'] : c <= 86 ? ['Snow', 'snow'] : ['Storms', 'rain'];
async function loadWeather() {
  if (!state.loc) return;
  const f = !state.loc.cc || state.loc.cc === 'us';
  try {
    const r = await fetchTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${state.loc.lat}&longitude=${state.loc.lon}&current=temperature_2m,weather_code,precipitation&temperature_unit=${f ? 'fahrenheit' : 'celsius'}`, {}, 10000);
    const c = (await r.json()).current;
    const tF = f ? c.temperature_2m : c.temperature_2m * 9 / 5 + 32;
    const [desc, ic] = WMO(c.weather_code);
    const wet = ic === 'rain' || ic === 'snow';
    const mood = wet || tF < 45 ? 'cozy' : tF > 82 ? 'hot' : null;
    weather = { temp: Math.round(c.temperature_2m), unit: f ? 'F' : 'C', desc, ic, mood };
    const w = $('#weather');
    w.innerHTML = `${icon(ic)}<b>${weather.temp}°${weather.unit}</b> ${desc}${mood === 'cozy' ? ' · comfort food gets a nudge' : mood === 'hot' ? ' · cold stuff gets a nudge' : ''}`;
    w.hidden = false;
    if (run) rerank();
  } catch { weather = null; $('#weather').hidden = true; }
}

/* ---------- restaurants (OpenStreetMap via Overpass) ---------- */
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const truthy = v => v === 'yes' || v === 'only' || v === 'limited';
function toPlace(el) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  if (!t.name || lat == null) return null;
  const cuisines = (t.cuisine || '').split(';').map(s => s.trim().toLowerCase()).filter(Boolean);
  const addr = [[t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '), t['addr:city']].filter(Boolean).join(', ');
  return {
    id: el.type[0] + el.id, name: t.name, lat, lon, amenity: t.amenity, cuisines, brand: t.brand || '',
    diet: { vegetarian: truthy(t['diet:vegetarian']), vegan: truthy(t['diet:vegan']), gluten_free: truthy(t['diet:gluten_free']), halal: truthy(t['diet:halal']), kosher: truthy(t['diet:kosher']) },
    hours: t.opening_hours || '', website: t.website || t['contact:website'] || '', addr,
    delivery: t.delivery === 'yes', takeaway: t.takeaway === 'yes' || t.takeaway === 'only',
    private: t.access === 'private' || t.access === 'no',
  };
}
function prepPlace(p) {
  // derived fields used by the matcher; kept out of the cache
  p.cz = new Set(p.cuisines.map(normTerm));
  if (p.amenity === 'cafe') p.cz.add('cafe');
  if (p.amenity === 'ice_cream') p.cz.add('ice cream');
  p.nn = normName(p.name + ' ' + p.brand);
  return p;
}
const fullKey = (lat, lon, miles) => `forkcast.ov.${lat.toFixed(3)},${lon.toFixed(3)},${Math.round(miles * 1609.34)}`;
function cachedPlaces(lat, lon, miles) {
  const hit = store.get(fullKey(lat, lon, miles));
  return hit && Date.now() - hit.t < 12 * 3600e3 ? hit.p.map(prepPlace) : null;
}
// Quick first pass: Nominatim answers in well under a second but caps each search at 40 results,
// so it only covers the best-known places. The full Overpass list replaces it when it arrives.
async function fetchQuickPlaces(lat, lon, miles) {
  const dLat = miles / 69, dLon = miles / (69 * Math.cos(lat * Math.PI / 180));
  const box = [lon - dLon, lat + dLat, lon + dLon, lat - dLat].map(n => n.toFixed(5)).join(',');
  const out = [];
  for (const amenity of ['restaurant', 'fast_food']) {
    if (out.length) await new Promise(r => setTimeout(r, 1100)); // Nominatim allows 1 request per second
    const res = await fetchTimeout(`https://nominatim.openstreetmap.org/search?format=jsonv2&amenity=${amenity}&viewbox=${box}&bounded=1&limit=40&extratags=1&addressdetails=1&accept-language=en`, {}, 10000);
    if (!res.ok) throw new Error('nominatim ' + res.status);
    for (const x of await res.json()) {
      const a = x.address || {};
      out.push(toPlace({
        type: x.osm_type, id: x.osm_id, lat: +x.lat, lon: +x.lon,
        tags: { ...x.extratags, name: x.name, amenity: x.type, 'addr:housenumber': a.house_number, 'addr:street': a.road, 'addr:city': a.city || a.town || a.village },
      }));
    }
  }
  return out.filter(p => p && milesBetween(lat, lon, p.lat, p.lon) <= miles).map(prepPlace);
}
async function fetchPlaces(lat, lon, miles) {
  const r = Math.round(miles * 1609.34);
  const key = fullKey(lat, lon, miles);
  const q = `[out:json][timeout:60];nwr(around:${r},${lat},${lon})["amenity"~"^(restaurant|fast_food|cafe|ice_cream)$"]["name"];out center tags 1500;`;
  let lastErr;
  for (const url of OVERPASS) {
    try {
      const res = await fetchTimeout(url, { method: 'POST', body: new URLSearchParams({ data: q }) }, 65000);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const places = (await res.json()).elements.map(toPlace).filter(Boolean);
      const keys = store.get('forkcast.ovkeys', []).filter(k => k !== key);
      keys.push(key);
      while (keys.length > 4) store.del(keys.shift());
      if (!store.set(key, { t: Date.now(), p: places })) store.del(keys.pop());
      store.set('forkcast.ovkeys', keys);
      return places.map(prepPlace);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('no overpass');
}

function milesBetween(a, b, c, d) {
  const R = 3958.8, toR = x => x * Math.PI / 180;
  const dLat = toR(c - a), dLon = toR(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ---------- scoring ---------- */
function evalPerson(p, place) {
  const noped = p.nopes.filter(n => matchTerm(place, n));
  if (noped.length) return { p, veto: true, noped, liked: [], score: 0 };
  const liked = p.likes.filter(l => matchTerm(place, l));
  let score = liked.length ? 4 + Math.min(liked.length - 1, 3) * 1.5 : 0;
  const notes = [];
  const veg = p.diet.includes('vegan') ? 'vegan' : p.diet.includes('vegetarian') ? 'vegetarian' : null;
  if (veg) {
    if (place.diet[veg] || place.diet.vegan || place.cz.has(veg)) { score += 2.5; notes.push(`${veg} options`); }
    else if (MEATY.some(m => place.cz.has(m))) { score -= 3; notes.push('meat-heavy menu'); }
  }
  for (const d of ['gluten_free', 'halal', 'kosher']) {
    if (p.diet.includes(d) && place.diet[d]) { score += 2; notes.push(d.replace('_', '-')); }
  }
  return { p, veto: false, noped, liked, score, notes };
}

function rank(places, eaters) {
  const loc = state.loc;
  const seen = new Set();
  const ok = [], vetoed = [];
  for (const pl of places) pl.dist = milesBetween(loc.lat, loc.lon, pl.lat, pl.lon);
  places.sort((a, b) => a.dist - b.dist);
  const recent = new Map(state.history.map(h => [h.name.toLowerCase(), h.t]));
  for (const pl of places) {
    const dk = normName(pl.name).trim();
    if (seen.has(dk)) continue; // one entry per chain: the closest
    seen.add(dk);
    if (state.noFast && pl.amenity === 'fast_food') continue;
    if (pl.private || NOT_ORDERABLE.test(pl.name)) continue; // campus/workplace dining you can't order from
    const evals = eaters.map(p => evalPerson(p, pl));
    const vetoers = evals.filter(e => e.veto);
    if (vetoers.length) { vetoed.push({ place: pl, vetoers }); continue; }
    const happy = evals.filter(e => e.liked.length).length;
    let score = evals.reduce((s, e) => s + e.score, 0) + happy * 1.5;
    if (eaters.length > 1 && happy === eaters.length) score += 3;
    score -= pl.dist * 0.6;
    if (!pl.cuisines.length && !happy) score -= 0.8;
    if ((pl.amenity === 'cafe' || pl.amenity === 'ice_cream') && !happy) score -= 2;
    let nudge = null;
    if (weather?.mood) {
      const list = weather.mood === 'cozy' ? COZY : COOL;
      const g = list.find(k => matchTerm(pl, k));
      if (g) { score += 1.2; nudge = g; }
    }
    const last = recent.get(pl.name.toLowerCase());
    let recentDays = null;
    if (last) {
      recentDays = Math.floor((Date.now() - last) / 864e5);
      if (recentDays < 4) score -= 3; else if (recentDays < 10) score -= 1;
    }
    ok.push({ place: pl, evals, happy, score, nudge, recentDays });
  }
  ok.sort((a, b) => b.score - a.score);
  return { ranked: ok, vetoed };
}

function cuisineLabel(pl) {
  const own = pl.cuisines.map(c => c.replace(/_/g, ' ')).filter(c => c !== 'regional');
  if (own.length) return own.slice(0, 3);
  for (const g of GROUPS) if (!g.special && g.k !== 'spicy' && g.k !== 'asian' && matchTerm(pl, g.k)) return [g.k];
  return [pl.amenity === 'fast_food' ? 'fast food' : pl.amenity === 'cafe' ? 'cafe' : pl.amenity === 'ice_cream' ? 'ice cream' : 'restaurant'];
}

/* ---------- dish photos (TheMealDB) ---------- */
const mealCache = new Map();
const SIDE_GROUPS = new Set(['coffee', 'dessert', 'ice cream', 'donuts', 'bakery']);
function mealQuery(pl) {
  for (const c of pl.cuisines) { const a = AREAS.get(c); if (a) return { a }; }
  const gs = pl.cuisines.map(c => GROUP_INDEX.get(normTerm(c))).filter(g => g?.meal);
  const main = gs.find(g => !SIDE_GROUPS.has(g.k)) || gs[0]; // a cafe that also does pizza should show pizza
  if (main) return main.meal;
  for (const g of GROUPS) if (g.meal && !g.special && g.k !== 'asian' && matchTerm(pl, g.k)) return g.meal;
  return null;
}
async function dishFor(pl) {
  const q = mealQuery(pl);
  if (!q) return null;
  const [k, v] = Object.entries(q)[0];
  const url = `https://www.themealdb.com/api/json/v1/1/${k === 's' ? 'search' : 'filter'}.php?${k}=${encodeURIComponent(v)}`;
  if (!mealCache.has(url)) mealCache.set(url, fetchTimeout(url, {}, 10000).then(r => r.json()).then(j => j.meals || []).catch(() => []));
  const meals = await mealCache.get(url);
  if (!meals.length) return null;
  const m = meals[hash(pl.id) % meals.length];
  return { src: m.strMealThumb, title: m.strMeal };
}
function loadDish(pl, imgEl, size) {
  dishFor(pl).then(d => {
    if (!d || !imgEl.isConnected) return;
    imgEl.onload = () => imgEl.classList.add('ok');
    imgEl.onerror = () => imgEl.remove();
    imgEl.src = size ? `${d.src}/${size}` : d.src;
    imgEl.alt = d.title;
    const note = imgEl.parentElement.querySelector('.img-note');
    if (note) { note.textContent = `Dish idea: ${d.title}`; note.hidden = false; }
  });
}

/* ---------- links out ---------- */
const ddUrl = pl => `https://www.doordash.com/search/store/${encodeURIComponent(pl.name)}/`;
const ueUrl = pl => `https://www.ubereats.com/search?q=${encodeURIComponent(pl.name)}`;
const mapsUrl = pl => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pl.name + ', ' + (pl.addr || state.loc?.label || `${pl.lat},${pl.lon}`))}`;
function orderButtons(pl, small) {
  const cls = small ? 'btn sm' : 'btn';
  return `
    <a class="${cls} dd" href="${ddUrl(pl)}" target="_blank" rel="noopener" data-track="${pl.id}">${icon('bag')}DoorDash</a>
    <a class="${cls} ue" href="${ueUrl(pl)}" target="_blank" rel="noopener" data-track="${pl.id}"><span class="dot"></span>Uber Eats</a>
    ${small ? '' : `<a class="${cls} out" href="${mapsUrl(pl)}" target="_blank" rel="noopener" data-track="${pl.id}">${icon('nav')}Directions</a>`}
    ${!small && pl.website ? `<a class="${cls} out" href="${esc(pl.website)}" target="_blank" rel="noopener">${icon('globe')}Website</a>` : ''}`;
}
function track(id) {
  const r = run?.ranked.find(x => x.place.id === id);
  if (!r) return;
  state.history = [{ name: r.place.name, t: Date.now() }, ...state.history.filter(h => h.name !== r.place.name)].slice(0, 30);
  save();
}

/* ---------- results ---------- */
function renderLoading() {
  const el = $('#results');
  el.hidden = false;
  el.innerHTML = `<div class="panel loading"><div class="spinner"></div><h3>Checking what's near you</h3><p id="loadMsg">Looking up restaurants within ${state.radius} mi on OpenStreetMap...</p></div>`;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => { const m = $('#loadMsg'); if (m) m.textContent = 'Still looking. The free map server can take up to 20 seconds the first time. After that it\'s instant.'; }, 6000);
}

function reactLine(e, solo) {
  const name = solo ? 'You' : esc(e.p.name);
  const likes = solo ? 'like' : 'likes';
  let what;
  if (e.liked.length) what = `<b>${name}</b> ${likes} <b>${esc(e.liked.join(', '))}</b>`;
  else what = `${name} ${solo ? 'are' : 'is'} fine with it`;
  if (e.notes?.length) what += ` · ${esc(e.notes.join(', '))}`;
  return `<div class="react ${e.liked.length ? 'love' : 'meh'}"><span class="avatar sm" style="background:${e.p.color}">${esc(initial(e.p.name))}</span><span class="what">${what}</span></div>`;
}

function metaBits(r) {
  const pl = r.place;
  const bits = [`<span>${icon('pin')}${pl.dist < 0.1 ? 'Right here' : pl.dist.toFixed(1) + ' mi away'}</span>`];
  if (pl.hours && pl.hours.length <= 40) bits.push(`<span>${icon('clock')}${esc(pl.hours)}</span>`);
  if (pl.addr) bits.push(`<span>${esc(pl.addr)}</span>`);
  return bits.join('');
}

function heroHTML(r) {
  const pl = r.place, eaters = run.eaters, solo = eaters.length === 1;
  const tags = cuisineLabel(pl).map(c => `<span class="tag">${esc(c)}</span>`);
  if (pl.delivery) tags.push('<span class="tag">Delivers</span>');
  if (pl.takeaway) tags.push('<span class="tag">Takeout</span>');
  const all = eaters.length > 1 && r.happy === eaters.length;
  const extra = [];
  if (r.nudge && weather) extra.push(`${icon(weather.ic)}${weather.temp}°${weather.unit} and ${weather.desc.toLowerCase()}, so ${esc(r.nudge)} got a nudge`);
  if (r.recentDays != null) extra.push(`${icon('clock')}You went here ${r.recentDays === 0 ? 'today' : r.recentDays === 1 ? 'yesterday' : r.recentDays + ' days ago'}`);
  return `
    <article class="panel hero" id="hero">
      <div class="hero-img">${icon('utensils')}<img alt="" referrerpolicy="no-referrer"><span class="img-note" hidden></span></div>
      <div class="hero-body">
        <span class="eyebrow">${icon('crown')}Tonight's pick</span>
        <h2 class="hero-name" id="heroName">${esc(pl.name)}</h2>
        <div class="tags">${tags.join('')}</div>
        <div class="meta">${metaBits(r)}</div>
        ${all ? `<span class="badge-all">${icon('check')}Everyone likes something here</span>` : ''}
        <div class="reactions">${r.evals.map(e => reactLine(e, solo)).join('')}</div>
        ${extra.length ? `<div class="meta">${extra.map(x => `<span>${x}</span>`).join('')}</div>` : ''}
        <div class="order">${orderButtons(pl)}</div>
        <div class="hero-tools">
          <button class="btn soft" type="button" id="spinBtn">${icon('shuffle')}Not feeling it? Spin again</button>
          ${eaters.length > 1 && run.ranked.length > 1 ? `<button class="btn soft" type="button" id="voteBtn">${icon('vote')}Family vote</button>` : ''}
          <button class="btn ghost" type="button" id="againBtn">${icon('refresh')}Search again</button>
        </div>
      </div>
    </article>`;
}

function altHTML(r, range) {
  const pl = r.place;
  const pct = range.max === range.min ? 100 : Math.max(6, Math.round(15 + 85 * (r.score - range.min) / (range.max - range.min)));
  return `
    <div class="alt" data-id="${pl.id}">
      <div class="alt-thumb">${icon('utensils')}<img alt="" referrerpolicy="no-referrer"></div>
      <div>
        <h4 class="alt-name">${esc(pl.name)}</h4>
        <div class="alt-sub"><span class="cz">${esc(cuisineLabel(pl).join(', '))}</span><span>${pl.dist.toFixed(1)} mi</span>${r.recentDays != null ? '<span>been recently</span>' : ''}</div>
        ${run.eaters.length > 1 ? `<div class="mini-reacts">${r.evals.map(e => `<span class="avatar xs ${e.liked.length ? 'love' : 'meh'}" style="background:${e.p.color}" title="${esc(e.p.name)}: ${e.liked.length ? 'likes ' + esc(e.liked.join(', ')) : 'fine with it'}">${esc(initial(e.p.name))}</span>`).join('')}</div>` : ''}
        <div class="score-bar" title="How well it fits your crew"><i style="width:${pct}%"></i></div>
      </div>
      <div class="alt-actions">
        <button class="btn sm soft" type="button" data-pick="${pl.id}">${icon('crown')}Make it the pick</button>
        ${orderButtons(pl, true)}
      </div>
    </div>`;
}

function vetoHTML() {
  const v = run.vetoed;
  if (!v.length) return '';
  const counts = new Map();
  for (const x of v) for (const e of x.vetoers) counts.set(e.p.name, (counts.get(e.p.name) || 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const items = v.slice(0, 80).map(x => `<li><b>${esc(x.place.name)}</b><span class="by">${x.vetoers.map(e => `${esc(e.p.name)} (${esc(e.noped.join(', '))})`).join(', ')}</span></li>`).join('');
  return `
    <section class="panel">
      <details class="vetoes">
        <summary><span class="chev">${icon('chev')}</span>${v.length} place${v.length === 1 ? '' : 's'} got vetoed</summary>
        ${run.eaters.length > 1 && top ? `<p class="veto-top">${esc(top[0])} vetoed the most: ${top[1]}.</p>` : ''}
        <ul class="veto-list">${items}</ul>
      </details>
    </section>`;
}

function renderResults() {
  const el = $('#results');
  el.hidden = false;
  if (map) { map.remove(); map = null; }
  if (!run.total) {
    el.innerHTML = `<div class="panel empty"><h3>No restaurants found nearby</h3><p>OpenStreetMap doesn't list any restaurants within ${state.radius} mi of ${esc(state.loc.label)}. Try a bigger distance.</p></div>`;
    return;
  }
  if (!run.ranked.length) {
    el.innerHTML = `<div class="panel empty"><h3>Every single place got vetoed</h3><p>Somebody's being picky. Remove a nope or two, turn off "Skip fast food", or widen the distance.</p></div>${vetoHTML()}`;
    return;
  }
  const pick = run.pick;
  const alts = run.ranked.filter(r => r !== pick).slice(0, 8);
  const scores = run.ranked.slice(0, 12).map(r => r.score);
  const range = { min: Math.min(...scores), max: Math.max(...scores) };
  const anyLikes = run.eaters.some(p => p.likes.length);
  const noMatches = anyLikes && !run.ranked.some(r => r.happy);
  const status = run.partial
    ? `<div class="status-bar"><span class="spinner sm"></span>Quick look at the best-known spots nearby. Loading every restaurant within ${state.radius} mi...</div>`
    : run.fresh
      ? `<div class="status-bar">${icon('refresh')}Found ${run.fresh.length} places in the full list.<button class="btn sm soft" type="button" id="useFresh">Update picks</button></div>`
      : run.fullFailed
        ? `<div class="status-bar">The full restaurant list timed out, so these picks come from the ${run.total} best-known places.</div>`
        : '';
  el.innerHTML = `
    ${status}
    ${noMatches ?`<div class="panel empty" style="padding:18px"><p>Nothing nearby matched anyone's likes, so these are the closest places nobody vetoed.</p></div>` : ''}
    ${heroHTML(pick)}
    <section class="panel" id="votePanel" hidden></section>
    <div class="grid2">
      <section class="panel">
        <div class="section-head"><h3>Also good</h3><p>${run.ranked.length} places fit, ${run.vetoed.length} vetoed</p></div>
        <div class="alts">${alts.map(r => altHTML(r, range)).join('')}</div>
      </section>
      <section class="panel">
        <div class="section-head"><h3>On the map</h3><p>within ${state.radius} mi</p></div>
        <div class="map" id="map"></div>
      </section>
    </div>
    ${vetoHTML()}`;
  loadDish(pick.place, $('#hero .hero-img img'));
  el.querySelectorAll('.alt').forEach(a => {
    const r = run.ranked.find(x => x.place.id === a.dataset.id);
    loadDish(r.place, a.querySelector('img'), 'small');
  });
  drawMap([pick, ...alts]);
  if (run.vote) renderVote();
}

function drawMap(list) {
  if (!window.L) { $('#map').closest('.panel').hidden = true; return; }
  map = L.map('map', { scrollWheelZoom: false, attributionControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  const pts = [[state.loc.lat, state.loc.lon]];
  L.marker([state.loc.lat, state.loc.lon], { icon: L.divIcon({ className: '', html: '<div class="pin-you"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), title: 'You' }).addTo(map);
  list.forEach((r, i) => {
    const isPick = i === 0;
    const m = L.marker([r.place.lat, r.place.lon], {
      icon: L.divIcon({ className: '', html: `<div class="${isPick ? 'pin-pick' : 'pin-alt'}"></div>`, iconSize: isPick ? [22, 22] : [14, 14], iconAnchor: isPick ? [11, 11] : [7, 7] }),
      title: r.place.name, zIndexOffset: isPick ? 1000 : 0,
    }).addTo(map);
    m.bindTooltip(esc(r.place.name), { direction: 'top', offset: [0, -8] });
    if (!isPick) m.on('click', () => setPick(r));
    pts.push([r.place.lat, r.place.lon]);
  });
  map.fitBounds(pts, { padding: [28, 28], maxZoom: 15 });
}

function setPick(r, opts = {}) {
  run.pick = r;
  run.touched = true;
  run.vote = null;
  renderResults();
  const hero = $('#hero');
  hero.classList.add('pop');
  if (opts.scroll !== false) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function spin() {
  const top = run.ranked.slice(0, Math.min(6, run.ranked.length));
  if (top.length < 2) return toast("That's the only place that fits everyone.");
  const pool = top.filter(r => r !== run.pick);
  const best = Math.max(...pool.map(r => r.score));
  const w = pool.map(r => Math.exp((r.score - best) / 2.5));
  let x = Math.random() * w.reduce((a, b) => a + b, 0), choice = pool[0];
  for (let i = 0; i < pool.length; i++) { x -= w[i]; if (x <= 0) { choice = pool[i]; break; } }
  const nameEl = $('#heroName');
  const names = run.ranked.slice(0, 12).map(r => r.place.name);
  const btn = $('#spinBtn'); btn.disabled = true;
  nameEl.classList.add('rolling');
  let n = 0;
  const iv = setInterval(() => {
    nameEl.textContent = names[n++ % names.length];
    if (n > 14) { clearInterval(iv); setPick(choice, { scroll: false }); }
  }, 70);
}

/* ---------- family vote ---------- */
function startVote() {
  const finalists = [run.pick, ...run.ranked.filter(r => r !== run.pick).slice(0, 2)];
  run.vote = { finalists, votes: {} };
  run.touched = true;
  renderVote();
  $('#votePanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function renderVote() {
  const v = run.vote, panel = $('#votePanel');
  if (!v) { panel.hidden = true; return; }
  const eaters = run.eaters;
  const tally = new Map(v.finalists.map(f => [f.place.id, 0]));
  for (const id of Object.values(v.votes)) tally.set(id, (tally.get(id) || 0) + 1);
  const done = Object.keys(v.votes).length === eaters.length;
  let winner = null;
  if (done) {
    winner = [...v.finalists].sort((a, b) => (tally.get(b.place.id) - tally.get(a.place.id)) || (b.score - a.score))[0];
  }
  panel.hidden = false;
  panel.innerHTML = `
    <div class="vote-head">
      <div><h3>Family vote</h3><p>Pass the phone around. Everyone taps their own name under the place they want.</p></div>
      <button class="btn ghost sm" type="button" id="voteClose">${icon('x')}Close</button>
    </div>
    <div class="finalists">${v.finalists.map(f => `
      <div class="finalist ${winner === f ? 'winner' : ''}">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:start">
          <div><h4>${esc(f.place.name)}</h4><div class="sub">${esc(cuisineLabel(f.place).join(', '))} · ${f.place.dist.toFixed(1)} mi</div></div>
          <span class="tally">${tally.get(f.place.id)}</span>
        </div>
        <div class="voters">${eaters.map(p => `<button type="button" class="voter ${v.votes[p.id] === f.place.id ? 'on' : ''}" data-voter="${p.id}" data-for="${f.place.id}"><span class="avatar xs" style="background:${p.color}">${esc(initial(p.name))}</span>${esc(p.name)}</button>`).join('')}</div>
      </div>`).join('')}
    </div>
    <div class="vote-result">${done
      ? `${icon('crown')}<span>${esc(winner.place.name)} wins${[...tally.values()].filter(x => x === tally.get(winner.place.id)).length > 1 ? ' (tie broken by best overall fit)' : ''}.</span><button class="btn sm dd" type="button" id="voteGo">Go with it</button>`
      : `<span style="color:var(--ink-3)">${Object.keys(v.votes).length} of ${eaters.length} voted</span>`}</div>`;
  if (done) $('#voteGo').onclick = () => setPick(winner);
}

/* ---------- decide ---------- */
async function decide() {
  const eaters = state.people.filter(p => p.eating);
  if (!eaters.length) return toast('Turn on at least one person who is eating tonight.');
  if (!state.loc) { toast('Set your location first.'); $('#locInput').focus(); return; }
  const btn = $('#decideBtn');
  btn.disabled = true;
  const { lat, lon } = state.loc, miles = state.radius;
  const show = (places, partial) => {
    run = { places, eaters, total: places.length, partial, touched: false, token };
    rerank();
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const token = {};
  const cached = cachedPlaces(lat, lon, miles);
  if (cached) { show(cached, false); btn.disabled = false; return; }
  renderLoading();
  const full = fetchPlaces(lat, lon, miles);
  let quick = null;
  try { quick = await fetchQuickPlaces(lat, lon, miles); } catch (e) { console.warn('quick lookup failed', e); }
  if (quick?.length) { show(quick, true); btn.disabled = false; }
  try {
    const places = await full;
    if (!quick?.length) return show(places, false);
    if (run?.token !== token) return; // a newer search took over
    run.partial = false;
    if (run.touched) { run.fresh = places; renderResults(); }
    else { run.places = places; run.total = places.length; rerank(); }
  } catch (e) {
    console.error(e);
    if (quick?.length) { if (run?.token === token) { run.partial = false; run.fullFailed = true; renderResults(); } return; }
    $('#results').innerHTML = `<div class="panel empty"><h3>The restaurant map is busy</h3><p>OpenStreetMap's free servers didn't answer in time. Wait a few seconds and try again, or pick a smaller distance.</p><p style="margin-top:14px"><button class="btn soft" type="button" id="againBtn">${icon('refresh')}Try again</button></p></div>`;
  } finally { btn.disabled = false; }
}
function useFresh() {
  run.places = run.fresh; run.total = run.fresh.length; run.fresh = null; run.touched = false;
  rerank();
}
function rerank() {
  if (!run?.places) return;
  run.eaters = state.people.filter(p => p.eating);
  if (!run.eaters.length) { $('#results').innerHTML = `<div class="panel empty"><h3>Nobody's eating?</h3><p>Turn at least one person back on.</p></div>`; return; }
  Object.assign(run, rank(run.places, run.eaters));
  run.vote = null;
  run.pick = run.ranked[0];
  renderResults();
}

function bindResults() {
  $('#results').addEventListener('click', e => {
    const a = e.target.closest('a[data-track]');
    if (a) return track(a.dataset.track);
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'spinBtn') spin();
    else if (b.id === 'voteBtn') startVote();
    else if (b.id === 'againBtn') decide();
    else if (b.id === 'voteClose') { run.vote = null; renderVote(); }
    else if (b.id === 'useFresh') useFresh();
    else if (b.dataset.pick) setPick(run.ranked.find(r => r.place.id === b.dataset.pick));
    else if (b.dataset.voter) {
      const v = run.vote;
      if (v.votes[b.dataset.voter] === b.dataset.for) delete v.votes[b.dataset.voter];
      else v.votes[b.dataset.voter] = b.dataset.for;
      renderVote();
    }
  });
}

/* ---------- boot ---------- */
hydrateIcons();
$('#foods').innerHTML = SUGGESTIONS.map(s => `<option value="${esc(s)}">`).join('');
renderPeople();
bindPeople();
bindLocation();
bindResults();
showLoc();
loadWeather();
$('#sampleBtn').addEventListener('click', loadSample);
$('#decideBtn').addEventListener('click', decide);
