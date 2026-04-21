/* ============================================================
   SAVI'S WOODSHOP — Application Logic
   ============================================================ */

/* ── CONSTANTS ─────────────────────────────────────────────── */

const SPECIES_DEFAULTS = { pine: 1.45, poplar: 1.85, oak: 2.80 };

const LUMBER_CATALOG = [
  { nominal:'1×2', actualW:1.5,  thick:0.75, dims:'3/4" × 1½"',   type:'lumber',   hasRabbet:false },
  { nominal:'1×3', actualW:2.5,  thick:0.75, dims:'3/4" × 2½"',   type:'lumber',   hasRabbet:false },
  { nominal:'1×4', actualW:3.5,  thick:0.75, dims:'3/4" × 3½"',   type:'lumber',   hasRabbet:false },
  { nominal:'1×6', actualW:5.5,  thick:0.75, dims:'3/4" × 5½"',   type:'lumber',   hasRabbet:false },
  { nominal:'2×2', actualW:1.5,  thick:1.5,  dims:'1½" × 1½"',    type:'lumber',   hasRabbet:false },
  { nominal:'2×3', actualW:2.5,  thick:1.5,  dims:'1½" × 2½"',    type:'lumber',   hasRabbet:false },
  { nominal:'2×4', actualW:3.5,  thick:1.5,  dims:'1½" × 3½"',    type:'lumber',   hasRabbet:false },
  { nominal:'Moulding 1"',   actualW:1.0,  thick:0.75,  dims:'~¾" × 1" face',    type:'moulding', hasRabbet:true },
  { nominal:'Moulding 1½"',  actualW:1.5,  thick:0.75,  dims:'~¾" × 1½" face',  type:'moulding', hasRabbet:true },
  { nominal:'Moulding 2"',   actualW:2.0,  thick:0.875, dims:'~⅞" × 2" face',   type:'moulding', hasRabbet:true },
  { nominal:'Moulding 2½"',  actualW:2.5,  thick:1.0,   dims:'~1" × 2½" face',  type:'moulding', hasRabbet:true },
  { nominal:'Moulding 3"',   actualW:3.0,  thick:1.0,   dims:'~1" × 3" face',   type:'moulding', hasRabbet:true },
  { nominal:'Moulding 4"',   actualW:4.0,  thick:1.25,  dims:'~1¼" × 4" face',  type:'moulding', hasRabbet:true },
];

const TIPS = [
  'Always sand with the grain, never across it. Sand 80→120→220 grit in sequence for the smoothest finish.',
  'A band clamp is the secret to perfect miter frames. It wraps all 4 corners simultaneously while glue dries.',
  'Dry-fit every frame before gluing. Lay all 4 pieces on a flat surface and press corners together to check the fit.',
  'For stain, less is more. Wipe on, wait 2–5 minutes, then wipe off the excess. Multiple thin coats beat one heavy coat.',
  '"Measure twice, cut once" — but mark your long-point before every miter cut too. A quick pencil line prevents costly mistakes.',
  'Pine dents easily. If you want a durable finish, prime first, then paint with a water-based semi-gloss for easy cleanup.',
  'For hanging, use two D-ring hangers about one-third down from the top. Run braided picture wire between them for level hanging.',
  'Wood glue is stronger than the wood itself when cured. Focus on getting a good bond — clamp, don\'t rush.',
  'Pre-drill pilot holes before driving brad nails near ends of boards. It prevents the wood from splitting.',
  'The 3-4-5 rule: if a diagonal is 5", and the two sides are 3" and 4", your corner is perfectly square. Use this to check every corner.',
];

const WOODWORKING_STEPS = {
  sand:             { title:'Sand All Pieces', difficulty:'Simple',  time:'20–30 min' },
  miter_cut:        { title:'Cut Miter Angles', difficulty:'Careful', time:'15–25 min' },
  dry_fit:          { title:'Dry Fit Frame',   difficulty:'Simple',  time:'5–10 min'  },
  glue_clamp:       { title:'Glue & Clamp Corners', difficulty:'Careful', time:'30–60 min' },
  brad_corner:      { title:'Reinforce Miter Corners', difficulty:'Careful', time:'10–15 min' },
  straight_cut:     { title:'Cut Square Pieces', difficulty:'Simple', time:'15–20 min' },
  pocket_hole:      { title:'Drill Pocket Holes', difficulty:'Careful', time:'15–20 min' },
  pocket_screw:     { title:'Assemble with Pocket Screws', difficulty:'Careful', time:'20–30 min' },
  divider_attach:   { title:'Attach Dividers',   difficulty:'Careful', time:'15–20 min' },
  backer_strip:     { title:'Attach Backer Strips', difficulty:'Careful', time:'20–30 min' },
  fill_sand:        { title:'Fill & Final Sand', difficulty:'Simple',  time:'20–30 min' },
  mat_insert:       { title:'Insert Mat Board',  difficulty:'Simple',  time:'5 min' },
  assemble_regular: { title:'Assemble Contents', difficulty:'Simple',  time:'10–15 min' },
  assemble_glassless:{ title:'Assemble Contents', difficulty:'Simple', time:'10 min' },
  assemble_float:   { title:'Float & Mount Canvas', difficulty:'Careful', time:'20 min' },
  finish_brush:     { title:'Apply Finish',      difficulty:'Careful', time:'60–90 min' },
  hang_dring:       { title:'Install Hanging Hardware', difficulty:'Simple', time:'10 min' },
};

/* ── MATH UTILITIES ────────────────────────────────────────── */

function r2(v) { return Math.round(v * 100) / 100; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function toFraction(dec) {
  const whole = Math.floor(dec);
  const rem = dec - whole;
  const eighths = Math.round(rem * 8);
  const fracs = ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'];
  if (eighths === 0) return whole + '"';
  if (eighths === 8) return (whole + 1) + '"';
  return (whole > 0 ? whole : '') + fracs[eighths] + '"';
}

function frac(v) { return toFraction(v); }

/* ── UNIT CONVERSION ───────────────────────────────────────── */

const CM_PER_IN = 2.54;

function toDisplay(inches) {
  const u = Settings.get().units;
  if (u === 'cm') return r2(inches * CM_PER_IN) + ' cm';
  return frac(inches);
}

function toDisplayNum(inches) {
  const u = Settings.get().units;
  if (u === 'cm') return r2(inches * CM_PER_IN);
  return r2(inches);
}

function fromInput(val, field) {
  const u = Settings.get().units;
  const n = parseFloat(val);
  if (isNaN(n)) return 0;
  return u === 'cm' ? r2(n / CM_PER_IN) : n;
}

/* ── SETTINGS ──────────────────────────────────────────────── */

const Settings = (() => {
  const KEY = 'woodshop_settings_v1';
  const DEFAULTS = { units: 'in', theme: 'light', speciesPrices: { ...SPECIES_DEFAULTS } };

  function get() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      return s ? { ...DEFAULTS, ...s, speciesPrices: { ...DEFAULTS.speciesPrices, ...(s.speciesPrices || {}) } } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  }

  function save(patch) {
    const current = get();
    const next = { ...current, ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  return { get, save };
})();

/* ── DATA STORE ────────────────────────────────────────────── */

const Store = (() => {
  const PROJ_KEY = 'woodshop_projects_v3';
  const INV_KEY  = 'woodshop_inventory_v2';

  function migrate() {
    // Migrate from old woodframe-builder keys
    try {
      const oldProj = localStorage.getItem('woodframe_projects_v2');
      if (oldProj) {
        const old = JSON.parse(oldProj);
        const migrated = old.map(p => ({
          ...p,
          notes: p.notes || '',
          buildStatus: p.buildStatus || 'not-started',
          updatedAt: p.updatedAt || p.createdAt,
          stepsCompleted: p.stepsCompleted || [],
        }));
        localStorage.setItem(PROJ_KEY, JSON.stringify(migrated));
        localStorage.removeItem('woodframe_projects_v2');
      }
    } catch {}

    try {
      const oldInv = localStorage.getItem('woodframe_woodshop_v1');
      if (oldInv) {
        const old = JSON.parse(oldInv);
        const migrated = old.map(i => ({
          ...i,
          itemType: i.itemType || 'supply',
          minQty: i.minQty || null,
          paidPrice: i.paidPrice || null,
          linkedProjectIds: i.linkedProjectIds || [],
        }));
        localStorage.setItem(INV_KEY, JSON.stringify(migrated));
        localStorage.removeItem('woodframe_woodshop_v1');
      }
    } catch {}
  }

  function getProjects() {
    try { return JSON.parse(localStorage.getItem(PROJ_KEY)) || []; }
    catch { return []; }
  }

  function saveProjects(arr) { localStorage.setItem(PROJ_KEY, JSON.stringify(arr)); }

  function getProject(id) { return getProjects().find(p => p.id === id) || null; }

  function upsertProject(proj) {
    const all = getProjects();
    const idx = all.findIndex(p => p.id === proj.id);
    if (idx >= 0) all[idx] = proj;
    else all.unshift(proj);
    saveProjects(all);
    return proj;
  }

  function deleteProject(id) {
    saveProjects(getProjects().filter(p => p.id !== id));
  }

  function getInventory() {
    try { return JSON.parse(localStorage.getItem(INV_KEY)) || []; }
    catch { return []; }
  }

  function saveInventory(arr) { localStorage.setItem(INV_KEY, JSON.stringify(arr)); }

  function upsertItem(item) {
    const all = getInventory();
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    saveInventory(all);
    return item;
  }

  function deleteItem(id) {
    saveInventory(getInventory().filter(i => i.id !== id));
  }

  migrate();
  return { getProjects, saveProjects, getProject, upsertProject, deleteProject, getInventory, saveInventory, upsertItem, deleteItem };
})();

/* ── TOAST NOTIFICATIONS ───────────────────────────────────── */

const Toast = (() => {
  function show(msg, type = 'success', duration = 3200) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    t.innerHTML = `<div class="toast-left-bar"></div><span class="toast-icon">${icon}</span><span class="toast-text">${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.classList.add('exit');
      setTimeout(() => t.remove(), 320);
    }, duration);
  }
  return { show };
})();

/* ── APP CONTROLLER ────────────────────────────────────────── */

const App = (() => {
  let _currentScreen = 'dashboard';

  function nav(screen) {
    // hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item, .bottom-nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById('screen-' + screen).classList.add('active');
    const navEl = document.getElementById('nav-' + screen);
    const bnEl  = document.getElementById('bn-' + screen);
    if (navEl) navEl.classList.add('active');
    if (bnEl)  bnEl.classList.add('active');

    _currentScreen = screen;

    if (screen === 'dashboard')  Dashboard.render();
    if (screen === 'projects')   Projects.render();
    if (screen === 'workshop')   Workshop.render();
  }

  function navWorkshop(filter) {
    nav('workshop');
    Workshop.setStatusFilter(filter);
  }

  function toggleTheme() {
    const html = document.documentElement;
    const next = html.classList.contains('dark') ? 'light' : 'dark';
    html.className = next;
    Settings.save({ theme: next });
    document.getElementById('theme-toggle-btn').textContent = next === 'dark' ? '☀️' : '🌙';
  }

  function setUnits(unit) {
    Settings.save({ units: unit });
    document.getElementById('unit-in-btn').classList.toggle('active', unit === 'in');
    document.getElementById('unit-cm-btn').classList.toggle('active', unit === 'cm');
    document.getElementById('unit-in-btn').setAttribute('aria-pressed', unit === 'in');
    document.getElementById('unit-cm-btn').setAttribute('aria-pressed', unit === 'cm');
    Builder.updateUnitLabels();
    if (Builder.lastResults) Builder.renderResults(Builder.lastResults);
  }

  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  function init() {
    // Apply saved theme
    const s = Settings.get();
    document.documentElement.className = s.theme;
    document.getElementById('theme-toggle-btn').textContent = s.theme === 'dark' ? '☀️' : '🌙';

    // Apply saved units
    document.getElementById('unit-in-btn').classList.toggle('active', s.units === 'in');
    document.getElementById('unit-cm-btn').classList.toggle('active', s.units === 'cm');

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    // Keyboard: Escape closes modals
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    });

    // Init builder
    Builder.init();

    // Load initial screen
    nav('dashboard');

    // Update badges
    updateBadges();
  }

  function updateBadges() {
    const projects = Store.getProjects();
    const inv = Store.getInventory();
    document.getElementById('projects-badge').textContent = projects.length;
    document.getElementById('workshop-badge').textContent = inv.length;
    const needed = inv.filter(i => i.status === 'needed').length;
    document.getElementById('shopping-count').textContent = needed;
  }

  return { nav, navWorkshop, toggleTheme, setUnits, openModal, closeModal, init, updateBadges };
})();

/* ── DASHBOARD ─────────────────────────────────────────────── */

const Dashboard = (() => {
  function render() {
    renderRecentProjects();
    renderWorkshopGlance();
    renderTip();
  }

  function renderRecentProjects() {
    const strip = document.getElementById('recent-strip');
    const recentSection = document.getElementById('recent-section');
    const projects = Store.getProjects().slice(0, 3);

    if (projects.length === 0) {
      recentSection.style.display = 'none';
      return;
    }
    recentSection.style.display = '';
    strip.innerHTML = projects.map(p => `
      <div class="recent-card" onclick="Projects.openDetail('${p.id}')" tabindex="0" role="button" aria-label="Open ${p.name}">
        <div class="recent-card-thumb">${buildThumbnailSVG(p, 120, 70)}</div>
        <div class="recent-card-name">${esc(p.name)}</div>
        <div class="recent-card-meta">${formatDate(p.createdAt)} · ${typeLabel(p.frameType)}</div>
        <div class="recent-card-status">${statusPill(p.buildStatus)}</div>
      </div>
    `).join('');
  }

  function renderWorkshopGlance() {
    const inv = Store.getInventory();
    document.getElementById('glance-owned').textContent   = inv.filter(i => i.status === 'owned').length;
    document.getElementById('glance-needed').textContent  = inv.filter(i => i.status === 'needed').length;
    document.getElementById('glance-wishlist').textContent = inv.filter(i => i.status === 'wishlist').length;
  }

  function renderTip() {
    const idx = Math.floor(Date.now() / 86400000) % TIPS.length;
    document.getElementById('tip-text').textContent = TIPS[idx];
  }

  return { render };
})();

/* ── CALCULATIONS ENGINE ───────────────────────────────────── */

function suggestFrameWidth(maxDim) {
  const raw = maxDim * 0.309 / 2;
  if (maxDim <= 5)  return clamp(raw, 0.75, 1.25);
  if (maxDim <= 8)  return clamp(raw, 1.25, 2.0);
  if (maxDim <= 11) return clamp(raw, 1.75, 2.5);
  if (maxDim <= 16) return clamp(raw, 2.0,  3.0);
  if (maxDim <= 24) return clamp(raw, 2.5,  3.75);
  return clamp(raw, 3.0, 5.0);
}

function suggestMatBorder(maxDim) {
  if (maxDim <= 5)  return 1.5;
  if (maxDim <= 8)  return 2.0;
  if (maxDim <= 11) return 2.5;
  if (maxDim <= 16) return 3.0;
  return 3.5;
}

function recommendLumber(frameW, frameType, photoDepth, materialType) {
  const minThick = frameType === 'floating' ? photoDepth + 0.25 : 0.75;
  const recs = LUMBER_CATALOG.filter(l => l.type === materialType && l.actualW >= frameW && l.thick >= minThick);
  if (recs.length === 0) {
    const fallback = [...LUMBER_CATALOG].reverse().find(l => l.type === materialType);
    return [fallback || LUMBER_CATALOG[LUMBER_CATALOG.length - 1]];
  }
  return recs;
}

function calcInnerDims(photos, arrangement, divW, isMulti) {
  if (!isMulti) return { innerW: photos[0].w, innerH: photos[0].h };
  if (arrangement === 'horizontal') {
    return {
      innerW: photos.reduce((s, p) => s + p.w, 0) + (photos.length - 1) * divW,
      innerH: Math.max(...photos.map(p => p.h))
    };
  } else if (arrangement === 'vertical') {
    return {
      innerW: Math.max(...photos.map(p => p.w)),
      innerH: photos.reduce((s, p) => s + p.h, 0) + (photos.length - 1) * divW
    };
  } else { // grid
    const cols = Math.ceil(Math.sqrt(photos.length));
    const rows = Math.ceil(photos.length / cols);
    const maxW = Math.max(...photos.map(p => p.w));
    const maxH = Math.max(...photos.map(p => p.h));
    return { innerW: maxW * cols + divW * (cols - 1), innerH: maxH * rows + divW * (rows - 1) };
  }
}

function calcMiterCuts(innerW, innerH, frameW, useMoulding) {
  const cuts = [
    { label: 'Top & Bottom Pieces', count: 2, length: r2(innerW + 2 * frameW), angle: '45°', note: 'Long point to long point. Cut both ends at 45°, opposite directions.' },
    { label: 'Left & Right Pieces', count: 2, length: r2(innerH + 2 * frameW), angle: '45°', note: 'Long point to long point. Cut both ends at 45°, opposite directions.' },
  ];
  if (!useMoulding) {
    cuts.push(
      { label: 'Backer Strips (Top & Bottom)', count: 2, length: r2(innerW + 2 * frameW), angle: '45°', note: '3/8"×3/4" screen mold — glue & nail to back of face piece.' },
      { label: 'Backer Strips (Left & Right)', count: 2, length: r2(innerH + 2 * frameW), angle: '45°', note: '3/8"×3/4" screen mold — glue & nail to back of face piece.' }
    );
  }
  return cuts;
}

function calcButtCuts(innerW, innerH, frameW, useMoulding) {
  const cuts = [
    { label: 'Top & Bottom Pieces', count: 2, length: r2(innerW + 2 * frameW), angle: '90°', note: 'Full outer width. Pocket holes drill into these from the side pieces.' },
    { label: 'Left & Right Pieces', count: 2, length: r2(innerH), angle: '90°', note: 'Fits between top & bottom. Drill 2 pocket holes in each end (4 total per piece).' },
  ];
  if (!useMoulding) {
    cuts.push(
      { label: 'Backer Strips (Top & Bottom)', count: 2, length: r2(innerW + 2 * frameW), angle: '90°', note: '3/8"×3/4" screen mold — glue & brad-nail to back of face piece.' },
      { label: 'Backer Strips (Left & Right)', count: 2, length: r2(innerH), angle: '90°', note: '3/8"×3/4" screen mold — glue & brad-nail to back of face piece.' }
    );
  }
  return cuts;
}

function calcDividerCuts(photos, arrangement, divW, isMulti) {
  if (!isMulti || photos.length < 2) return [];
  const divCount = photos.length - 1;
  if (arrangement === 'horizontal') {
    const maxH = Math.max(...photos.map(p => p.h));
    return [{ label: 'Divider Strips (vertical, between photos)', count: divCount, length: r2(maxH), angle: '90°', note: `${frac(divW)} wide × ${frac(maxH)} long.` }];
  } else if (arrangement === 'vertical') {
    const maxW = Math.max(...photos.map(p => p.w));
    return [{ label: 'Divider Strips (horizontal, between photos)', count: divCount, length: r2(maxW), angle: '90°', note: `${frac(divW)} wide × ${frac(maxW)} long.` }];
  } else {
    const cols = Math.ceil(Math.sqrt(photos.length));
    const rows = Math.ceil(photos.length / cols);
    const maxW = Math.max(...photos.map(p => p.w));
    const maxH = Math.max(...photos.map(p => p.h));
    const divs = [];
    if (cols > 1) divs.push({ label: 'Vertical Dividers (between columns)', count: cols - 1, length: r2(maxH * rows + divW * (rows - 1)), angle: '90°', note: `${frac(divW)} wide.` });
    if (rows > 1) divs.push({ label: 'Horizontal Dividers (between rows)', count: rows - 1, length: r2(maxW * cols + divW * (cols - 1)), angle: '90°', note: `${frac(divW)} wide.` });
    return divs;
  }
}

function calcHardware(joint, isFloat, hasMat, isGlassless) {
  const hw = [];
  hw.push({ icon: '🪣', name: 'Wood Glue — Titebond II (8 oz)', qty: '1 bottle', note: 'Water-resistant formula. Essential for all joints and backer strips.' });
  if (joint === 'miter') {
    hw.push({ icon: '🔧', name: 'Band Clamp / Strap Clamp', qty: '1', note: 'Wraps all 4 corners at once while glue dries. ~$12–15.' });
    hw.push({ icon: '🔧', name: 'Corner Clamps (4-pack)', qty: '1 set (optional)', note: 'Hold each corner square while glue sets. ~$15–25 for a 4-pack.' });
    hw.push({ icon: '📌', name: '#18 × 1" Brad Nails', qty: '16–24 nails', note: 'Hammer through back at each corner to reinforce miter joints.' });
  } else {
    hw.push({ icon: '🔩', name: 'Pocket Screws 1-1/4" (coarse thread)', qty: '16 screws (buy a box)', note: 'For 3/4" thick material. Kreg brand recommended.' });
    hw.push({ icon: '🔧', name: 'Clamps (bar or C-clamps)', qty: '2–4', note: 'Hold joints while glue dries.' });
  }
  hw.push({ icon: '📌', name: '#18 × 3/4" Brad Nails', qty: '16–24', note: 'Attach backer strips to face pieces every 4–6 inches.' });
  if (!isFloat) {
    if (!isGlassless) {
      hw.push({ icon: '🪟', name: 'Glass or Acrylic Sheet', qty: 'Cut to inner opening size', note: 'Take frame to hardware store for cutting. Acrylic is lighter & safer.' });
    }
    hw.push({ icon: '📄', name: 'Foam Board (backing)', qty: 'Cut to inner opening size', note: 'Holds photo tight. Foam board from dollar store works perfectly.' });
    hw.push({ icon: '📎', name: 'Glazier Points or Turn Buttons', qty: '8–12', note: 'Secure photo & backing inside the rabbet. Press in with a screwdriver.' });
  }
  if (hasMat) {
    hw.push({ icon: '🗂️', name: 'Mat Board', qty: '1 sheet (cut to size)', note: 'Pre-cut mats available at craft stores, or cut yourself with a mat cutter.' });
  }
  hw.push({ icon: '🧻', name: 'Sandpaper — 80, 120, 220 grit', qty: 'A few sheets each', note: 'Sand before assembly (80→120) and after (220). Always sand with the grain.' });
  hw.push({ icon: '🪣', name: 'Wood Filler', qty: 'Small tube', note: 'Fill corner gaps before finishing. Sand flush when dry.' });
  hw.push({ icon: '🖼️', name: 'D-Ring Hangers + Picture Wire', qty: '2 D-rings + wire per frame', note: 'Attach D-rings 1/3 down from top. Run braided wire between them.' });
  hw.push({ icon: '🎨', name: 'Finish: Paint, Stain, or Wax', qty: 'Based on preference', note: 'Pine: prime + paint or stain + poly. Poplar/Oak: stain + poly looks great.' });
  return hw;
}

function buildStepSequence(joint, isFloat, hasMat, hasMulti, isGlassless) {
  const steps = ['sand'];
  if (joint === 'miter') {
    steps.push('miter_cut', 'dry_fit', 'glue_clamp', 'brad_corner');
  } else {
    steps.push('straight_cut', 'pocket_hole', 'pocket_screw');
  }
  if (hasMulti)  steps.push('divider_attach');
  if (!isFloat)  steps.push('backer_strip');
  steps.push('fill_sand');
  if (!isFloat && hasMat) steps.push('mat_insert');
  if (isFloat)           steps.push('assemble_float');
  else if (isGlassless)  steps.push('assemble_glassless');
  else                   steps.push('assemble_regular');
  steps.push('finish_brush', 'hang_dring');
  return steps;
}

function getStepText(type, joint, isFloat, hasMat, isGlassless) {
  const texts = {
    sand:             'Sand all lumber pieces with 80-grit, then 120-grit. Always sand <strong>along the grain</strong>, never across it. Wipe off dust with a tack cloth before any glue or finish.',
    miter_cut:        'Set your miter saw to <strong>45°</strong>. Cut one end of each frame piece. Flip the board end-for-end (<em>do NOT flip the saw</em>) and cut the other end — this ensures the angles mirror each other to form a perfect 90° corner.',
    dry_fit:          'Do a <strong>dry fit first</strong>: lay all 4 pieces on a flat surface and press the corners together to check they meet flush. If a corner gaps, shave a hair off that piece on the saw.',
    glue_clamp:       'Apply wood glue to both miter faces of each corner. Assemble all 4 corners and secure with a <strong>band clamp</strong>. Check the frame is flat on your bench. Let cure 30–60 minutes.',
    brad_corner:      'Flip the frame over (back facing up). Drive <strong>2 brad nails through each corner at a slight inward angle</strong> to lock the miter joint. Pre-drill thin pilot holes to avoid splitting.',
    straight_cut:     'Cut all pieces to length with <strong>90° square cuts</strong>. Use a combination square against the fence to verify squareness before every cut.',
    pocket_hole:      '<strong>Pocket hole placement — back face only:</strong> Clamp your pocket hole jig to the <strong>back face</strong> of each side piece. Drill 2 pocket holes into each end of the side pieces — 8 holes total. Set jig depth for 3/4" material.',
    pocket_screw:     'Apply wood glue to both faces of each joint. Align corners and drive <strong>1-1/4" coarse-thread pocket screws</strong> from the back face of the side piece into the top/bottom piece. Check square at each corner.',
    divider_attach:   'Measure and mark the <strong>divider strip positions</strong> inside the assembled frame. Apply glue to the ends, clamp in place, and drive <strong>brad nails from the top and bottom frame pieces</strong> into the divider ends.',
    backer_strip:     'Cut <strong>backer strips</strong> (3/8" × 3/4") to match each frame piece — these form the rabbet ledge. Apply wood glue to the face of each strip, press against the <strong>back/interior side</strong> of each frame piece, clamp, and drive brad nails every 4–6 inches.',
    fill_sand:        'Fill any corner gaps or nail holes with <strong>wood filler</strong>. Let dry completely, then sand smooth: 120-grit first, finish with 220-grit. Wipe clean with a tack cloth.',
    mat_insert:       'Drop the <strong>mat board</strong> into the rabbet opening-side facing front. Verify the photo will sit centered — the mat should overlap the photo edge by your chosen reveal on all sides.',
    assemble_regular: 'From the <strong>back of the frame</strong>, insert in order: glass/acrylic → mat (if using) → photo face-down → backing board. Press in glazier points or turn buttons every 4" to lock everything in place.',
    assemble_glassless:'From the <strong>back of the frame</strong>, insert in order: mat (if using) → photo face-down → backing board. Press in glazier points or turn buttons every 4" around the perimeter.',
    assemble_float:   'Set your canvas inside the floating frame — it should sit slightly below the top edges. Secure with <strong>small L-brackets</strong> at the canvas corners, fastened to the frame interior from behind. Paint brackets black so they disappear visually.',
    finish_brush:     'Apply your chosen finish. For stain: wipe on with a rag, wait 5 min, wipe off excess. Let dry 4–8 hours, then apply <strong>2 coats of polyurethane</strong>, sanding lightly with 220-grit between coats.',
    hang_dring:       'On the back, attach <strong>D-ring hangers</strong> about 1/3 down from the top, one on each side. Thread braided <strong>picture wire</strong> through both rings. Hang on two wall hooks for stability.',
  };
  return texts[type] || '';
}

/* ── SVG BUILDER ───────────────────────────────────────────── */

function buildFrameSVG(d, maxSize = 270) {
  const PAD_L = 52, PAD_R = 14, PAD_T = 14, PAD_B = 46;
  const aspect = d.outerW / d.outerH;
  let fW, fH;
  if (aspect >= 1) { fW = maxSize; fH = Math.round(maxSize / aspect); }
  else             { fH = maxSize; fW = Math.round(maxSize * aspect); }
  const scale  = fW / d.outerW;
  const fwPx   = d.frameW * scale;
  const totalW = fW + PAD_L + PAD_R;
  const totalH = fH + PAD_T + PAD_B;
  const ox = PAD_L, oy = PAD_T;
  const iX = ox + fwPx, iY = oy + fwPx;
  const iW = fW - 2 * fwPx, iH = fH - 2 * fwPx;

  let c = '';
  // Frame body
  c += `<rect x="${r2(ox)}" y="${r2(oy)}" width="${fW}" height="${fH}" fill="#9b6830" rx="3"/>`;
  const hl = Math.max(1, fwPx * 0.18);
  c += `<rect x="${r2(ox + fwPx * 0.25)}" y="${r2(oy + fwPx * 0.25)}" width="${r2(fW - fwPx * 0.5)}" height="${r2(fH - fwPx * 0.5)}" fill="none" stroke="#c4884e" stroke-width="${r2(hl)}" opacity=".6" rx="2"/>`;
  // Inner opening
  c += `<rect x="${r2(iX)}" y="${r2(iY)}" width="${r2(iW)}" height="${r2(iH)}" fill="#c8b8a8"/>`;

  if (d.matInfo) {
    const m = d.matInfo;
    const sidePx = m.borderSides * scale;
    const topPx  = m.borderTop   * scale;
    const botPx  = m.borderBottom * scale;
    const divPx  = (d.divW || 0) * scale;
    const maxPhH = Math.max(...d.photos.map(p => p.h));
    const maxPhW = Math.max(...d.photos.map(p => p.w));
    c += `<rect x="${r2(iX)}" y="${r2(iY)}" width="${r2(iW)}" height="${r2(iH)}" fill="#e8ddd0"/>`;

    if (!d.isMulti || d.arrangement === 'horizontal') {
      let photoX = iX + sidePx;
      d.photos.forEach(photo => {
        const pw = photo.w * scale, ph = photo.h * scale;
        const vOff = (maxPhH - photo.h) / 2 * scale;
        c += `<rect x="${r2(photoX)}" y="${r2(iY + topPx + vOff)}" width="${r2(pw)}" height="${r2(ph)}" fill="#bfb0a0"/>`;
        c += `<rect x="${r2(photoX)}" y="${r2(iY + topPx + vOff)}" width="${r2(pw)}" height="${r2(ph)}" fill="none" stroke="#7a6a58" stroke-width=".75" stroke-dasharray="3,2"/>`;
        photoX += pw + divPx;
      });
    } else if (d.arrangement === 'vertical') {
      let photoY = iY + topPx;
      d.photos.forEach(photo => {
        const pw = photo.w * scale, ph = photo.h * scale;
        const hOff = (maxPhW - photo.w) / 2 * scale;
        c += `<rect x="${r2(iX + sidePx + hOff)}" y="${r2(photoY)}" width="${r2(pw)}" height="${r2(ph)}" fill="#bfb0a0"/>`;
        c += `<rect x="${r2(iX + sidePx + hOff)}" y="${r2(photoY)}" width="${r2(pw)}" height="${r2(ph)}" fill="none" stroke="#7a6a58" stroke-width=".75" stroke-dasharray="3,2"/>`;
        photoY += ph + divPx;
      });
    } else {
      const cols = Math.ceil(Math.sqrt(d.photos.length));
      const cellW = maxPhW * scale + divPx;
      const cellH = maxPhH * scale + divPx;
      d.photos.forEach((photo, idx) => {
        const col = idx % cols, row = Math.floor(idx / cols);
        const px = iX + sidePx + col * cellW, py = iY + topPx + row * cellH;
        c += `<rect x="${r2(px)}" y="${r2(py)}" width="${r2(photo.w * scale)}" height="${r2(photo.h * scale)}" fill="#bfb0a0"/>`;
        c += `<rect x="${r2(px)}" y="${r2(py)}" width="${r2(photo.w * scale)}" height="${r2(photo.h * scale)}" fill="none" stroke="#7a6a58" stroke-width=".75" stroke-dasharray="3,2"/>`;
      });
    }
    // Mat labels
    const ml = `font-size="9" fill="#7a6040" font-family="Georgia,serif" font-style="italic"`;
    if (topPx >= 14) c += `<text x="${r2(iX + iW / 2)}" y="${r2(iY + topPx / 2 + 3.5)}" text-anchor="middle" ${ml}>${frac(m.borderTop)}</text>`;
    if (botPx >= 14) c += `<text x="${r2(iX + iW / 2)}" y="${r2(iY + iH - botPx / 2 + 3.5)}" text-anchor="middle" ${ml}>${frac(m.borderBottom)}${m.weightedBot ? ' ★' : ''}</text>`;
    if (sidePx >= 16) {
      const slx = iX + sidePx / 2, sly = iY + iH / 2;
      c += `<text x="${r2(slx)}" y="${r2(sly)}" text-anchor="middle" ${ml} transform="rotate(-90,${r2(slx)},${r2(sly)})">${frac(m.borderSides)}</text>`;
    }
  } else if (d.isMulti) {
    if (d.arrangement === 'horizontal') {
      let x = iX;
      d.photos.forEach((photo, i) => {
        if (i < d.photos.length - 1) {
          x += photo.w * scale;
          c += `<rect x="${r2(x)}" y="${r2(iY)}" width="${r2(d.divW * scale)}" height="${r2(iH)}" fill="#b08050" opacity=".75"/>`;
          x += d.divW * scale;
        }
      });
    } else if (d.arrangement === 'vertical') {
      let y = iY;
      d.photos.forEach((photo, i) => {
        if (i < d.photos.length - 1) {
          y += photo.h * scale;
          c += `<rect x="${r2(iX)}" y="${r2(y)}" width="${r2(iW)}" height="${r2(d.divW * scale)}" fill="#b08050" opacity=".75"/>`;
          y += d.divW * scale;
        }
      });
    }
  }

  // Dimension labels
  const lblStyle = `font-size="9" fill="#7a6040" font-family="Georgia,serif"`;
  // Width arrow + label below
  const arrowY = oy + fH + 8;
  c += `<line x1="${r2(ox)}" y1="${r2(arrowY)}" x2="${r2(ox + fW)}" y2="${r2(arrowY)}" stroke="#9a7a50" stroke-width="1"/>`;
  c += `<line x1="${r2(ox)}" y1="${r2(arrowY - 4)}" x2="${r2(ox)}" y2="${r2(arrowY + 4)}" stroke="#9a7a50" stroke-width="1"/>`;
  c += `<line x1="${r2(ox + fW)}" y1="${r2(arrowY - 4)}" x2="${r2(ox + fW)}" y2="${r2(arrowY + 4)}" stroke="#9a7a50" stroke-width="1"/>`;
  c += `<text x="${r2(ox + fW / 2)}" y="${r2(arrowY + 14)}" text-anchor="middle" ${lblStyle}>${toDisplay(d.outerW)}</text>`;
  // Height arrow + label left
  const arrowX = ox - 10;
  c += `<line x1="${r2(arrowX)}" y1="${r2(oy)}" x2="${r2(arrowX)}" y2="${r2(oy + fH)}" stroke="#9a7a50" stroke-width="1"/>`;
  c += `<line x1="${r2(arrowX - 4)}" y1="${r2(oy)}" x2="${r2(arrowX + 4)}" y2="${r2(oy)}" stroke="#9a7a50" stroke-width="1"/>`;
  c += `<line x1="${r2(arrowX - 4)}" y1="${r2(oy + fH)}" x2="${r2(arrowX + 4)}" y2="${r2(oy + fH)}" stroke="#9a7a50" stroke-width="1"/>`;
  const hx = arrowX - 8, hy = oy + fH / 2;
  c += `<text x="${r2(hx)}" y="${r2(hy)}" text-anchor="middle" ${lblStyle} transform="rotate(-90,${r2(hx)},${r2(hy)})">${toDisplay(d.outerH)}</text>`;

  return `<svg viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">${c}</svg>`;
}

function buildThumbnailSVG(proj, w, h) {
  if (!proj || !proj.outerW || !proj.outerH) {
    return `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#e8e0d0" rx="4"/><text x="${w/2}" y="${h/2+4}" text-anchor="middle" fill="#a09080" font-size="11" font-family="Georgia,serif">No Preview</text></svg>`;
  }
  const aspect = proj.outerW / proj.outerH;
  let fW, fH;
  if (aspect >= 1) { fW = w - 16; fH = Math.round((w - 16) / aspect); }
  else             { fH = h - 8;  fW = Math.round((h - 8) * aspect);  }
  const scale = fW / proj.outerW;
  const fwPx  = proj.frameW * scale;
  const ox = (w - fW) / 2, oy = (h - fH) / 2;
  const iX = ox + fwPx, iY = oy + fwPx;
  const iW = fW - 2 * fwPx, iH = fH - 2 * fwPx;
  let c = `<rect x="${r2(ox)}" y="${r2(oy)}" width="${fW}" height="${fH}" fill="#9b6830" rx="2"/>`;
  c += `<rect x="${r2(iX)}" y="${r2(iY)}" width="${r2(iW)}" height="${r2(iH)}" fill="${proj.matInfo ? '#e8ddd0' : '#c8b8a8'}"/>`;
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${c}</svg>`;
}

/* ── BUILDER MODULE ────────────────────────────────────────── */

const Builder = (() => {
  let _editingId = null;
  let _draftTimer = null;
  let lastResults = null;

  function init() {
    renderPhotoRows();
    updateJointNote();
    updateMaterialNote();
    checkDraft();
  }

  /* ── Toggle helpers ── */
  function setToggle(groupId, btn) {
    document.querySelectorAll('#' + groupId + ' .tog, #' + groupId + ' .species-option').forEach(b => {
      b.classList.remove('on');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('on');
    btn.setAttribute('aria-pressed', 'true');
  }

  function getToggleVal(groupId) {
    const btn = document.querySelector('#' + groupId + ' .tog.on, #' + groupId + ' .species-option.on');
    return btn ? btn.dataset.val : null;
  }

  /* ── Frame type ── */
  function setFrameType(val, el) {
    document.querySelectorAll('.frame-type-card').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
    el.classList.add('selected');
    el.setAttribute('aria-checked', 'true');
    const notes = {
      regular:   'Traditional frame with a ledge (rabbet) to hold photo, glass & backing.',
      glassless: 'Same construction as regular but no glass — great for prints, artwork, or anywhere glass would add glare.',
      floating:  'Canvas floats inside the frame with a visible gap. Perfect for stretched canvas artwork.',
    };
    document.getElementById('frame-type-note').textContent = notes[val] || notes.regular;
    const isFloat = val === 'floating';
    document.getElementById('float-options').style.display = isFloat ? '' : 'none';
    document.getElementById('float-options').setAttribute('aria-hidden', isFloat ? 'false' : 'true');
    document.getElementById('mat-card').style.display      = isFloat ? 'none' : '';
    scheduleDraftSave();
  }

  /* ── Units labels ── */
  function updateUnitLabels() {
    const u = Settings.get().units;
    const label = u === 'cm' ? '(cm)' : '(in)';
    document.querySelectorAll('.mat-unit-label, #divider-unit-label, #float-gap-unit-label').forEach(el => el.textContent = label);
  }

  /* ── Photo layout ── */
  function updatePhotoLayout() {
    const isMulti = getToggleVal('tg-layout') === 'multiple';
    document.getElementById('multi-controls').style.display = isMulti ? '' : 'none';
    document.getElementById('multi-controls').setAttribute('aria-hidden', isMulti ? 'false' : 'true');
    renderPhotoRows();
  }

  function renderPhotoRows() {
    const container = document.getElementById('photo-rows');
    const isMulti = getToggleVal('tg-layout') === 'multiple';
    const count = isMulti ? parseInt(document.getElementById('photo-count').value) || 2 : 1;
    const u = Settings.get().units;
    const unitLabel = u === 'cm' ? 'cm' : 'in';

    let html = '';
    for (let i = 0; i < count; i++) {
      const label = isMulti ? `Photo ${i + 1}` : 'Photo / Artwork';
      html += `
        <div class="photo-row" data-idx="${i}">
          <div class="photo-row-header">
            <span class="photo-row-title">${label}</span>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Width (${unitLabel})</label>
              <input type="number" class="p-w" value="${u === 'cm' ? 20.3 : 8}" min="${u === 'cm' ? 2.5 : 1}" max="${u === 'cm' ? 152 : 60}" step="${u === 'cm' ? 0.5 : 0.125}" aria-label="Photo ${i+1} width" oninput="Builder.scheduleDraftSave()" />
            </div>
            <div class="form-group">
              <label>Height (${unitLabel})</label>
              <input type="number" class="p-h" value="${u === 'cm' ? 25.4 : 10}" min="${u === 'cm' ? 2.5 : 1}" max="${u === 'cm' ? 152 : 60}" step="${u === 'cm' ? 0.5 : 0.125}" aria-label="Photo ${i+1} height" oninput="Builder.scheduleDraftSave()" />
            </div>
            <div class="form-group">
              <label>Depth / Thickness (${unitLabel})</label>
              <input type="number" class="p-d" value="${u === 'cm' ? 0.6 : 0.25}" min="${u === 'cm' ? 0.15 : 0.0625}" max="${u === 'cm' ? 10 : 4}" step="${u === 'cm' ? 0.1 : 0.0625}" aria-label="Photo ${i+1} depth" oninput="Builder.scheduleDraftSave()" />
            </div>
          </div>
        </div>`;
    }
    container.innerHTML = html;
  }

  /* ── Width mode toggle ── */
  function toggleCustomWidth() {
    const isCustom = getToggleVal('tg-width-mode') === 'custom';
    document.getElementById('custom-width-grp').style.display = isCustom ? '' : 'none';
    const hint = document.getElementById('width-hint');
    hint.textContent = isCustom
      ? 'Enter your desired frame face width.'
      : 'Width calculated using the golden-ratio guideline for best aesthetics.';
  }

  /* ── Mat toggle ── */
  function toggleMatOptions() {
    const hasMat = getToggleVal('tg-mat') === 'yes';
    const el = document.getElementById('mat-options');
    el.style.display = hasMat ? '' : 'none';
    el.setAttribute('aria-hidden', hasMat ? 'false' : 'true');
  }

  function toggleMatBorder() {
    const isCustom = getToggleVal('tg-mat-mode') === 'custom';
    document.getElementById('mat-border-grp').style.display = isCustom ? '' : 'none';
  }

  /* ── Joint & material notes ── */
  function updateJointNote() {
    const joint = getToggleVal('tg-joint') || 'miter';
    document.getElementById('joint-note').textContent = joint === 'miter'
      ? 'Classic look — invisible joints on the frame face. Uses band clamp + wood glue.'
      : 'More forgiving — straight cuts and pocket screws. Slight joint visible on corners.';
  }

  function updateMaterialNote() {
    const mat = getToggleVal('tg-material-type') || 'lumber';
    document.getElementById('material-type-note').textContent = mat === 'lumber'
      ? 'Dimensional boards (1×2, 1×3, etc.). Backer strips needed to create the rabbet ledge.'
      : 'Pre-profiled moulding with rabbet already cut in — no backer strips needed.';
  }

  /* ── Disclosure toggle ── */
  function toggleDisclosure(id) {
    const el = document.getElementById(id);
    const btn = document.getElementById(id + '-btn');
    const open = el.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = (open ? '▴ ' : '▾ ') + 'Which should I choose?';
  }

  /* ── Draft autosave ── */
  function scheduleDraftSave() {
    clearTimeout(_draftTimer);
    _draftTimer = setTimeout(saveDraft, 800);
  }

  function saveDraft() {
    try { sessionStorage.setItem('woodshop_draft', JSON.stringify(readFormState())); }
    catch {}
  }

  function checkDraft() {
    if (_editingId) return;
    try {
      const d = sessionStorage.getItem('woodshop_draft');
      if (d) App.openModal('modal-restore-draft');
    } catch {}
  }

  function restoreDraft() {
    try {
      const d = JSON.parse(sessionStorage.getItem('woodshop_draft'));
      if (d) applyFormState(d);
    } catch {}
    App.closeModal('modal-restore-draft');
  }

  function discardDraft() {
    sessionStorage.removeItem('woodshop_draft');
    App.closeModal('modal-restore-draft');
  }

  /* ── Clear editing state ── */
  function clearEdit() {
    _editingId = null;
    document.getElementById('editing-banner').classList.remove('visible');
    document.getElementById('save-copy-btn').style.display = 'none';
    document.getElementById('save-btn').textContent = '💾 Save Project';
    document.getElementById('results-panel').classList.remove('visible');
    document.getElementById('proj-name').value = '';
    document.getElementById('save-notes').value = '';
  }

  /* ── Result tab switching ── */
  function switchResultTab(name, btn) {
    document.querySelectorAll('.tab-panel-inner').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn-inner').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    document.getElementById('tab-' + name).classList.add('active');
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }

  /* ── Read form inputs ── */
  function readFormState() {
    const frameType = document.querySelector('.frame-type-card.selected')?.dataset.val || 'regular';
    const isMulti = getToggleVal('tg-layout') === 'multiple';
    const photos = [];
    document.querySelectorAll('.photo-row').forEach(row => {
      const w = fromInput(row.querySelector('.p-w')?.value, 'w') || 8;
      const h = fromInput(row.querySelector('.p-h')?.value, 'h') || 10;
      const d = fromInput(row.querySelector('.p-d')?.value, 'd') || 0.25;
      photos.push({ w, h, d });
    });

    return {
      projName:     document.getElementById('proj-name').value.trim(),
      frameType,
      isMulti,
      arrangement:  getToggleVal('tg-arrangement') || 'horizontal',
      photoCount:   document.getElementById('photo-count').value,
      divW:         isMulti ? (fromInput(document.getElementById('divider-width').value, 'dw') || 0.75) : 0,
      joint:        getToggleVal('tg-joint') || 'miter',
      species:      getToggleVal('tg-species') || 'pine',
      widthMode:    getToggleVal('tg-width-mode') || 'auto',
      customWidth:  fromInput(document.getElementById('custom-width').value, 'w') || 2.5,
      materialType: getToggleVal('tg-material-type') || 'lumber',
      hasMat:       getToggleVal('tg-mat') === 'yes',
      matMode:      getToggleVal('tg-mat-mode') || 'auto',
      matBorder:    fromInput(document.getElementById('mat-border').value, 'b') || 2.5,
      weightedBot:  getToggleVal('tg-weighted') === 'yes',
      reveal:       fromInput(document.getElementById('mat-reveal').value, 'r') || 0.25,
      floatGap:     fromInput(document.getElementById('float-gap').value, 'g') || 0.25,
      notes:        document.getElementById('save-notes').value,
      photos,
    };
  }

  function applyFormState(state) {
    if (state.projName)   document.getElementById('proj-name').value = state.projName;
    if (state.notes)      document.getElementById('save-notes').value = state.notes;

    // Frame type
    document.querySelectorAll('.frame-type-card').forEach(c => c.classList.remove('selected'));
    const ftCard = document.querySelector(`.frame-type-card[data-val="${state.frameType}"]`);
    if (ftCard) setFrameType(state.frameType, ftCard);

    // Toggles
    const applyTog = (groupId, val) => {
      const btn = document.querySelector(`#${groupId} [data-val="${val}"]`);
      if (btn) setToggle(groupId, btn);
    };
    if (state.isMulti) applyTog('tg-layout', 'multiple'); else applyTog('tg-layout', 'single');
    if (state.arrangement) applyTog('tg-arrangement', state.arrangement);
    if (state.joint)        applyTog('tg-joint', state.joint);
    if (state.species)      applyTog('tg-species', state.species);
    if (state.widthMode)    applyTog('tg-width-mode', state.widthMode);
    if (state.materialType) applyTog('tg-material-type', state.materialType);
    if (state.hasMat)       applyTog('tg-mat', 'yes'); else applyTog('tg-mat', 'no');
    if (state.matMode)      applyTog('tg-mat-mode', state.matMode);
    if (state.weightedBot)  applyTog('tg-weighted', 'yes'); else applyTog('tg-weighted', 'no');

    // Photo count + rows
    if (state.photoCount) document.getElementById('photo-count').value = state.photoCount;
    updatePhotoLayout();

    // Fill photo values
    const u = Settings.get().units;
    const rows = document.querySelectorAll('.photo-row');
    (state.photos || []).forEach((photo, i) => {
      if (!rows[i]) return;
      const setV = (cls, v) => { const el = rows[i].querySelector(cls); if (el) el.value = u === 'cm' ? r2(v * CM_PER_IN) : v; };
      setV('.p-w', photo.w);
      setV('.p-h', photo.h);
      setV('.p-d', photo.d);
    });

    // Number inputs (in inches internally)
    const setInp = (id, v) => { const el = document.getElementById(id); if (el) el.value = u === 'cm' ? r2(v * CM_PER_IN) : v; };
    setInp('divider-width', state.divW || 0.75);
    setInp('custom-width',  state.customWidth || 2.5);
    setInp('mat-border',    state.matBorder || 2.5);
    setInp('mat-reveal',    state.reveal || 0.25);
    setInp('float-gap',     state.floatGap || 0.25);

    toggleCustomWidth();
    toggleMatOptions();
    toggleMatBorder();
    updateJointNote();
    updateMaterialNote();
    updateUnitLabels();
  }

  /* ── MAIN CALCULATE ── */
  function calculate() {
    const state = readFormState();
    const { projName, frameType, isMulti, arrangement, divW, joint, species, widthMode, customWidth, materialType } = state;
    const { hasMat, matMode, matBorder, weightedBot, reveal, floatGap, photos } = state;

    const isFloat     = frameType === 'floating';
    const isGlassless = frameType === 'glassless';

    // Validate
    for (const p of photos) {
      if (p.w <= 0 || p.h <= 0) {
        Toast.show('Please enter valid photo dimensions (greater than 0).', 'error');
        document.getElementById('calc-status').textContent = '⚠ Please enter valid dimensions.';
        return;
      }
      if (p.w > 60 || p.h > 60) {
        Toast.show('Heads up: a dimension over 60" is unusually large. Double-check your measurements.', 'error');
      }
    }

    // Inner dimensions
    let { innerW, innerH } = calcInnerDims(photos, arrangement, divW, isMulti);
    const maxPhotoDim   = Math.max(...photos.map(p => Math.max(p.w, p.h)));
    const maxPhotoDepth = Math.max(...photos.map(p => p.d));

    if (isFloat) { innerW += 2 * floatGap; innerH += 2 * floatGap; }

    // Mat
    let matInfo = null;
    const doMat = hasMat && !isFloat;
    if (doMat) {
      const border = matMode === 'custom' ? matBorder : suggestMatBorder(maxPhotoDim);
      const bottomExtra = weightedBot ? 0.5 : 0;
      const matW = r2(innerW + 2 * border);
      const matH = r2(innerH + 2 * border + bottomExtra);
      matInfo = {
        border, bottomExtra, weightedBot,
        matW, matH,
        openingW: r2(innerW - 2 * reveal),
        openingH: r2(innerH - 2 * reveal),
        borderTop: border, borderSides: border,
        borderBottom: r2(border + bottomExtra),
        reveal,
      };
      innerW = matW;
      innerH = matH;
    }

    innerW = r2(innerW);
    innerH = r2(innerH);

    // Frame width
    const suggestedFW = widthMode === 'custom' ? customWidth : r2(suggestFrameWidth(maxPhotoDim));
    const lumberOpts  = recommendLumber(suggestedFW, frameType, maxPhotoDepth, materialType);
    const chosenLumber = lumberOpts[0];
    const frameW      = chosenLumber.actualW;
    const useMoulding = chosenLumber.hasRabbet;

    const outerW = r2(innerW + 2 * frameW);
    const outerH = r2(innerH + 2 * frameW);

    // Cut list
    const faceCuts    = joint === 'miter' ? calcMiterCuts(innerW, innerH, frameW, useMoulding) : calcButtCuts(innerW, innerH, frameW, useMoulding);
    const dividerCuts = calcDividerCuts(photos, arrangement, divW, isMulti);
    const allCuts     = [...faceCuts, ...dividerCuts];

    // Lumber totals
    const totalIn        = allCuts.reduce((s, c) => s + c.count * c.length, 0);
    const totalNetFt     = r2(totalIn / 12);
    const totalFt        = r2(totalIn * 1.10 / 12);
    const wasteIn        = r2(totalIn * 0.10);

    const faceInches   = faceCuts.filter(c => !c.label.includes('Backer')).reduce((s, c) => s + c.count * c.length, 0) * 1.10;
    const backerInches = faceCuts.filter(c => c.label.includes('Backer')).reduce((s, c) => s + c.count * c.length, 0) * 1.10;
    const divInches    = dividerCuts.reduce((s, c) => s + c.count * c.length, 0) * 1.10;

    const settings   = Settings.get();
    const pricePerFt = settings.speciesPrices[species] || SPECIES_DEFAULTS[species] || 1.45;
    const estLow  = r2(totalFt * pricePerFt * 0.85);
    const estHigh = r2(totalFt * pricePerFt * 1.25);

    const hardware = calcHardware(joint, isFloat, doMat, isGlassless);
    const stepKeys = buildStepSequence(joint, isFloat, doMat, isMulti && photos.length > 1, isGlassless);

    const results = {
      projName, frameType, joint, species, isFloat, isGlassless, hasMat: doMat,
      isMulti, arrangement, photos, divW, frameW, suggestedFW, materialType, useMoulding,
      innerW, innerH, outerW, outerH,
      allCuts, faceCuts, dividerCuts,
      totalIn, totalNetFt, wasteIn, totalFt,
      faceInches, backerInches, divInches,
      chosenLumber, lumberOpts,
      pricePerFt, estLow, estHigh,
      maxPhotoDepth, floatGap,
      matInfo, hardware, stepKeys,
      createdAt: new Date().toISOString(),
    };

    lastResults = results;
    Builder.lastResults = results;
    renderResults(results);
    document.getElementById('calc-status').textContent = '';
    document.getElementById('results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Save draft
    sessionStorage.removeItem('woodshop_draft');
  }

  /* ── RENDER RESULTS ── */
  function renderResults(d) {
    document.getElementById('results-panel').classList.add('visible');

    // Stats
    document.getElementById('result-stats').innerHTML = [
      { label: 'Inner Opening',     value: `${toDisplay(d.innerW)} × ${toDisplay(d.innerH)}` },
      { label: 'Outer Dimensions',  value: `${toDisplay(d.outerW)} × ${toDisplay(d.outerH)}` },
      { label: 'Frame Face Width',  value: toDisplay(d.frameW), sub: d.chosenLumber.nominal },
      { label: 'Lumber Needed',     value: `${d.totalFt} ft`, sub: `${d.totalNetFt} ft net + 10% waste` },
      { label: 'Est. Lumber Cost',  value: `$${d.estLow}–$${d.estHigh}` },
      { label: 'Joint Method',      value: d.joint === 'miter' ? '45° Miter' : 'Butt Joint' },
    ].map(s => `
      <div class="stat-item">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
        ${s.sub ? `<div class="stat-sub">${s.sub}</div>` : ''}
      </div>
    `).join('');

    // SVG diagram
    document.getElementById('result-diagram').innerHTML = buildFrameSVG(d);

    // Flags
    let flags = '';
    if (d.isFloat && d.maxPhotoDepth > 1.0) {
      flags += `<div class="info-box danger"><span class="info-icon">⚠️</span><div><strong>Floating Frame Depth Notice:</strong> Your canvas is ${frac(d.maxPhotoDepth)}" deep. Use 2×4 lumber (1.5" thick) or laminate two layers of 3/4" boards face-to-face.</div></div>`;
    }
    if (d.isFloat) {
      flags += `<div class="info-box"><span class="info-icon">ℹ️</span><div>Floating gap around canvas: <strong>${frac(d.floatGap)}"</strong> on all sides.</div></div>`;
    }
    document.getElementById('result-flags').innerHTML = flags;

    // Save button state
    const hasName = !!document.getElementById('proj-name').value.trim();
    document.getElementById('save-btn').disabled = !hasName;
    if (_editingId) {
      document.getElementById('save-btn').textContent = '💾 Update Project';
      document.getElementById('save-copy-btn').style.display = '';
    }

    // Cut list tab
    renderCutList(d);
    // Materials tab
    renderMaterials(d);
    // Hardware tab
    renderHardware(d);
    // Build guide tab
    renderBuildGuide(d);
  }

  function renderCutList(d) {
    const units = Settings.get().units;
    const unitNote = units === 'cm' ? 'cm' : 'inches';
    const cuts = d.allCuts;
    const total = cuts.reduce((s, c) => s + c.count * c.length, 0);

    const rows = cuts.map(c => `
      <tr>
        <td>${c.label}</td>
        <td class="mono-val">${c.count}</td>
        <td class="mono-val">${toDisplay(c.length)}</td>
        <td><span class="angle-badge ${c.angle === '45°' ? 'miter' : 'square'}">${c.angle}</span></td>
        <td style="font-size:0.78rem;color:var(--on-muted)">${c.note || ''}</td>
      </tr>
    `).join('');

    document.getElementById('result-cutlist').innerHTML = `
      <div class="info-box" style="margin-bottom:var(--s4)">
        <span class="info-icon">ℹ️</span>
        <div>All measurements in ${unitNote}. Miter = long-point to long-point.</div>
      </div>
      <div style="overflow-x:auto">
        <table class="cut-table">
          <thead>
            <tr>
              <th>Piece</th><th>Qty</th><th>Length</th><th>Angle</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="total-row">
              <td>Total (net)</td>
              <td class="mono-val">${cuts.reduce((s, c) => s + c.count, 0)}</td>
              <td class="mono-val">${toDisplay(total)}</td>
              <td colspan="2" style="color:var(--on-muted);font-size:0.8rem">+10% waste → buy ${toDisplay(r2(total * 1.1))} / ${d.totalFt} ft</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="margin-top:var(--s4);text-align:right">
        <button class="btn btn-ghost btn-sm" onclick="window.print()">🖨️ Print Cut List</button>
      </div>
    `;
  }

  function renderMaterials(d) {
    const s = Settings.get();
    const price = s.speciesPrices[d.species] || SPECIES_DEFAULTS[d.species];
    const speciesName = d.species.charAt(0).toUpperCase() + d.species.slice(1);
    const ul = d.useMoulding;

    let html = '';

    // Primary wood — face pieces
    const faceFt = r2(d.faceInches / 12);
    html += `
      <div class="lumber-section">
        <div class="lumber-section-label highlight">🪵 Primary Wood (Face Pieces)</div>
        <div class="lumber-highlight">
          <div class="lumber-detail"><strong>${d.chosenLumber.nominal}</strong> ${speciesName} — ${d.chosenLumber.dims}</div>
          <div class="lumber-breakdown">
            <div class="lbd-row"><span>Net linear footage</span><span class="lbd-val">${r2(d.faceInches / 12 / 1.10)} ft</span></div>
            <div class="lbd-row"><span>+10% waste factor</span><span class="lbd-val">${faceFt} ft</span></div>
            <div class="lbd-row"><span>Price per foot</span>
              <span class="lbd-val">
                <span class="price-edit-wrap">
                  <span class="price-display" id="price-display-${d.species}">$${price}/ft</span>
                  <button class="price-edit-btn" onclick="Builder.editPrice('${d.species}')" title="Edit price" aria-label="Edit price">✏️</button>
                  <input class="price-input-inline" id="price-input-${d.species}" type="number" value="${price}" min="0.1" step="0.05" onblur="Builder.savePrice('${d.species}')" onkeydown="Builder.priceKeyDown(event,'${d.species}')" />
                </span>
              </span>
            </div>
            <div class="lbd-row"><span>Estimated cost</span><span class="lbd-val">$${d.estLow}–$${d.estHigh}</span></div>
          </div>
        </div>
      </div>
    `;

    // Backer strips
    if (!ul && d.backerInches > 0) {
      const backerFt = r2(d.backerInches / 12);
      html += `
        <div class="lumber-section">
          <div class="lumber-section-label">📏 Backer Strips</div>
          <div class="lumber-ref">
            <div class="lumber-detail">3/8" × 3/4" screen mold (sold as "screen bead" at lumber yards)</div>
            <div class="lumber-breakdown">
              <div class="lbd-row"><span>Buy</span><span class="lbd-val">${backerFt} ft</span></div>
              <div class="lbd-row"><span>Est. cost</span><span class="lbd-val">~$${r2(backerFt * 0.40)}–$${r2(backerFt * 0.70)}</span></div>
            </div>
          </div>
        </div>
      `;
    }

    // Dividers
    if (d.divInches > 0) {
      const divFt = r2(d.divInches / 12);
      html += `
        <div class="lumber-section">
          <div class="lumber-section-label">📐 Divider Strips</div>
          <div class="lumber-ref">
            <div class="lumber-detail">Same lumber as face pieces (${d.chosenLumber.nominal})</div>
            <div class="lumber-breakdown">
              <div class="lbd-row"><span>Buy</span><span class="lbd-val">${divFt} ft</span></div>
            </div>
          </div>
        </div>
      `;
    }

    // Mat board
    if (d.matInfo) {
      const m = d.matInfo;
      html += `
        <div class="lumber-section">
          <div class="lumber-section-label">🗂️ Mat Board</div>
          <div class="lumber-ref">
            <div class="lumber-detail">Cut to <strong>${toDisplay(m.matW)} × ${toDisplay(m.matH)}</strong> outer, <strong>${toDisplay(m.openingW)} × ${toDisplay(m.openingH)}</strong> opening</div>
            <div class="lumber-breakdown">
              <div class="lbd-row"><span>Border (top &amp; sides)</span><span class="lbd-val">${toDisplay(m.borderTop)}</span></div>
              <div class="lbd-row"><span>Border (bottom)</span><span class="lbd-val">${toDisplay(m.borderBottom)}${m.weightedBot ? ' ★ weighted' : ''}</span></div>
              <div class="lbd-row"><span>Mat overlap (reveal)</span><span class="lbd-val">${toDisplay(m.reveal)}</span></div>
            </div>
          </div>
        </div>
      `;
    }

    document.getElementById('result-materials').innerHTML = html;
  }

  function renderHardware(d) {
    const inv = Store.getInventory();
    const owned = inv.map(i => i.name.toLowerCase());

    const isOwned = name => owned.some(n => name.toLowerCase().includes(n.split(' ')[0]) && n.split(' ')[0].length > 3);

    const items = d.hardware.map((item, idx) => {
      const own = isOwned(item.name);
      return `
        <div class="hw-item ${own ? 'owned' : ''}">
          <span class="hw-icon">${item.icon}</span>
          <div class="hw-item-body">
            <div class="hw-item-name">${item.name}</div>
            <div class="hw-item-note">${item.note}</div>
          </div>
          <div class="hw-item-actions">
            ${own ? '<span class="hw-owned-badge">✓ In Workshop</span>' : ''}
            <label class="hw-check-label">
              <input type="checkbox" onchange="Builder.toggleHwShoppingList(this,'${item.name.replace(/'/g, "\\'")}','${item.qty.replace(/'/g, "\\'")}')">
              Add to list
            </label>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('result-hardware').innerHTML = `<div class="hw-list">${items}</div>`;
  }

  function toggleHwShoppingList(cb, name, qty) {
    const inv = Store.getInventory();
    if (cb.checked) {
      const existing = inv.find(i => i.name === name);
      if (!existing) {
        Store.upsertItem({ id: Date.now().toString(), name, qty, status: 'needed', category: 'Frame Hardware', itemType: 'supply', unit: 'piece', notes: qty });
        Toast.show(`Added "${name}" to shopping list.`, 'success');
      }
    }
    App.updateBadges();
  }

  function renderBuildGuide(d) {
    const project = _editingId ? Store.getProject(_editingId) : null;
    const completedSteps = project?.stepsCompleted || [];

    const steps = d.stepKeys.map((type, idx) => {
      const meta = WOODWORKING_STEPS[type] || { title: type, difficulty: 'Simple', time: '—' };
      const text = getStepText(type, d.joint, d.isFloat, d.hasMat, d.isGlassless);
      const done = completedSteps.includes(type);
      const chipCls = meta.difficulty === 'Precise' ? 'chip-precise' : meta.difficulty === 'Careful' ? 'chip-careful' : 'chip-simple';

      return `
        <div class="build-step" id="bs-${type}">
          <div class="step-marker">
            <div class="step-number ${done ? 'done' : ''}" onclick="Builder.toggleStep('${type}', ${idx})" title="Mark done">
              ${done ? '' : (idx + 1)}
            </div>
            <div class="step-connector"></div>
          </div>
          <div class="step-content ${done ? 'done' : ''}" id="sc-${type}">
            <div class="step-header" onclick="Builder.expandStep('${type}')">
              <span class="step-title">${meta.title}</span>
              <div class="step-chips">
                <span class="step-chip ${chipCls}">${meta.difficulty}</span>
                <span class="step-chip" style="background:var(--surface-3);color:var(--on-muted)">⏱ ${meta.time}</span>
              </div>
              <span class="step-expand-icon">▾</span>
            </div>
            <div class="step-body">
              <p class="step-text">${text}</p>
            </div>
          </div>
        </div>
      `;
    });

    const totalSteps = d.stepKeys.length;
    const doneCount  = d.stepKeys.filter(k => completedSteps.includes(k)).length;
    const pct = totalSteps > 0 ? Math.round(doneCount / totalSteps * 100) : 0;

    document.getElementById('result-guide').innerHTML = `
      <div class="progress-bar-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="progress-label">${doneCount}/${totalSteps} steps</span>
      </div>
      <div class="build-timeline">${steps.join('')}</div>
    `;
  }

  function expandStep(type) {
    const sc = document.getElementById('sc-' + type);
    if (sc) sc.classList.toggle('expanded');
  }

  function toggleStep(type, idx) {
    if (!_editingId) {
      Toast.show('Save this project first to track build progress.', 'error');
      return;
    }
    const project = Store.getProject(_editingId);
    if (!project) return;
    const steps = project.stepsCompleted || [];
    const i = steps.indexOf(type);
    if (i >= 0) steps.splice(i, 1);
    else steps.push(type);
    Store.upsertProject({ ...project, stepsCompleted: steps, updatedAt: new Date().toISOString() });
    renderBuildGuide(lastResults);
  }

  /* ── Species price editing ── */
  function editPrice(species) {
    document.getElementById(`price-input-${species}`).classList.add('editing');
    document.getElementById(`price-input-${species}`).focus();
    document.getElementById(`price-display-${species}`).style.display = 'none';
  }

  function savePrice(species) {
    const val = parseFloat(document.getElementById(`price-input-${species}`).value);
    if (!isNaN(val) && val > 0) {
      const settings = Settings.get();
      settings.speciesPrices[species] = val;
      Settings.save({ speciesPrices: settings.speciesPrices });
      document.getElementById(`price-${species}`).textContent = `$${val}/ft`;
    }
    document.getElementById(`price-input-${species}`).classList.remove('editing');
    document.getElementById(`price-display-${species}`).style.display = '';
    if (lastResults) renderResults(lastResults);
  }

  function priceKeyDown(e, species) {
    if (e.key === 'Enter') savePrice(species);
    if (e.key === 'Escape') {
      document.getElementById(`price-input-${species}`).classList.remove('editing');
      document.getElementById(`price-display-${species}`).style.display = '';
    }
  }

  /* ── Save / Update project ── */
  function saveProject() {
    if (!lastResults) return;
    const name = document.getElementById('proj-name').value.trim();
    if (!name) { Toast.show('Please enter a project name before saving.', 'error'); return; }

    const d = lastResults;
    const id = _editingId || Date.now().toString();
    const existing = _editingId ? Store.getProject(_editingId) : null;

    const project = {
      id,
      name,
      notes:       document.getElementById('save-notes').value,
      buildStatus: existing?.buildStatus || 'not-started',
      stepsCompleted: existing?.stepsCompleted || [],
      createdAt:   existing?.createdAt || new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      // Calc results (needed for thumbnails + detail view)
      frameType:   d.frameType, joint: d.joint, species: d.species,
      isFloat:     d.isFloat,   isGlassless: d.isGlassless, hasMat: d.hasMat,
      isMulti:     d.isMulti,   arrangement: d.arrangement, photos: d.photos, divW: d.divW,
      frameW:      d.frameW,    innerW: d.innerW, innerH: d.innerH, outerW: d.outerW, outerH: d.outerH,
      totalFt:     d.totalFt,   estLow: d.estLow, estHigh: d.estHigh,
      allCuts:     d.allCuts,   matInfo: d.matInfo, hardware: d.hardware, stepKeys: d.stepKeys,
      chosenLumber: d.chosenLumber, materialType: d.materialType, useMoulding: d.useMoulding,
      faceInches: d.faceInches, backerInches: d.backerInches, divInches: d.divInches,
      floatGap: d.floatGap, maxPhotoDepth: d.maxPhotoDepth,
    };

    Store.upsertProject(project);
    _editingId = id;

    document.getElementById('editing-banner').classList.add('visible');
    document.getElementById('editing-name').textContent = name;
    document.getElementById('save-btn').textContent = '💾 Update Project';
    document.getElementById('save-copy-btn').style.display = '';

    Toast.show(`"${name}" saved successfully!`, 'success');
    App.updateBadges();
  }

  function saveAsCopy() {
    _editingId = null;
    const origName = document.getElementById('proj-name').value.trim();
    document.getElementById('proj-name').value = origName + ' (copy)';
    saveProject();
  }

  function loadProject(proj) {
    _editingId = proj.id;
    applyFormState({
      projName:     proj.name,
      notes:        proj.notes || '',
      frameType:    proj.frameType,
      isMulti:      proj.isMulti,
      arrangement:  proj.arrangement,
      photoCount:   proj.photos?.length?.toString() || '1',
      divW:         proj.divW || 0,
      joint:        proj.joint,
      species:      proj.species,
      widthMode:    'custom',
      customWidth:  proj.frameW,
      materialType: proj.materialType || 'lumber',
      hasMat:       proj.hasMat,
      matMode:      proj.matInfo ? 'custom' : 'auto',
      matBorder:    proj.matInfo?.border || 2.5,
      weightedBot:  proj.matInfo?.weightedBot || false,
      reveal:       proj.matInfo?.reveal || 0.25,
      floatGap:     proj.floatGap || 0.25,
      photos:       proj.photos || [{ w: 8, h: 10, d: 0.25 }],
    });
    App.nav('builder');
    document.getElementById('editing-banner').classList.add('visible');
    document.getElementById('editing-name').textContent = proj.name;
    document.getElementById('save-btn').textContent = '💾 Update Project';
    document.getElementById('save-copy-btn').style.display = '';
    calculate();
  }

  return {
    init, setToggle, getToggleVal, setFrameType, updateUnitLabels, updatePhotoLayout, renderPhotoRows,
    toggleCustomWidth, toggleMatOptions, toggleMatBorder, updateJointNote, updateMaterialNote,
    toggleDisclosure, calculate, switchResultTab, renderResults, clearEdit,
    scheduleDraftSave, saveDraft, checkDraft, restoreDraft, discardDraft,
    editPrice, savePrice, priceKeyDown, toggleHwShoppingList, expandStep, toggleStep,
    saveProject, saveAsCopy, loadProject,
    get lastResults() { return lastResults; },
  };
})();

/* ── PROJECTS MODULE ───────────────────────────────────────── */

const Projects = (() => {
  let _pendingDeleteId = null;
  let _detailId = null;

  function render() {
    const sort = document.getElementById('projects-sort').value;
    let projects = Store.getProjects();

    const active   = projects.filter(p => p.buildStatus !== 'complete');
    const complete = projects.filter(p => p.buildStatus === 'complete');

    const sortFn = (a, b) => {
      if (sort === 'oldest')  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'type')    return (a.frameType || '').localeCompare(b.frameType || '');
      if (sort === 'status')  return (a.buildStatus || '').localeCompare(b.buildStatus || '');
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    };

    active.sort(sortFn);
    complete.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const grid = document.getElementById('projects-grid');

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="projects-empty">
          <div class="projects-empty-icon">🖼️</div>
          <div class="projects-empty-title">No projects yet</div>
          <div class="projects-empty-sub">Build your first frame and save it here.</div>
          <button class="btn btn-primary" onclick="App.nav('builder')">📐 Start Building</button>
        </div>
      `;
      return;
    }

    const cardHTML = (p) => `
      <div class="project-card status-${p.buildStatus || 'not-started'}" data-id="${p.id}">
        <div class="project-quick-actions">
          <button class="quick-action-btn" onclick="Projects.duplicateProject('${p.id}')" title="Duplicate">📄</button>
          <button class="quick-action-btn danger" onclick="Projects.deleteProject('${p.id}','${esc(p.name)}')" title="Delete">🗑️</button>
        </div>
        <div class="project-thumb">${buildThumbnailSVG(p, 280, 120)}</div>
        <div class="project-body">
          <div class="project-name">${esc(p.name)}</div>
          <div class="project-date">${formatDate(p.createdAt)}</div>
          ${p.notes ? `<div class="project-notes-preview">${esc(p.notes)}</div>` : ''}
          <div class="project-tags">
            <span class="tag tag-${p.frameType || 'regular'}">${typeLabel(p.frameType)}</span>
            ${p.species ? `<span class="tag tag-default">${p.species}</span>` : ''}
            ${p.joint   ? `<span class="tag tag-default">${p.joint === 'miter' ? '45° Miter' : 'Butt Joint'}</span>` : ''}
            ${p.isMulti ? `<span class="tag tag-default">${p.photos?.length || 2} photos</span>` : ''}
          </div>
          ${statusPill(p.buildStatus)}
        </div>
        <div class="project-actions">
          <button class="btn btn-secondary btn-sm" onclick="Projects.openDetail('${p.id}')">View</button>
          <button class="btn btn-primary btn-sm" onclick="Builder.loadProject(Store.getProject('${p.id}'))">✏️ Edit</button>
        </div>
      </div>
    `;

    let html = active.map(cardHTML).join('');
    if (complete.length > 0) {
      html += `<div class="complete-divider"><span class="complete-divider-label">✓ Completed</span></div>`;
      html += complete.map(cardHTML).join('');
    }
    grid.innerHTML = html;
  }

  function openDetail(id) {
    const p = Store.getProject(id);
    if (!p) return;
    _detailId = id;
    document.getElementById('modal-detail-title').textContent = p.name;
    document.getElementById('modal-detail-content').innerHTML = renderDetailContent(p);
    App.openModal('modal-project-detail');
  }

  function renderDetailContent(p) {
    const svg = buildFrameSVG(p, 220);
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s3);margin-bottom:var(--s4)">
        <div class="stat-item"><div class="stat-label">Inner Opening</div><div class="stat-value">${toDisplay(p.innerW)} × ${toDisplay(p.innerH)}</div></div>
        <div class="stat-item"><div class="stat-label">Outer Dims</div><div class="stat-value">${toDisplay(p.outerW)} × ${toDisplay(p.outerH)}</div></div>
        <div class="stat-item"><div class="stat-label">Frame Width</div><div class="stat-value">${toDisplay(p.frameW)}</div></div>
        <div class="stat-item"><div class="stat-label">Lumber</div><div class="stat-value">${p.totalFt} ft</div></div>
      </div>
      <div style="text-align:center;padding:var(--s4);background:var(--surface-2);border-radius:var(--r-lg);margin-bottom:var(--s4)">${svg}</div>
      <div style="margin-bottom:var(--s4)">
        <div class="stat-label" style="margin-bottom:var(--s2)">Build Status</div>
        <div class="toggle-group" role="radiogroup">
          ${['not-started','in-progress','complete'].map(s => `
            <button class="tog ${p.buildStatus === s ? 'on' : ''}" data-val="${s}" onclick="Projects.setStatus('${p.id}','${s}',this)">${statusLabel(s)}</button>
          `).join('')}
        </div>
      </div>
      <div>
        <label class="stat-label" for="detail-notes">Notes</label>
        <textarea id="detail-notes" rows="3" style="resize:vertical;width:100%;margin-top:var(--s2)">${esc(p.notes || '')}</textarea>
        <button class="btn btn-secondary btn-sm" style="margin-top:var(--s2)" onclick="Projects.saveNotes('${p.id}')">Save Notes</button>
      </div>
    `;
  }

  function setStatus(id, status, btn) {
    const p = Store.getProject(id);
    if (!p) return;
    Store.upsertProject({ ...p, buildStatus: status, updatedAt: new Date().toISOString() });
    btn.closest('.toggle-group').querySelectorAll('.tog').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    render();
    App.updateBadges();
  }

  function saveNotes(id) {
    const p = Store.getProject(id);
    if (!p) return;
    const notes = document.getElementById('detail-notes').value;
    Store.upsertProject({ ...p, notes, updatedAt: new Date().toISOString() });
    Toast.show('Notes saved.', 'success');
  }

  function loadIntoBuilder() {
    const p = _detailId ? Store.getProject(_detailId) : null;
    if (p) { App.closeModal('modal-project-detail'); Builder.loadProject(p); }
  }

  function duplicateFromModal() {
    if (_detailId) duplicateProject(_detailId);
    App.closeModal('modal-project-detail');
  }

  function duplicateProject(id) {
    const p = Store.getProject(id);
    if (!p) return;
    const copy = { ...p, id: Date.now().toString(), name: p.name + ' (copy)', buildStatus: 'not-started', stepsCompleted: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    Store.upsertProject(copy);
    render();
    App.updateBadges();
    Toast.show(`"${p.name}" duplicated.`, 'success');
  }

  function deleteProject(id, name) {
    _pendingDeleteId = id;
    document.getElementById('delete-project-name').textContent = name;
    App.openModal('modal-delete-confirm');
  }

  function confirmDelete() {
    if (_pendingDeleteId) {
      Store.deleteProject(_pendingDeleteId);
      _pendingDeleteId = null;
      App.closeModal('modal-delete-confirm');
      App.closeModal('modal-project-detail');
      render();
      App.updateBadges();
      Toast.show('Project deleted.', 'success');
    }
  }

  return { render, openDetail, setStatus, saveNotes, loadIntoBuilder, duplicateFromModal, duplicateProject, deleteProject, confirmDelete };
})();

/* ── WORKSHOP MODULE ───────────────────────────────────────── */

const Workshop = (() => {
  let _editingItemId = null;
  let _activeTab = 'all';
  let _activeCategory = null;
  let _statusFilter = null;

  const CATEGORY_ICONS = {
    'Power Tools': '⚡', 'Hand Tools': '🔨', 'Clamps & Vises': '🗜️',
    'Fasteners': '🔩', 'Adhesives & Fillers': '🪣', 'Abrasives': '📄',
    'Frame Hardware': '🖼️', 'Lumber': '🪵', 'Finishing': '🎨',
    'Glass & Backing': '🪟', 'Other Supplies': '📦',
  };

  function render() {
    renderStats();
    renderFilterChips();
    renderItems();
  }

  function renderStats() {
    const inv = Store.getInventory();
    const bar = document.getElementById('ws-stats-bar');
    const owned    = inv.filter(i => i.status === 'owned').length;
    const needed   = inv.filter(i => i.status === 'needed').length;
    const wishlist = inv.filter(i => i.status === 'wishlist').length;
    bar.innerHTML = `
      <div class="ws-stat"><span class="ws-stat-num">${inv.length}</span> total items</div>
      <div class="ws-stat"><span class="ws-stat-num">${owned}</span> owned</div>
      <div class="ws-stat" style="color:var(--on-muted)"><span class="ws-stat-num" style="color:var(--on-bg)">${needed}</span> need to buy</div>
      <div class="ws-stat"><span class="ws-stat-num">${wishlist}</span> wishlist</div>
    `;
  }

  function renderFilterChips() {
    const inv = Store.getInventory();
    const categories = [...new Set(inv.map(i => i.category).filter(Boolean))].sort();
    const row = document.getElementById('ws-filter-row');
    const allBtn = `<button class="ws-filter-btn ${!_activeCategory ? 'active' : ''}" onclick="Workshop.setCategory(null)">All</button>`;
    row.innerHTML = allBtn + categories.map(cat =>
      `<button class="ws-filter-btn ${_activeCategory === cat ? 'active' : ''}" onclick="Workshop.setCategory('${cat.replace(/'/g, "\\'")}')">${CATEGORY_ICONS[cat] || '📦'} ${cat}</button>`
    ).join('');
  }

  function renderItems() {
    const inv = Store.getInventory();
    const search = document.getElementById('ws-search').value.toLowerCase();

    let filtered = inv.filter(item => {
      if (_activeTab === 'tools'    && item.itemType !== 'tool')   return false;
      if (_activeTab === 'supplies' && item.itemType !== 'supply') return false;
      if (_statusFilter && item.status !== _statusFilter) return false;
      if (_activeCategory && item.category !== _activeCategory)    return false;
      if (search && !item.name.toLowerCase().includes(search) && !(item.notes || '').toLowerCase().includes(search)) return false;
      return true;
    });

    const content = document.getElementById('ws-content');
    if (filtered.length === 0) {
      content.innerHTML = `
        <div class="ws-empty">
          <div class="ws-empty-icon">🗄️</div>
          <div>${inv.length === 0 ? 'No items yet. Add tools & supplies to your workshop.' : 'No items match your filters.'}</div>
          ${inv.length === 0 ? '<button class="btn btn-primary btn-sm" style="margin-top:var(--s4)" onclick="Workshop.showAddModal()">+ Add First Item</button>' : ''}
        </div>
      `;
      return;
    }

    // Group by category
    const grouped = {};
    filtered.forEach(item => {
      const cat = item.category || 'Other Supplies';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    content.innerHTML = Object.entries(grouped).map(([cat, items]) => `
      <div>
        <div class="ws-category-header">
          <span class="ws-category-icon">${CATEGORY_ICONS[cat] || '📦'}</span>
          ${cat} <span style="margin-left:auto;font-size:0.7rem">${items.length}</span>
        </div>
        <div class="ws-items-grid">
          ${items.map(item => renderItemCard(item)).join('')}
        </div>
      </div>
    `).join('');
  }

  function renderItemCard(item) {
    const iconMap = { tool: '🔧', supply: '📦' };
    const icon = item.emoji || iconMap[item.itemType] || '📦';
    const statusCls = { owned: 'ws-owned', needed: 'ws-needed', wishlist: 'ws-wishlist' }[item.status] || 'ws-needed';
    const statusLabel = { owned: '✓ Owned', needed: '○ Need to Buy', wishlist: '⭐ Wishlist' }[item.status] || item.status;
    const nextStatus = { owned: 'needed', needed: 'wishlist', wishlist: 'owned' }[item.status] || 'owned';
    const nextLabel  = { owned: 'Mark Needed', needed: '⭐ Wishlist', wishlist: 'Mark Owned' }[item.status] || 'Toggle';

    return `
      <div class="ws-item">
        <button class="ws-delete-btn" onclick="Workshop.deleteItem('${item.id}')" aria-label="Delete ${esc(item.name)}">✕</button>
        <div class="ws-item-icon">${icon}</div>
        <div class="ws-item-name">${esc(item.name)}</div>
        <div class="ws-item-qty">${item.qty || 1} ${item.unit || 'piece'}</div>
        ${item.notes ? `<div class="ws-item-notes">${esc(item.notes)}</div>` : ''}
        <div class="ws-item-footer">
          <span class="ws-status-badge ${statusCls}">${statusLabel}</span>
          <button class="ws-toggle-btn" onclick="Workshop.toggleStatus('${item.id}','${nextStatus}')">${nextLabel}</button>
        </div>
      </div>
    `;
  }

  function setTab(tab, btn) {
    _activeTab = tab;
    document.querySelectorAll('.ws-sub-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    renderItems();
  }

  function setCategory(cat) {
    _activeCategory = cat;
    renderFilterChips();
    renderItems();
  }

  function setStatusFilter(filter) {
    _statusFilter = filter;
    renderItems();
  }

  function toggleStatus(id, status) {
    const item = Store.getInventory().find(i => i.id === id);
    if (!item) return;
    Store.upsertItem({ ...item, status });
    render();
    App.updateBadges();
  }

  function deleteItem(id) {
    Store.deleteItem(id);
    render();
    App.updateBadges();
  }

  /* ── Add / Edit modal ── */
  function showAddModal(editId = null) {
    _editingItemId = editId;
    const modal = document.getElementById('modal-add-item');
    document.getElementById('modal-add-title').textContent = editId ? 'Edit Item' : 'Add Workshop Item';
    document.getElementById('ws-save-btn').textContent = editId ? 'Update Item' : 'Save Item';

    if (editId) {
      const item = Store.getInventory().find(i => i.id === editId);
      if (item) {
        document.getElementById('ws-item-name').value     = item.name;
        document.getElementById('ws-item-category').value = item.category || 'Other Supplies';
        document.getElementById('ws-item-qty').value      = item.qty || 1;
        document.getElementById('ws-item-unit').value     = item.unit || 'piece';
        document.getElementById('ws-item-notes').value    = item.notes || '';
        setItemType(item.itemType || 'supply', modal.querySelector(`[data-val="${item.itemType || 'supply'}"]`));
        setItemToggle('tg-item-status', modal.querySelector(`[data-val="${item.status || 'owned'}"]`));
      }
    } else {
      document.getElementById('ws-item-name').value     = '';
      document.getElementById('ws-item-category').value = 'Other Supplies';
      document.getElementById('ws-item-qty').value      = '1';
      document.getElementById('ws-item-unit').value     = 'piece';
      document.getElementById('ws-item-notes').value    = '';
      setItemToggle('tg-item-status', modal.querySelector('[data-val="owned"]'));
      setItemType('supply', modal.querySelector('[data-val="supply"]'));
    }

    App.openModal('modal-add-item');
    setTimeout(() => document.getElementById('ws-item-name').focus(), 100);
  }

  function closeAddModal() { App.closeModal('modal-add-item'); }

  function setItemType(type, btn) {
    document.querySelectorAll('#tg-item-type .tog').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    if (btn) { btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); }
    const catSel = document.getElementById('ws-item-category');
    if (type === 'tool') {
      ['Power Tools', 'Hand Tools', 'Clamps & Vises'].forEach(opt => {
        if (catSel.value === 'Other Supplies' || catSel.value === 'Fasteners') catSel.value = 'Hand Tools';
      });
    }
  }

  function setItemToggle(groupId, btn) {
    document.querySelectorAll('#' + groupId + ' .tog').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    if (btn) { btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); }
  }

  function saveItem() {
    const name = document.getElementById('ws-item-name').value.trim();
    if (!name) { Toast.show('Please enter an item name.', 'error'); return; }

    const itemType = document.querySelector('#tg-item-type .tog.on')?.dataset.val || 'supply';
    const status   = document.querySelector('#tg-item-status .tog.on')?.dataset.val || 'owned';

    const item = {
      id:       _editingItemId || Date.now().toString(),
      name,
      category: document.getElementById('ws-item-category').value,
      itemType,
      qty:      parseFloat(document.getElementById('ws-item-qty').value) || 1,
      unit:     document.getElementById('ws-item-unit').value.trim() || 'piece',
      notes:    document.getElementById('ws-item-notes').value.trim(),
      status,
      minQty: null, paidPrice: null, linkedProjectIds: [],
    };

    Store.upsertItem(item);
    closeAddModal();
    render();
    App.updateBadges();
    Toast.show(`"${name}" ${_editingItemId ? 'updated' : 'added'}.`, 'success');
    _editingItemId = null;
  }

  /* ── Shopping list modal ── */
  function showShoppingList() {
    const needed = Store.getInventory().filter(i => i.status === 'needed');
    const content = document.getElementById('shopping-list-content');

    if (needed.length === 0) {
      content.innerHTML = '<p style="color:var(--on-muted);text-align:center;padding:var(--s5)">Nothing on the shopping list — everything is owned!</p>';
    } else {
      content.innerHTML = `
        <div class="shopping-list-items">
          ${needed.map(i => `
            <div class="shopping-list-item">
              <div><div class="sli-name">${esc(i.name)}</div><div class="sli-cat">${i.category || ''}</div></div>
              <span class="sli-qty">${i.qty} ${i.unit || ''}</span>
            </div>
          `).join('')}
        </div>
        <p style="font-size:0.82rem;color:var(--on-muted)">${needed.length} item${needed.length !== 1 ? 's' : ''} to buy</p>
      `;
    }
    App.openModal('modal-shopping-list');
  }

  function copyShoppingList() {
    const needed = Store.getInventory().filter(i => i.status === 'needed');
    const text = needed.map(i => `${i.name} — ${i.qty} ${i.unit || ''} [${i.category || ''}]`).join('\n');
    navigator.clipboard.writeText(text).then(() => Toast.show('Shopping list copied to clipboard!', 'success'));
  }

  return {
    render, setTab, setCategory, setStatusFilter, toggleStatus, deleteItem,
    showAddModal, closeAddModal, setItemType, setItemToggle, saveItem,
    showShoppingList, copyShoppingList,
  };
})();

/* ── HELPERS ───────────────────────────────────────────────── */

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function typeLabel(type) {
  return { regular: 'Regular Frame', glassless: 'Glassless', floating: 'Floating Frame' }[type] || type || 'Frame';
}

function statusLabel(s) {
  return { 'not-started': 'Not Started', 'in-progress': 'In Progress', 'complete': 'Complete' }[s] || s;
}

function statusPill(s) {
  const labels = { 'not-started': 'Not Started', 'in-progress': '▶ In Progress', 'complete': '✓ Complete' };
  const cls    = { 'not-started': 'status-not-started', 'in-progress': 'status-in-progress', 'complete': 'status-complete' };
  return `<span class="status-pill ${cls[s] || 'status-not-started'}">${labels[s] || 'Not Started'}</span>`;
}

/* ── PWA SERVICE WORKER REGISTRATION ───────────────────────── */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ── BOOT ──────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => App.init());
