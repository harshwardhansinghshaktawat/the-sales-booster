/**
 * CUSTOM ELEMENT — Real Estate Listings Search & Filter (with Map View)
 * Tag: <real-estate-search>
 *
 * Attributes:
 *   listing-data  — JSON: { listings[] }
 *
 * Events:
 *   navigate-to-listing  — { slug }
 *
 * Map: OpenStreetMap via Leaflet (loaded from CDN, no API key needed)
 * Pins use latitude/longitude CMS fields. Hover shows card popup.
 * Map auto-fits bounds to filtered listings.
 */

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>`,
  close:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevD:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  chevL:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevR:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  bed:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V3h20v6"/><path d="M2 22V12a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10"/><path d="M6 12h12"/><path d="M2 22h20"/></svg>`,
  bath:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
  sqft:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>`,
  pin:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  reset:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  grid:   `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  list:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>`,
  mapico: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  empty:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  save:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  arrow:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Inter:wght@300;400;500;600&display=swap');
  @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :host {
    --accent:       #BB5127;
    --accent-hover: #4E4221;
    --accent-light: #fdf3ee;
    --accent-mid:   rgba(187,81,39,0.12);
    --ink:          #111111;
    --ink-light:    #444444;
    --ink-muted:    #888888;
    --border:       #e4e0da;
    --border-dark:  #ccc8c0;
    --surface:      #ffffff;
    --bg:           #f9f7f5;
    --pill-radius:  100px;
    --radius:       8px;
    --shadow-sm:    0 2px 10px rgba(0,0,0,0.06);
    --shadow-md:    0 6px 24px rgba(0,0,0,0.10);
    --shadow-lg:    0 16px 48px rgba(0,0,0,0.14);
    --font-body:    'Inter', system-ui, sans-serif;
    --font-display: 'Lora', Georgia, serif;
    display: block; width: 100%;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--ink);
    background: var(--bg);
  }

  .rs-wrap { min-height: 400px; }

  /* ── TOP BAR ── */
  .rs-topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 12px 20px;
    position: sticky; top: 0; z-index: 50;
    box-shadow: var(--shadow-sm);
  }
  .rs-topbar-inner { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .rs-search-wrap { flex: 1; min-width: 200px; position: relative; }
  .rs-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ink-muted); pointer-events: none; }
  .rs-search-icon svg { width: 15px; height: 15px; }
  .rs-search {
    width: 100%; height: 40px;
    padding: 0 12px 0 36px;
    border: 1.5px solid var(--border-dark);
    border-radius: var(--pill-radius);
    font-family: var(--font-body); font-size: 13.5px; color: var(--ink);
    background: var(--bg); outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .rs-search::placeholder { color: var(--ink-muted); }
  .rs-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-mid); background: var(--surface); }

  .rs-pills { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  /* ── PILL ── */
  .rs-pill {
    position: relative;
    display: inline-flex; align-items: center; gap: 5px;
    height: 38px; padding: 0 14px;
    border: 1.5px solid var(--border-dark);
    border-radius: var(--pill-radius);
    background: var(--surface);
    font-family: var(--font-body); font-size: 13px; font-weight: 500;
    color: var(--ink); cursor: pointer; white-space: nowrap;
    transition: border-color .2s, box-shadow .2s; user-select: none;
  }
  .rs-pill:hover { border-color: var(--accent); }
  .rs-pill.active { border-color: var(--accent); box-shadow: 0 2px 8px var(--accent-mid); }
  .rs-pill.has-val { background: var(--ink); border-color: var(--ink); color: #fff; }
  .rs-pill .pill-caret { width: 12px; height: 12px; transition: transform .2s; flex-shrink: 0; }
  .rs-pill.active .pill-caret { transform: rotate(180deg); }

  /* ── DROPDOWN ── */
  .rs-dropdown {
    position: absolute; top: calc(100% + 8px); left: 0;
    min-width: 280px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 12px;
    box-shadow: var(--shadow-lg); padding: 18px; z-index: 200;
    opacity: 0; transform: translateY(-6px); pointer-events: none;
    transition: opacity .16s ease, transform .16s ease;
  }
  .rs-pill.active .rs-dropdown { opacity: 1; transform: translateY(0); pointer-events: all; }
  .rs-dropdown-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-muted); margin-bottom: 12px; }

  .rs-range-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .rs-range-row label { font-size: 11px; color: var(--ink-muted); min-width: 22px; }
  .rs-select {
    flex: 1; height: 36px;
    border: 1.5px solid var(--border-dark); border-radius: var(--radius);
    padding: 0 26px 0 10px;
    font-family: var(--font-body); font-size: 13px; color: var(--ink);
    background: var(--surface); outline: none; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23888' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 9px center;
    transition: border-color .2s;
  }
  .rs-select:focus { border-color: var(--accent); }

  .rs-price-row { display: grid; grid-template-columns: 1fr 16px 1fr; align-items: center; gap: 6px; margin-bottom: 14px; }
  .rs-price-inp-wrap { position: relative; }
  .rs-price-inp-wrap span { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--ink-muted); font-size: 13px; pointer-events: none; }
  .rs-price-inp {
    width: 100%; height: 36px;
    border: 1.5px solid var(--border-dark); border-radius: var(--radius);
    padding: 0 8px 0 20px;
    font-family: var(--font-body); font-size: 13px; color: var(--ink);
    outline: none; transition: border-color .2s;
  }
  .rs-price-inp:focus { border-color: var(--accent); }
  .rs-price-dash { text-align: center; color: var(--ink-muted); font-size: 13px; }

  .rs-slider-track { position: relative; height: 4px; background: var(--border); border-radius: 2px; margin: 14px 2px; }
  .rs-slider-fill { position: absolute; height: 100%; background: var(--accent); border-radius: 2px; pointer-events: none; }
  .rs-slider-track input[type=range] {
    position: absolute; width: 100%; top: 50%; transform: translateY(-50%);
    appearance: none; background: transparent; pointer-events: none; height: 4px;
  }
  .rs-slider-track input[type=range]::-webkit-slider-thumb {
    appearance: none; width: 18px; height: 18px; border-radius: 50%;
    background: var(--surface); border: 2px solid var(--accent);
    box-shadow: 0 1px 6px rgba(0,0,0,0.2); cursor: pointer; pointer-events: all; transition: transform .15s;
  }
  .rs-slider-track input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
  .rs-slider-hi { z-index: 2; }
  .rs-slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--accent); font-weight: 600; margin-bottom: 14px; }

  .rs-check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .rs-check-item {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    border: 1.5px solid var(--border); border-radius: var(--radius);
    cursor: pointer; font-size: 13px; transition: border-color .18s, background .18s; user-select: none;
  }
  .rs-check-item:hover { border-color: var(--accent); background: var(--accent-light); }
  .rs-check-item.sel { border-color: var(--accent); background: var(--accent-light); }
  .rs-chkbox {
    width: 15px; height: 15px; flex-shrink: 0;
    border: 2px solid var(--border-dark); border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: transparent; transition: all .15s;
  }
  .rs-check-item.sel .rs-chkbox { background: var(--accent); border-color: var(--accent); color: #fff; }

  .rs-status-btns { display: flex; gap: 7px; flex-wrap: wrap; }
  .rs-status-btn {
    height: 32px; padding: 0 14px; border-radius: var(--pill-radius);
    border: 1.5px solid var(--border-dark); background: var(--surface);
    font-family: var(--font-body); font-size: 13px; font-weight: 500;
    color: var(--ink); cursor: pointer; transition: all .18s;
  }
  .rs-status-btn.sel { background: var(--ink); border-color: var(--ink); color: #fff; }

  .rs-drop-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
  .rs-drop-reset {
    height: 32px; padding: 0 14px; border-radius: var(--pill-radius);
    border: 1.5px solid var(--border-dark); background: transparent;
    font-family: var(--font-body); font-size: 12px; color: var(--ink-muted); cursor: pointer; transition: border-color .18s;
  }
  .rs-drop-reset:hover { border-color: var(--ink); color: var(--ink); }
  .rs-drop-apply {
    height: 32px; padding: 0 16px; border-radius: var(--pill-radius);
    border: none; background: var(--ink); color: #fff;
    font-family: var(--font-body); font-size: 12px; font-weight: 600; cursor: pointer; transition: background .18s;
  }
  .rs-drop-apply:hover { background: var(--accent); }

  .rs-all-filters-btn {
    display: inline-flex; align-items: center; gap: 7px;
    height: 38px; padding: 0 16px;
    border: 1.5px solid var(--ink); border-radius: var(--pill-radius);
    background: var(--surface);
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    color: var(--ink); cursor: pointer; white-space: nowrap;
    transition: background .18s, color .18s;
  }
  .rs-all-filters-btn:hover { background: var(--ink); color: #fff; }
  .rs-all-filters-btn svg { width: 14px; height: 14px; }
  .rs-all-filters-btn .rs-badge {
    background: var(--accent); color: #fff;
    border-radius: var(--pill-radius); font-size: 11px; font-weight: 700;
    min-width: 18px; height: 18px;
    display: inline-flex; align-items: center; justify-content: center; padding: 0 4px;
  }

  /* ── RESULTS BAR ── */
  .rs-results-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px 10px; flex-wrap: wrap; gap: 10px;
  }
  .rs-results-count { font-family: var(--font-display); font-size: 20px; font-weight: 600; }
  .rs-results-count small { font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--ink-muted); margin-left: 6px; }
  .rs-results-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .rs-sort-select {
    height: 34px; padding: 0 26px 0 10px;
    border: 1.5px solid var(--border-dark); border-radius: var(--radius);
    font-family: var(--font-body); font-size: 13px; color: var(--ink);
    background: var(--surface); outline: none; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23888' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 9px center;
  }
  .rs-sort-select:focus { border-color: var(--accent); }

  /* View toggle — 3 buttons now */
  .rs-view-toggle { display: flex; border: 1.5px solid var(--border-dark); border-radius: var(--radius); overflow: hidden; }
  .rs-view-btn {
    width: 36px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface); border: none; cursor: pointer;
    color: var(--ink-muted); transition: background .15s, color .15s;
  }
  .rs-view-btn svg { width: 14px; height: 14px; }
  .rs-view-btn.active { background: var(--ink); color: #fff; }
  .rs-view-btn + .rs-view-btn { border-left: 1px solid var(--border-dark); }

  /* ── ACTIVE TAGS ── */
  .rs-tags { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; padding: 0 20px 12px; min-height: 0; }
  .rs-tag {
    display: inline-flex; align-items: center; gap: 6px;
    height: 28px; padding: 0 12px;
    background: var(--ink); color: #fff; border-radius: var(--pill-radius);
    font-size: 12px; font-weight: 500; animation: tagIn .18s ease;
  }
  @keyframes tagIn { from { opacity:0; transform:scale(.88); } to { opacity:1; transform:scale(1); } }
  .rs-tag-x { cursor: pointer; opacity: .65; font-size: 14px; line-height: 1; transition: opacity .14s; }
  .rs-tag-x:hover { opacity: 1; }
  .rs-clear-all {
    height: 28px; padding: 0 12px; border-radius: var(--pill-radius);
    border: 1.5px solid var(--border-dark); background: transparent;
    font-family: var(--font-body); font-size: 12px; color: var(--ink-muted); cursor: pointer; transition: all .18s;
  }
  .rs-clear-all:hover { border-color: var(--accent); color: var(--accent); }

  /* ── ALL FILTERS PANEL ── */
  .rs-panel-ov {
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    z-index: 300; opacity: 0; pointer-events: none; transition: opacity .25s;
  }
  .rs-panel-ov.open { opacity: 1; pointer-events: all; }
  .rs-panel {
    position: fixed; top: 0; right: 0;
    width: 460px; max-width: 100vw; height: 100%;
    background: var(--surface); z-index: 301;
    transform: translateX(100%); transition: transform .3s cubic-bezier(.4,0,.2,1);
    display: flex; flex-direction: column;
    box-shadow: -8px 0 48px rgba(0,0,0,.18);
  }
  .rs-panel-ov.open .rs-panel { transform: translateX(0); }
  .rs-panel-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 24px; border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .rs-panel-head h2 { font-family: var(--font-display); font-size: 20px; font-weight: 600; }
  .rs-panel-close {
    width: 34px; height: 34px; border-radius: 50%;
    border: 1.5px solid var(--border-dark); background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center; color: var(--ink); transition: background .15s;
  }
  .rs-panel-close:hover { background: var(--border); }
  .rs-panel-close svg { width: 16px; height: 16px; }
  .rs-panel-body { flex: 1; overflow-y: auto; }
  .rs-panel-body::-webkit-scrollbar { width: 4px; }
  .rs-panel-body::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 2px; }
  .rs-panel-sec { padding: 18px 24px; border-bottom: 1px solid var(--border); }
  .rs-panel-sec-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.1px; color: var(--ink-muted); margin-bottom: 12px; }
  .rs-panel-footer { padding: 18px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; flex-shrink: 0; }
  .rs-panel-reset {
    flex: 1; height: 42px; border-radius: var(--pill-radius);
    border: 1.5px solid var(--border-dark); background: transparent;
    font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--ink); cursor: pointer; transition: border-color .18s;
  }
  .rs-panel-reset:hover { border-color: var(--ink); }
  .rs-panel-apply {
    flex: 2; height: 42px; border-radius: var(--pill-radius);
    border: none; background: var(--accent); color: #fff;
    font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; transition: background .18s;
  }
  .rs-panel-apply:hover { background: var(--accent-hover); }

  .rs-special-tags { display: flex; gap: 8px; flex-wrap: wrap; }
  .rs-special-btn {
    height: 32px; padding: 0 14px; border-radius: var(--pill-radius);
    border: 1.5px solid var(--border-dark); background: var(--surface);
    font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--ink); cursor: pointer; transition: all .18s;
  }
  .rs-special-btn.sel { background: var(--accent); border-color: var(--accent); color: #fff; }

  .rs-nbhd-list { max-height: 180px; overflow-y: auto; border: 1.5px solid var(--border-dark); border-radius: var(--radius); }
  .rs-nbhd-list::-webkit-scrollbar { width: 4px; }
  .rs-nbhd-list::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 2px; }
  .rs-nbhd-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; font-size: 13.5px; transition: background .14s; }
  .rs-nbhd-item:hover { background: var(--accent-light); }
  .rs-nbhd-item.sel { background: var(--accent-light); }
  .rs-nbhd-cb { width: 15px; height: 15px; border: 2px solid var(--border-dark); border-radius: 3px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; color: transparent; transition: all .14s; }
  .rs-nbhd-item.sel .rs-nbhd-cb { background: var(--accent); border-color: var(--accent); color: #fff; }

  /* ── GRID / LIST ── */
  .rs-grid-section { padding: 0 20px 40px; }
  .rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px; }
  .rs-grid.list-view { grid-template-columns: 1fr; }

  /* ── CARD ── */
  .rs-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm);
    transition: transform .22s, box-shadow .22s, border-color .22s;
    cursor: pointer; display: flex; flex-direction: column;
  }
  .rs-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: rgba(187,81,39,.3); }
  .rs-grid.list-view .rs-card { flex-direction: row; }
  .rs-card-img {
    width: 100%; height: 210px; position: relative; overflow: hidden;
    background: #f0ece6; display: flex; align-items: center; justify-content: center; font-size: 64px; flex-shrink: 0;
  }
  .rs-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s; }
  .rs-card:hover .rs-card-img img { transform: scale(1.05); }
  .rs-grid.list-view .rs-card-img { width: 280px; height: auto; min-height: 180px; flex-shrink: 0; }
  .rs-card-badge {
    position: absolute; top: 10px; left: 10px;
    height: 22px; padding: 0 10px; border-radius: var(--pill-radius);
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
    display: flex; align-items: center;
  }
  .rs-badge-active { background: #15803d; color: #fff; }
  .rs-badge-pending { background: #b45309; color: #fff; }
  .rs-badge-contingency { background: #1d4ed8; color: #fff; }
  .rs-badge-sold { background: #6b7280; color: #fff; }
  .rs-badge-new { background: var(--accent); color: #fff; position: absolute; top: 10px; right: 10px; left: auto; }
  .rs-card-save {
    position: absolute; bottom: 10px; right: 10px;
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--surface); display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,.15); transition: transform .15s;
  }
  .rs-card-save:hover { transform: scale(1.1); }
  .rs-card-save svg { width: 14px; height: 14px; color: var(--ink-muted); }
  .rs-card-body { padding: 18px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .rs-card-price { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--accent); }
  .rs-card-price-orig { font-size: 14px; font-weight: 400; color: var(--ink-muted); text-decoration: line-through; margin-left: 6px; }
  .rs-card-addr { font-size: 13.5px; color: var(--ink-light); line-height: 1.45; }
  .rs-card-addr strong { display: block; color: var(--ink); font-weight: 600; font-size: 14px; margin-bottom: 2px; }
  .rs-card-specs { display: flex; gap: 14px; flex-wrap: wrap; }
  .rs-card-spec { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--ink-light); }
  .rs-card-spec svg { width: 13px; height: 13px; color: var(--ink-muted); flex-shrink: 0; }
  .rs-card-spec strong { font-weight: 600; color: var(--ink); }
  .rs-card-type { font-size: 11.5px; color: var(--ink-muted); font-weight: 500; text-transform: uppercase; letter-spacing: .5px; }
  .rs-card-foot { padding: 12px 18px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .rs-card-cta {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    color: var(--accent); background: none; border: none; cursor: pointer; transition: gap .18s; padding: 0;
  }
  .rs-card-cta svg { width: 14px; height: 14px; transition: transform .18s; }
  .rs-card-cta:hover svg { transform: translateX(3px); }
  .rs-card-sqft { font-size: 12px; color: var(--ink-muted); display: flex; align-items: center; gap: 4px; }
  .rs-card-sqft svg { width: 12px; height: 12px; }

  /* ── EMPTY ── */
  .rs-empty { grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: var(--ink-muted); }
  .rs-empty svg { width: 56px; height: 56px; color: var(--border-dark); margin: 0 auto 16px; display: block; }
  .rs-empty h3 { font-family: var(--font-display); font-size: 20px; font-weight: 600; color: var(--ink-light); margin-bottom: 8px; }

  /* Loading */
  .rs-loading { display: flex; align-items: center; justify-content: center; padding: 80px 20px; flex-direction: column; gap: 16px; color: var(--ink-muted); }
  .rs-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── PAGINATION ── */
  .rs-pag { display: flex; justify-content: center; align-items: center; gap: 6px; padding: 20px 20px 40px; flex-wrap: wrap; }
  .rs-pbn {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 38px; height: 38px; padding: 0 8px;
    border: 1.5px solid var(--border-dark); border-radius: var(--radius);
    background: var(--surface); font-family: var(--font-body); font-size: 13.5px; font-weight: 600;
    color: var(--ink); cursor: pointer; transition: border-color .18s, background .18s, color .18s;
  }
  .rs-pbn svg { width: 14px; height: 14px; }
  .rs-pbn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .rs-pbn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .rs-pbn:disabled { opacity: .4; cursor: not-allowed; }
  .rs-pdot { color: var(--ink-muted); padding: 0 2px; }

  /* ── MAP VIEW ── */
  .rs-map-section { padding: 0 20px 40px; }
  .rs-map-wrap {
    position: relative; border-radius: 16px; overflow: hidden;
    border: 1px solid var(--border); box-shadow: var(--shadow-md);
    height: 640px;
  }
  #rsMapEl { width: 100%; height: 100%; z-index: 1; }

  /* Leaflet overrides — match our palette */
  .rs-map-wrap .leaflet-control-zoom a {
    font-family: var(--font-body) !important;
    color: var(--ink) !important;
    border-color: var(--border-dark) !important;
    background: var(--surface) !important;
  }
  .rs-map-wrap .leaflet-control-zoom a:hover { background: var(--accent-light) !important; color: var(--accent) !important; }
  .rs-map-wrap .leaflet-control-attribution { font-size: 10px !important; background: rgba(255,255,255,.75) !important; }

  /* Custom price-badge marker */
  .rs-map-pin {
    background: var(--accent); color: #fff;
    font-family: var(--font-body); font-size: 12px; font-weight: 700;
    padding: 5px 9px; border-radius: 20px;
    white-space: nowrap; cursor: pointer;
    box-shadow: 0 3px 12px rgba(187,81,39,.45), 0 1px 3px rgba(0,0,0,.2);
    border: 2px solid #fff;
    transform-origin: bottom center;
    transition: transform .15s, background .15s, box-shadow .15s;
    position: relative;
  }
  .rs-map-pin::after {
    content: '';
    position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: var(--accent);
  }
  .rs-map-pin:hover, .rs-map-pin.hovered {
    background: var(--accent-hover);
    transform: scale(1.12) translateY(-2px);
    box-shadow: 0 6px 20px rgba(78,66,33,.5), 0 2px 6px rgba(0,0,0,.25);
    z-index: 1000 !important;
  }
  .rs-map-pin.hovered::after { border-top-color: var(--accent-hover); }
  .rs-map-pin.sold { background: #6b7280; }
  .rs-map-pin.sold::after { border-top-color: #6b7280; }

  /* Popup card on pin hover */
  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    padding: 0 !important;
    overflow: hidden;
    box-shadow: var(--shadow-lg) !important;
    border: 1px solid var(--border) !important;
    font-family: var(--font-body) !important;
    min-width: 260px;
  }
  .leaflet-popup-content { margin: 0 !important; width: auto !important; }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-popup-close-button { display: none !important; }

  .rs-map-popup { font-family: var(--font-body); }
  .rs-map-popup-img {
    width: 100%; height: 150px; overflow: hidden;
    background: #f0ece6; display: flex; align-items: center; justify-content: center; font-size: 48px;
    flex-shrink: 0;
  }
  .rs-map-popup-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .rs-map-popup-body { padding: 14px 16px 16px; }
  .rs-map-popup-price { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--accent); margin-bottom: 4px; }
  .rs-map-popup-addr { font-size: 12.5px; color: var(--ink-light); margin-bottom: 10px; line-height: 1.4; }
  .rs-map-popup-addr strong { display: block; color: var(--ink); font-weight: 600; font-size: 13px; }
  .rs-map-popup-specs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .rs-map-popup-spec { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-light); }
  .rs-map-popup-spec svg { width: 12px; height: 12px; color: var(--ink-muted); }
  .rs-map-popup-spec strong { font-weight: 600; color: var(--ink); }
  .rs-map-popup-cta {
    width: 100%; height: 34px; border-radius: 8px;
    border: none; background: var(--accent); color: #fff;
    font-family: var(--font-body); font-size: 13px; font-weight: 600; cursor: pointer; transition: background .18s;
  }
  .rs-map-popup-cta:hover { background: var(--accent-hover); }

  /* Map no-coords notice */
  .rs-map-notice {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 7px 16px; font-size: 12px; color: var(--ink-muted);
    box-shadow: var(--shadow-sm); z-index: 10; white-space: nowrap; pointer-events: none;
  }

  /* Map result count badge */
  .rs-map-count {
    position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
    background: var(--ink); color: #fff;
    border-radius: 20px; padding: 7px 18px;
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    box-shadow: var(--shadow-md); z-index: 10; white-space: nowrap; pointer-events: none;
  }

  /* Responsive */
  @media (max-width: 700px) {
    .rs-topbar-inner { gap: 8px; }
    .rs-pills { gap: 6px; }
    .rs-pill { height: 34px; padding: 0 10px; font-size: 12px; }
    .rs-grid { grid-template-columns: 1fr; }
    .rs-grid.list-view .rs-card { flex-direction: column; }
    .rs-grid.list-view .rs-card-img { width: 100%; height: 200px; }
    .rs-panel { width: 100%; }
    .rs-dropdown { min-width: 240px; }
    .rs-map-wrap { height: 480px; }
    .rs-map-section { padding: 0 14px 30px; }
    .rs-grid-section { padding: 0 14px 30px; }
    .rs-tags { padding: 0 14px 10px; }
    .rs-results-bar { padding: 12px 16px 8px; }
  }
  @media (max-width: 480px) {
    .rs-pill.hide-mobile { display: none; }
    .rs-map-wrap { height: 380px; }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
class RealEstateSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._all = [];
    this._state = {
      search: '', priceMin: null, priceMax: null,
      bedsMin: '', bedsMax: '', bathsMin: '', bathsMax: '',
      sqftMin: '', sqftMax: '', lotMin: '', lotMax: '',
      yearMin: '', yearMax: '', garageMin: '', garageMax: '',
      parkingMin: '', parkingMax: '', stories: '', maxTax: '',
      propTypes: [], statuses: ['Active'], neighborhoods: [],
      waterbody: '', specials: [], sort: 'newest', view: 'grid', page: 1,
    };
    this._perPage = 12;
    this._opts = { propTypes:[], statuses:[], neighborhoods:[], waterbodies:[], bedOptions:[], bathOptions:[], sqftOptions:[], lotOptions:[], yearOptions:[], garageOptions:[], parkingOptions:[], storiesOptions:[] };
    this._activePill = null;
    this._panelOpen = false;

    // Map state
    this._map = null;
    this._markers = [];
    this._leafletLoaded = false;
    this._docClickBound = false;
  }

  static get observedAttributes() { return ['listing-data']; }

  attributeChangedCallback(name, _old, newVal) {
    if (name === 'listing-data' && newVal) {
      try {
        const d = JSON.parse(newVal);
        this._all = d.listings || [];
        this._buildOptions();
        this._state.page = 1;
        if (this._ready) { this._rebuildDynamicParts(); this._render(); }
      } catch(e) { console.error('RealEstateSearch parse error:', e); }
    }
  }

  connectedCallback() {
    this._initDOM();
    this._ready = true;
    this._loadLeaflet();
    if (this._all.length) { this._rebuildDynamicParts(); this._render(); }
  }

  // ── Load Leaflet from CDN ─────────────────────────────────────────────────
  _loadLeaflet() {
    if (window.L) { this._leafletLoaded = true; return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WPM=';
    script.crossOrigin = '';
    script.onload = () => {
      this._leafletLoaded = true;
      if (this._state.view === 'map') this._initMap();
    };
    document.head.appendChild(script);
  }

  // ── Build option arrays from data ─────────────────────────────────────────
  _buildOptions() {
    const uniq  = arr => [...new Set(arr.filter(x => x !== null && x !== undefined && x !== ''))].sort();
    const uniqN = arr => [...new Set(arr.filter(x => x !== null && x !== undefined && x > 0))].sort((a,b)=>a-b);
    const all = this._all;
    this._opts.propTypes      = uniq(all.map(x=>x.propertyType));
    this._opts.statuses       = uniq(all.map(x=>x.status));
    this._opts.neighborhoods  = uniq(all.map(x=>x.neighborhood));
    this._opts.waterbodies    = uniq(all.map(x=>x.waterbody));
    this._opts.bedOptions     = uniqN(all.map(x=>x.bedrooms)).filter(n=>n<=10);
    this._opts.bathOptions    = uniqN(all.map(x=>x.bathrooms)).filter(n=>n<=10);
    this._opts.garageOptions  = uniqN(all.map(x=>x.garageSpaces)).filter(n=>n<=10);
    this._opts.parkingOptions = uniqN(all.map(x=>x.parkingSpaces)).filter(n=>n<=10);
    this._opts.storiesOptions = uniqN(all.map(x=>x.stories)).filter(n=>n<=5);
    const sqfts = uniqN(all.map(x=>x.sqFt));
    this._opts.sqftOptions = sqfts.length ? this._stepRange(Math.min(...sqfts),Math.max(...sqfts),12) : [600,800,1000,1200,1500,2000,2500,3000,4000,5000];
    const lots = uniqN(all.map(x=>x.lotSize));
    this._opts.lotOptions = lots.length ? this._stepRange(Math.min(...lots),Math.max(...lots),10) : [0.1,0.25,0.5,1,2,5,10,20];
    const years = uniqN(all.map(x=>x.yearBuilt)).filter(y=>y>1800&&y<=new Date().getFullYear()+2);
    this._opts.yearOptions = years.length ? years : [1900,1950,1960,1970,1980,1990,2000,2005,2010,2015,2020,2023];
    const prices = all.map(x=>x.price||0).filter(p=>p>0);
    this._priceBounds = { min: prices.length?Math.min(...prices):0, max: prices.length?Math.max(...prices):5000000 };
  }

  _stepRange(min, max, steps) {
    if (min>=max) return [min,max];
    const step=(max-min)/steps; const arr=[];
    for(let i=0;i<=steps;i++){const v=Math.round((min+i*step)/100)*100; if(!arr.includes(v)) arr.push(v);}
    return arr;
  }

  // ── Init DOM ──────────────────────────────────────────────────────────────
  _initDOM() {
    this.shadowRoot.innerHTML = `<style>${CSS}</style>${this._shell()}`;
    this._bindAll();
  }

  _shell() {
    return `
    <div class="rs-wrap" id="rsWrap">
      <div class="rs-topbar">
        <div class="rs-topbar-inner">
          <div class="rs-search-wrap">
            <span class="rs-search-icon">${ICONS.search}</span>
            <input class="rs-search" id="rsSearch" type="text" placeholder="City, ZIP, Neighborhood, or Address…">
          </div>
          <div class="rs-pills" id="rsPills"></div>
          <button class="rs-all-filters-btn" id="rsAllFiltersBtn">
            ${ICONS.filter} All Filters <span class="rs-badge" id="rsFilterBadge" style="display:none">0</span>
          </button>
        </div>
      </div>

      <div class="rs-results-bar">
        <div class="rs-results-count" id="rsCount">0 <small>listings</small></div>
        <div class="rs-results-meta">
          <select class="rs-sort-select" id="rsSort">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="sqft-desc">Largest First</option>
            <option value="beds-desc">Most Beds</option>
          </select>
          <div class="rs-view-toggle">
            <button class="rs-view-btn active" id="rsBtnGrid" title="Grid view">${ICONS.grid}</button>
            <button class="rs-view-btn" id="rsBtnList" title="List view">${ICONS.list}</button>
            <button class="rs-view-btn" id="rsBtnMap" title="Map view">${ICONS.mapico}</button>
          </div>
        </div>
      </div>

      <div class="rs-tags" id="rsTags"></div>

      <!-- GRID / LIST -->
      <div class="rs-grid-section" id="rsGridSection">
        <div class="rs-grid" id="rsGrid">
          <div class="rs-loading"><div class="rs-spinner"></div><span>Loading listings…</span></div>
        </div>
      </div>

      <!-- MAP VIEW -->
      <div class="rs-map-section" id="rsMapSection" style="display:none">
        <div class="rs-map-wrap">
          <div id="rsMapEl"></div>
          <div class="rs-map-notice" id="rsMapNotice" style="display:none">Some listings lack coordinates and won't appear as pins</div>
          <div class="rs-map-count" id="rsMapCount"></div>
        </div>
      </div>

      <div class="rs-pag" id="rsPag"></div>

      <!-- ALL FILTERS PANEL -->
      <div class="rs-panel-ov" id="rsPanelOv">
        <div class="rs-panel">
          <div class="rs-panel-head">
            <h2>All Filters</h2>
            <button class="rs-panel-close" id="rsPanelClose">${ICONS.close}</button>
          </div>
          <div class="rs-panel-body" id="rsPanelBody"></div>
          <div class="rs-panel-footer">
            <button class="rs-panel-reset" id="rsPanelReset">Reset All</button>
            <button class="rs-panel-apply" id="rsPanelApply">Apply Filters</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  _rebuildDynamicParts() { this._buildPills(); this._buildPanel(); }

  // ── Pills ─────────────────────────────────────────────────────────────────
  _buildPills() {
    const pills = this.shadowRoot.getElementById('rsPills');
    if (!pills) return;
    pills.innerHTML = '';
    pills.appendChild(this._makePricePill());
    if (this._opts.bedOptions.length||this._opts.bathOptions.length) pills.appendChild(this._makeBedBathPill());
    if (this._opts.propTypes.length) pills.appendChild(this._makeCheckPill('Type','propTypes',this._opts.propTypes));
    if (this._opts.statuses.length)  pills.appendChild(this._makeStatusPill());
    this._bindPillCloseLogic();
  }

  _makePricePill() {
    const p = document.createElement('div');
    p.className='rs-pill'; p.id='pillPrice';
    const b = this._priceBounds||{min:0,max:5000000};
    p.innerHTML=`<span class="pill-label">Price</span><span class="pill-caret">${ICONS.chevD}</span>
    <div class="rs-dropdown">
      <div class="rs-dropdown-title">Price Range</div>
      <div class="rs-price-row">
        <div class="rs-price-inp-wrap"><span>$</span><input class="rs-price-inp" id="dPriceMin" type="number" placeholder="Min"></div>
        <div class="rs-price-dash">—</div>
        <div class="rs-price-inp-wrap"><span>$</span><input class="rs-price-inp" id="dPriceMax" type="number" placeholder="Max"></div>
      </div>
      <div class="rs-slider-track">
        <div class="rs-slider-fill" id="dSliderFill"></div>
        <input type="range" id="dRangeMin" min="${b.min}" max="${b.max}" step="1000" value="${b.min}">
        <input type="range" class="rs-slider-hi" id="dRangeMax" min="${b.min}" max="${b.max}" step="1000" value="${b.max}">
      </div>
      <div class="rs-slider-labels"><span id="dRangeMinLbl">$0</span><span id="dRangeMaxLbl">$${(b.max||5000000).toLocaleString()}</span></div>
      <div class="rs-drop-actions">
        <button class="rs-drop-reset" id="dPriceReset">Reset</button>
        <button class="rs-drop-apply" id="dPriceApply">Apply</button>
      </div>
    </div>`;
    setTimeout(()=>{
      const sr=this.shadowRoot;
      const fill=sr.getElementById('dSliderFill'),rMin=sr.getElementById('dRangeMin'),rMax=sr.getElementById('dRangeMax');
      const lMin=sr.getElementById('dRangeMinLbl'),lMax=sr.getElementById('dRangeMaxLbl');
      const iMin=sr.getElementById('dPriceMin'),iMax=sr.getElementById('dPriceMax');
      if(!rMin) return;
      const upd=()=>{
        const lo=+rMin.value,hi=+rMax.value,range=rMax.max-rMin.min;
        if(fill){fill.style.left=((lo-rMin.min)/range*100)+'%';fill.style.right=((rMax.max-hi)/range*100)+'%';}
        if(lMin) lMin.textContent='$'+Number(lo).toLocaleString();
        if(lMax) lMax.textContent='$'+Number(hi).toLocaleString();
      };
      rMin.addEventListener('input',()=>{if(+rMin.value>+rMax.value)rMin.value=rMax.value;iMin.value=+rMin.value>0?rMin.value:'';upd();});
      rMax.addEventListener('input',()=>{if(+rMax.value<+rMin.value)rMax.value=rMin.value;iMax.value=+rMax.value<+rMax.max?rMax.value:'';upd();});
      iMin.addEventListener('input',()=>{rMin.value=+iMin.value||rMin.min;upd();});
      iMax.addEventListener('input',()=>{rMax.value=+iMax.value||rMax.max;upd();});
      sr.getElementById('dPriceReset')?.addEventListener('click',(e)=>{e.stopPropagation();this._resetPrice();});
      sr.getElementById('dPriceApply')?.addEventListener('click',(e)=>{e.stopPropagation();this._applyPrice();this._closePill();});
      upd();
    },50);
    p.addEventListener('click',(e)=>{e.stopPropagation();this._togglePill(p);});
    return p;
  }

  _makeBedBathPill() {
    const p=document.createElement('div'); p.className='rs-pill'; p.id='pillBeds';
    const bOpts=['', ...this._opts.bedOptions].map(v=>`<option value="${v}">${v===''?'No Min/Max':v}</option>`).join('');
    const baOpts=['', ...this._opts.bathOptions].map(v=>`<option value="${v}">${v===''?'No Min/Max':v}</option>`).join('');
    p.innerHTML=`<span class="pill-label">Bed &amp; Bath</span><span class="pill-caret">${ICONS.chevD}</span>
    <div class="rs-dropdown">
      <div class="rs-dropdown-title">Bedrooms</div>
      <div class="rs-range-row"><label>Min</label><select class="rs-select" id="dBedsMin">${bOpts}</select><label>Max</label><select class="rs-select" id="dBedsMax">${bOpts}</select></div>
      <div class="rs-dropdown-title" style="margin-top:12px">Bathrooms</div>
      <div class="rs-range-row"><label>Min</label><select class="rs-select" id="dBathsMin">${baOpts}</select><label>Max</label><select class="rs-select" id="dBathsMax">${baOpts}</select></div>
    </div>`;
    p.addEventListener('click',(e)=>{e.stopPropagation();this._togglePill(p);});
    setTimeout(()=>{['dBedsMin','dBedsMax','dBathsMin','dBathsMax'].forEach(id=>{this.shadowRoot.getElementById(id)?.addEventListener('change',()=>{this._syncBedsBathsFromDropdown();this._render();});});},50);
    return p;
  }

  _makeCheckPill(label,stateKey,opts) {
    const p=document.createElement('div'); p.className='rs-pill hide-mobile'; p.dataset.stateKey=stateKey;
    const items=opts.map(v=>`<div class="rs-check-item" data-val="${this._esc(v)}" data-key="${stateKey}"><div class="rs-chkbox">✓</div>${this._esc(v)}</div>`).join('');
    p.innerHTML=`<span class="pill-label">${label}</span><span class="pill-caret">${ICONS.chevD}</span>
    <div class="rs-dropdown" style="min-width:320px">
      <div class="rs-dropdown-title">${label}</div>
      <div class="rs-check-grid">${items}</div>
    </div>`;
    p.addEventListener('click',(e)=>{e.stopPropagation();this._togglePill(p);});
    setTimeout(()=>{
      p.querySelectorAll('.rs-check-item').forEach(el=>{
        el.addEventListener('click',(e)=>{
          e.stopPropagation(); el.classList.toggle('sel');
          const v=el.dataset.val,arr=this._state[stateKey],i=arr.indexOf(v);
          i===-1?arr.push(v):arr.splice(i,1);
          this._updatePillLabel(p,label,arr.length); this._render();
        });
      });
    },50);
    return p;
  }

  _makeStatusPill() {
    const p=document.createElement('div'); p.className='rs-pill'; p.id='pillStatus';
    const btns=this._opts.statuses.map(s=>`<button class="rs-status-btn${this._state.statuses.includes(s)?' sel':''}" data-val="${this._esc(s)}">${this._esc(s)}</button>`).join('');
    p.innerHTML=`<span class="pill-label">Status</span><span class="pill-caret">${ICONS.chevD}</span>
    <div class="rs-dropdown"><div class="rs-dropdown-title">Listing Status</div><div class="rs-status-btns">${btns}</div></div>`;
    p.addEventListener('click',(e)=>{e.stopPropagation();this._togglePill(p);});
    setTimeout(()=>{
      p.querySelectorAll('.rs-status-btn').forEach(btn=>{
        btn.addEventListener('click',(e)=>{
          e.stopPropagation(); btn.classList.toggle('sel');
          const v=btn.dataset.val,i=this._state.statuses.indexOf(v);
          i===-1?this._state.statuses.push(v):this._state.statuses.splice(i,1);
          const isDefault=this._state.statuses.length===1&&this._state.statuses[0]==='Active';
          this._updatePillLabel(p,'Status',(!isDefault&&this._state.statuses.length)?1:0); this._render();
        });
      });
    },50);
    return p;
  }

  _togglePill(pill) {
    if(this._activePill&&this._activePill!==pill) this._activePill.classList.remove('active');
    pill.classList.toggle('active');
    this._activePill=pill.classList.contains('active')?pill:null;
  }
  _closePill() { if(this._activePill){this._activePill.classList.remove('active');this._activePill=null;} }
  _bindPillCloseLogic() { if(!this._docClickBound){this._docClickBound=true;document.addEventListener('click',()=>this._closePill());} }
  _updatePillLabel(pill,base,count) {
    const lbl=pill.querySelector('.pill-label');
    if(lbl) lbl.textContent=count>0?`${base} (${count})`:base;
    pill.classList.toggle('has-val',count>0);
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  _buildPanel() {
    const body=this.shadowRoot.getElementById('rsPanelBody');
    if(!body) return;
    body.innerHTML='';
    const opts=this._opts;

    body.appendChild(this._panelSec('Special Listings',`
      <div class="rs-special-tags">
        <button class="rs-special-btn" data-special="new_listings">🆕 New Listings</button>
        <button class="rs-special-btn" data-special="open_houses">🏠 Open Houses</button>
        <button class="rs-special-btn" data-special="price_reduced">📉 Price Reduced</button>
      </div>`));

    body.appendChild(this._panelSec('Price Range',`
      <div class="rs-price-row">
        <div class="rs-price-inp-wrap"><span>$</span><input class="rs-price-inp" id="pPriceMin" type="number" placeholder="Min"></div>
        <div class="rs-price-dash">—</div>
        <div class="rs-price-inp-wrap"><span>$</span><input class="rs-price-inp" id="pPriceMax" type="number" placeholder="Max"></div>
      </div>`));

    if(opts.bedOptions.length||opts.bathOptions.length){
      const bO=['', ...opts.bedOptions].map(v=>`<option value="${v}">${v===''?'No Min/Max':v}</option>`).join('');
      const baO=['', ...opts.bathOptions].map(v=>`<option value="${v}">${v===''?'No Min/Max':v}</option>`).join('');
      body.appendChild(this._panelSec('Bedrooms',`<div class="rs-range-row"><label>Min</label><select class="rs-select" id="pBedsMin">${bO}</select><label>Max</label><select class="rs-select" id="pBedsMax">${bO}</select></div>`));
      body.appendChild(this._panelSec('Bathrooms',`<div class="rs-range-row"><label>Min</label><select class="rs-select" id="pBathsMin">${baO}</select><label>Max</label><select class="rs-select" id="pBathsMax">${baO}</select></div>`));
    }

    if(opts.sqftOptions.length){
      const sqO=['', ...opts.sqftOptions].map(v=>`<option value="${v}">${v===''?'No Min/Max':Number(v).toLocaleString()}</option>`).join('');
      body.appendChild(this._panelSec('Square Footage',`<div class="rs-range-row"><label>Min</label><select class="rs-select" id="pSqftMin">${sqO}</select><label>Max</label><select class="rs-select" id="pSqftMax">${sqO}</select></div>`));
    }
    if(opts.lotOptions.length){
      const lO=['', ...opts.lotOptions].map(v=>`<option value="${v}">${v===''?'No Min/Max':v+' ac'}</option>`).join('');
      body.appendChild(this._panelSec('Lot Size (Acres)',`<div class="rs-range-row"><label>Min</label><select class="rs-select" id="pLotMin">${lO}</select><label>Max</label><select class="rs-select" id="pLotMax">${lO}</select></div>`));
    }
    if(opts.yearOptions.length){
      const yO=['', ...opts.yearOptions].map(v=>`<option value="${v}">${v===''?'No Min/Max':v}</option>`).join('');
      body.appendChild(this._panelSec('Year Built',`<div class="rs-range-row"><label>Min</label><select class="rs-select" id="pYearMin">${yO}</select><label>Max</label><select class="rs-select" id="pYearMax">${yO}</select></div>`));
    }
    if(opts.garageOptions.length){
      const gO=['', ...opts.garageOptions].map(v=>`<option value="${v}">${v===''?'Any':v}</option>`).join('');
      body.appendChild(this._panelSec('Garage Spaces',`<div class="rs-range-row"><label>Min</label><select class="rs-select" id="pGarageMin">${gO}</select><label>Max</label><select class="rs-select" id="pGarageMax">${gO}</select></div>`));
    }
    if(opts.parkingOptions.length){
      const pkO=['', ...opts.parkingOptions].map(v=>`<option value="${v}">${v===''?'Any':v}</option>`).join('');
      body.appendChild(this._panelSec('Parking Spaces',`<div class="rs-range-row"><label>Min</label><select class="rs-select" id="pParkingMin">${pkO}</select><label>Max</label><select class="rs-select" id="pParkingMax">${pkO}</select></div>`));
    }
    if(opts.storiesOptions.length){
      const stO=['', ...opts.storiesOptions].map(v=>`<option value="${v}">${v===''?'Any':v+' Stor'+(v==1?'y':'ies')}</option>`).join('');
      body.appendChild(this._panelSec('Stories',`<select class="rs-select" id="pStories" style="width:100%">${stO}</select>`));
    }

    body.appendChild(this._panelSec('Max Annual Tax ($)',`<div class="rs-price-inp-wrap"><span>$</span><input class="rs-price-inp" id="pMaxTax" type="number" placeholder="e.g. 15,000" style="padding-left:22px;width:100%"></div>`));

    if(opts.neighborhoods.length){
      const items=opts.neighborhoods.map(n=>`<div class="rs-nbhd-item" data-nbhd="${this._esc(n)}"><div class="rs-nbhd-cb">✓</div>${this._esc(n)}</div>`).join('');
      body.appendChild(this._panelSec('Neighborhood',`<div class="rs-nbhd-list">${items}</div>`));
    }
    if(opts.propTypes.length){
      const items=opts.propTypes.map(t=>`<div class="rs-check-item" data-panel-type="${this._esc(t)}"><div class="rs-chkbox">✓</div>${this._esc(t)}</div>`).join('');
      body.appendChild(this._panelSec('Property Type',`<div class="rs-check-grid">${items}</div>`));
    }
    if(opts.statuses.length){
      const btns=opts.statuses.map(s=>`<button class="rs-status-btn panel-status${this._state.statuses.includes(s)?' sel':''}" data-val="${this._esc(s)}">${this._esc(s)}</button>`).join('');
      body.appendChild(this._panelSec('Listing Status',`<div class="rs-status-btns">${btns}</div>`));
    }
    if(opts.waterbodies.length){
      const wO=['', ...opts.waterbodies].map(v=>`<option value="${v}">${v===''?'-- Any --':v}</option>`).join('');
      body.appendChild(this._panelSec('Waterbody',`<select class="rs-select" id="pWaterbody" style="width:100%">${wO}</select>`));
    }

    setTimeout(()=>this._bindPanelControls(),60);
  }

  _panelSec(title,content) {
    const sec=document.createElement('div'); sec.className='rs-panel-sec';
    sec.innerHTML=`<div class="rs-panel-sec-title">${title}</div>${content}`;
    return sec;
  }

  _bindPanelControls() {
    const sr=this.shadowRoot;
    sr.querySelectorAll('.rs-special-btn').forEach(btn=>{
      const key=btn.dataset.special;
      if(this._state.specials.includes(key)) btn.classList.add('sel');
      btn.addEventListener('click',()=>{btn.classList.toggle('sel');const i=this._state.specials.indexOf(key);i===-1?this._state.specials.push(key):this._state.specials.splice(i,1);this._renderTags();this._updateFilterBadge();});
    });
    sr.querySelectorAll('.rs-nbhd-item').forEach(el=>{
      const n=el.dataset.nbhd;
      if(this._state.neighborhoods.includes(n)) el.classList.add('sel');
      el.addEventListener('click',()=>{el.classList.toggle('sel');const i=this._state.neighborhoods.indexOf(n);i===-1?this._state.neighborhoods.push(n):this._state.neighborhoods.splice(i,1);this._renderTags();this._updateFilterBadge();});
    });
    sr.querySelectorAll('[data-panel-type]').forEach(el=>{
      const v=el.dataset.panelType;
      if(this._state.propTypes.includes(v)) el.classList.add('sel');
      el.addEventListener('click',(e)=>{
        e.stopPropagation(); el.classList.toggle('sel');
        const i=this._state.propTypes.indexOf(v);
        i===-1?this._state.propTypes.push(v):this._state.propTypes.splice(i,1);
        sr.querySelectorAll(`[data-val="${v}"]`).forEach(x=>x.classList.toggle('sel',this._state.propTypes.includes(v)));
        const pill=sr.querySelector('[data-state-key="propTypes"]');
        if(pill) this._updatePillLabel(pill,'Type',this._state.propTypes.length);
        this._renderTags();this._updateFilterBadge();
      });
    });
    sr.querySelectorAll('.panel-status').forEach(btn=>{
      btn.addEventListener('click',()=>{
        btn.classList.toggle('sel');const v=btn.dataset.val;const i=this._state.statuses.indexOf(v);
        i===-1?this._state.statuses.push(v):this._state.statuses.splice(i,1);
        sr.querySelectorAll(`#pillStatus .rs-status-btn[data-val="${v}"]`).forEach(b=>b.classList.toggle('sel',this._state.statuses.includes(v)));
        this._renderTags();this._updateFilterBadge();
      });
    });
    const syncS=(id,k)=>{const el=sr.getElementById(id);if(!el)return;el.value=this._state[k]||'';el.addEventListener('change',()=>{this._state[k]=el.value;this._renderTags();this._updateFilterBadge();});};
    syncS('pBedsMin','bedsMin');syncS('pBedsMax','bedsMax');syncS('pBathsMin','bathsMin');syncS('pBathsMax','bathsMax');
    syncS('pSqftMin','sqftMin');syncS('pSqftMax','sqftMax');syncS('pLotMin','lotMin');syncS('pLotMax','lotMax');
    syncS('pYearMin','yearMin');syncS('pYearMax','yearMax');syncS('pGarageMin','garageMin');syncS('pGarageMax','garageMax');
    syncS('pParkingMin','parkingMin');syncS('pParkingMax','parkingMax');syncS('pStories','stories');syncS('pWaterbody','waterbody');
    const pMin=sr.getElementById('pPriceMin'),pMax=sr.getElementById('pPriceMax');
    if(pMin){if(this._state.priceMin)pMin.value=this._state.priceMin;pMin.addEventListener('input',()=>{this._state.priceMin=+pMin.value||null;this._syncPriceSlider();this._renderTags();this._updateFilterBadge();});}
    if(pMax){if(this._state.priceMax)pMax.value=this._state.priceMax;pMax.addEventListener('input',()=>{this._state.priceMax=+pMax.value||null;this._syncPriceSlider();this._renderTags();this._updateFilterBadge();});}
    const tax=sr.getElementById('pMaxTax');
    if(tax){if(this._state.maxTax)tax.value=this._state.maxTax;tax.addEventListener('input',()=>{this._state.maxTax=+tax.value||'';this._renderTags();this._updateFilterBadge();});}
  }

  // ── Bind controls ─────────────────────────────────────────────────────────
  _bindAll() {
    const sr=this.shadowRoot;
    let st;
    sr.getElementById('rsSearch')?.addEventListener('input',(e)=>{clearTimeout(st);st=setTimeout(()=>{this._state.search=e.target.value.trim().toLowerCase();this._state.page=1;this._render();},280);});
    sr.getElementById('rsSort')?.addEventListener('change',(e)=>{this._state.sort=e.target.value;this._render();});
    sr.getElementById('rsBtnGrid')?.addEventListener('click',()=>{this._state.view='grid';this._updateViewBtns();this._render();});
    sr.getElementById('rsBtnList')?.addEventListener('click',()=>{this._state.view='list';this._updateViewBtns();this._render();});
    sr.getElementById('rsBtnMap')?.addEventListener('click',()=>{this._state.view='map';this._updateViewBtns();this._render();});
    sr.getElementById('rsAllFiltersBtn')?.addEventListener('click',()=>this._openPanel());
    sr.getElementById('rsPanelClose')?.addEventListener('click',()=>this._closePanel());
    sr.getElementById('rsPanelOv')?.addEventListener('click',(e)=>{if(e.target===sr.getElementById('rsPanelOv'))this._closePanel();});
    sr.getElementById('rsPanelReset')?.addEventListener('click',()=>this._resetAll());
    sr.getElementById('rsPanelApply')?.addEventListener('click',()=>{this._state.page=1;this._render();this._closePanel();});
    document.addEventListener('click',()=>this._closePill());
  }

  _updateViewBtns() {
    const sr=this.shadowRoot;
    ['Grid','List','Map'].forEach(v=>{
      sr.getElementById(`rsBtn${v}`)?.classList.toggle('active',this._state.view===v.toLowerCase());
    });
    // Sort only visible in non-map views
    const sort=sr.getElementById('rsSort');
    if(sort) sort.closest('.rs-results-meta').style.display=this._state.view==='map'?'flex':'flex';
  }

  // ── Price helpers ─────────────────────────────────────────────────────────
  _resetPrice() {
    const sr=this.shadowRoot;
    this._state.priceMin=null;this._state.priceMax=null;
    const b=this._priceBounds||{min:0,max:5000000};
    const rMin=sr.getElementById('dRangeMin'),rMax=sr.getElementById('dRangeMax');
    if(rMin)rMin.value=b.min;if(rMax)rMax.value=b.max;
    const iMin=sr.getElementById('dPriceMin'),iMax=sr.getElementById('dPriceMax');
    if(iMin)iMin.value='';if(iMax)iMax.value='';
    const pMin=sr.getElementById('pPriceMin'),pMax=sr.getElementById('pPriceMax');
    if(pMin)pMin.value='';if(pMax)pMax.value='';
    this._syncPriceSliderFill();
    const pill=sr.getElementById('pillPrice');if(pill)this._updatePillLabel(pill,'Price',0);
    this._renderTags();this._render();
  }
  _applyPrice() {
    const sr=this.shadowRoot;
    const rMin=sr.getElementById('dRangeMin'),rMax=sr.getElementById('dRangeMax');
    const b=this._priceBounds||{min:0,max:5000000};
    if(rMin){const v=+rMin.value;this._state.priceMin=v>b.min?v:null;}
    if(rMax){const v=+rMax.value;this._state.priceMax=v<b.max?v:null;}
    const pill=sr.getElementById('pillPrice');
    if(pill)this._updatePillLabel(pill,'Price',(this._state.priceMin||this._state.priceMax)?1:0);
    this._state.page=1;this._renderTags();this._updateFilterBadge();this._render();
  }
  _syncPriceSlider() {
    const sr=this.shadowRoot;
    const rMin=sr.getElementById('dRangeMin'),rMax=sr.getElementById('dRangeMax');
    if(rMin&&this._state.priceMin)rMin.value=this._state.priceMin;
    if(rMax&&this._state.priceMax)rMax.value=this._state.priceMax;
    this._syncPriceSliderFill();
  }
  _syncPriceSliderFill() {
    const sr=this.shadowRoot;
    const rMin=sr.getElementById('dRangeMin'),rMax=sr.getElementById('dRangeMax'),fill=sr.getElementById('dSliderFill');
    if(!rMin||!fill)return;
    const lo=+rMin.value,hi=+rMax.value,range=rMax.max-rMin.min;
    fill.style.left=((lo-rMin.min)/range*100)+'%';fill.style.right=((rMax.max-hi)/range*100)+'%';
  }
  _syncBedsBathsFromDropdown() {
    const sr=this.shadowRoot;
    this._state.bedsMin=sr.getElementById('dBedsMin')?.value||'';
    this._state.bedsMax=sr.getElementById('dBedsMax')?.value||'';
    this._state.bathsMin=sr.getElementById('dBathsMin')?.value||'';
    this._state.bathsMax=sr.getElementById('dBathsMax')?.value||'';
    const pill=sr.getElementById('pillBeds');
    const c=[this._state.bedsMin,this._state.bedsMax,this._state.bathsMin,this._state.bathsMax].filter(Boolean).length;
    if(pill)this._updatePillLabel(pill,'Bed & Bath',c>0?1:0);
    this._renderTags();this._updateFilterBadge();
  }

  // ── Panel open/close ──────────────────────────────────────────────────────
  _openPanel(){const ov=this.shadowRoot.getElementById('rsPanelOv');if(ov)ov.classList.add('open');try{document.body.style.overflow='hidden';}catch(e){test}}
  _closePanel(){const ov=this.shadowRoot.getElementById('rsPanelOv');if(ov)ov.classList.remove('open');try{document.body.style.overflow='';}catch(e){test}}

  // ── Filter data ───────────────────────────────────────────────────────────
  _getFiltered() {
    const s=this._state;
    let list=[...this._all];
    if(s.search) list=list.filter(x=>[x.title,x.address,x.city,x.state,x.zipCode,x.neighborhood,x.propertyType].join(' ').toLowerCase().includes(s.search));
    if(s.priceMin!==null&&s.priceMin>0) list=list.filter(x=>(x.price||0)>=s.priceMin);
    if(s.priceMax!==null&&s.priceMax>0) list=list.filter(x=>(x.price||0)<=s.priceMax);
    if(s.bedsMin)  list=list.filter(x=>(x.bedrooms||0)>=+s.bedsMin);
    if(s.bedsMax)  list=list.filter(x=>(x.bedrooms||0)<=+s.bedsMax);
    if(s.bathsMin) list=list.filter(x=>(x.bathrooms||0)>=+s.bathsMin);
    if(s.bathsMax) list=list.filter(x=>(x.bathrooms||0)<=+s.bathsMax);
    if(s.sqftMin)  list=list.filter(x=>(x.sqFt||0)>=+s.sqftMin);
    if(s.sqftMax)  list=list.filter(x=>(x.sqFt||0)<=+s.sqftMax);
    if(s.lotMin)   list=list.filter(x=>(x.lotSize||0)>=+s.lotMin);
    if(s.lotMax)   list=list.filter(x=>(x.lotSize||0)<=+s.lotMax);
    if(s.yearMin)  list=list.filter(x=>!x.yearBuilt||x.yearBuilt>=+s.yearMin);
    if(s.yearMax)  list=list.filter(x=>!x.yearBuilt||x.yearBuilt<=+s.yearMax);
    if(s.garageMin)  list=list.filter(x=>(x.garageSpaces||0)>=+s.garageMin);
    if(s.garageMax)  list=list.filter(x=>(x.garageSpaces||0)<=+s.garageMax);
    if(s.parkingMin) list=list.filter(x=>(x.parkingSpaces||0)>=+s.parkingMin);
    if(s.parkingMax) list=list.filter(x=>(x.parkingSpaces||0)<=+s.parkingMax);
    if(s.stories) { if(+s.stories>=3) list=list.filter(x=>(x.stories||0)>=3); else list=list.filter(x=>x.stories==+s.stories); }
    if(s.maxTax) list=list.filter(x=>!x.annualTax||x.annualTax<=+s.maxTax);
    if(s.neighborhoods.length) list=list.filter(x=>s.neighborhoods.includes(x.neighborhood));
    if(s.propTypes.length) list=list.filter(x=>s.propTypes.includes(x.propertyType));
    if(s.statuses.length) list=list.filter(x=>s.statuses.some(st=>(x.status||'').toLowerCase()===st.toLowerCase()));
    if(s.waterbody) list=list.filter(x=>x.waterbody===s.waterbody);
    if(s.specials.includes('new_listings')) list=list.filter(x=>x.isNewListing);
    if(s.specials.includes('open_houses'))  list=list.filter(x=>x.hasOpenHouse);
    if(s.specials.includes('price_reduced')) list=list.filter(x=>x.priceReduced);
    list.sort((a,b)=>{
      switch(s.sort){
        case 'price-asc':  return (a.price||0)-(b.price||0);
        case 'price-desc': return (b.price||0)-(a.price||0);
        case 'sqft-desc':  return (b.sqFt||0)-(a.sqFt||0);
        case 'beds-desc':  return (b.bedrooms||0)-(a.bedrooms||0);
        case 'oldest':     return new Date(a._createdDate||0)-new Date(b._createdDate||0);
        default:           return new Date(b._createdDate||0)-new Date(a._createdDate||0);
      }
    });
    return list;
  }

  // ── Main render ───────────────────────────────────────────────────────────
  _render() {
    const filtered=this._getFiltered();
    const total=filtered.length;
    const sr=this.shadowRoot;

    const cnt=sr.getElementById('rsCount');
    if(cnt) cnt.innerHTML=`${total.toLocaleString()} <small>listing${total!==1?'s':''} found</small>`;

    const gridSec=sr.getElementById('rsGridSection');
    const mapSec=sr.getElementById('rsMapSection');
    const pag=sr.getElementById('rsPag');

    if(this._state.view==='map'){
      if(gridSec) gridSec.style.display='none';
      if(mapSec)  mapSec.style.display='block';
      if(pag)     pag.innerHTML='';
      this._renderMap(filtered);
    } else {
      if(gridSec) gridSec.style.display='block';
      if(mapSec)  mapSec.style.display='none';
      this._destroyMap();
      this._renderGrid(filtered);
    }

    this._renderTags();
    this._updateFilterBadge();
  }

  // ── Grid / List render ────────────────────────────────────────────────────
  _renderGrid(filtered) {
    const sr=this.shadowRoot;
    const total=filtered.length;
    const perPage=this._perPage;
    const totalPages=Math.max(1,Math.ceil(total/perPage));
    if(this._state.page>totalPages) this._state.page=totalPages;
    const start=(this._state.page-1)*perPage;
    const page=filtered.slice(start,start+perPage);
    const grid=sr.getElementById('rsGrid');
    if(!grid) return;
    grid.className=`rs-grid${this._state.view==='list'?' list-view':''}`;
    if(!total){
      grid.innerHTML=`<div class="rs-empty">${ICONS.empty}<h3>No listings found</h3><p>Try adjusting your filters or search term.</p></div>`;
    } else {
      grid.innerHTML=page.map(item=>this._cardHTML(item)).join('');
      grid.querySelectorAll('.rs-card-cta').forEach(btn=>{
        btn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();const slug=btn.dataset.slug;this._navigate(slug);});
      });
      grid.querySelectorAll('.rs-card[data-slug]').forEach(card=>{
        card.addEventListener('click',()=>this._navigate(card.dataset.slug));
      });
    }
    this._renderPagination(totalPages);
  }

  _cardHTML(x) {
    const fmt=v=>'$'+Number(v).toLocaleString();
    const sc={active:'rs-badge-active',pending:'rs-badge-pending',contingency:'rs-badge-contingency',sold:'rs-badge-sold'};
    const statusClass=sc[(x.status||'active').toLowerCase()]||'rs-badge-active';
    const img=x.mainPhoto?`<img src="${this._imgUrl(x.mainPhoto,600,420)}" alt="${this._esc(x.title||x.address||'Listing')}" loading="lazy" onerror="this.style.display='none'">`:'🏡';
    const priceHTML=x.priceReduced&&x.originalPrice?`<span class="rs-card-price">${fmt(x.price)}<span class="rs-card-price-orig">${fmt(x.originalPrice)}</span></span>`:`<span class="rs-card-price">${x.price?fmt(x.price):'Price on request'}</span>`;
    const addrLine=[x.address,x.city,x.state,x.zipCode].filter(Boolean).join(', ');
    return `
    <div class="rs-card" data-slug="${this._esc(x.slug||'')}">
      <div class="rs-card-img">
        ${img}
        <div class="rs-card-badge ${statusClass}">${this._esc(x.status||'Active')}</div>
        ${x.isNewListing?'<div class="rs-card-badge rs-badge-new">NEW</div>':''}
        <div class="rs-card-save" title="Save">${ICONS.save}</div>
      </div>
      <div class="rs-card-body">
        ${priceHTML}
        <div class="rs-card-addr">
          <strong>${this._esc(x.title||x.address||'Listing')}</strong>
          <span class="rs-card-type">${this._esc(x.propertyType||'')}</span>
          <span>${this._esc(addrLine)}</span>
        </div>
        <div class="rs-card-specs">
          ${x.bedrooms?`<div class="rs-card-spec">${ICONS.bed}<strong>${x.bedrooms}</strong> Beds</div>`:''}
          ${x.bathrooms?`<div class="rs-card-spec">${ICONS.bath}<strong>${x.bathrooms}</strong> Baths</div>`:''}
          ${x.sqFt?`<div class="rs-card-spec">${ICONS.sqft}<strong>${Number(x.sqFt).toLocaleString()}</strong> sqft</div>`:''}
        </div>
      </div>
      <div class="rs-card-foot">
        <button class="rs-card-cta" data-slug="${this._esc(x.slug||'')}">View Details ${ICONS.arrow}</button>
        ${x.neighborhood?`<span class="rs-card-sqft">${ICONS.pin} ${this._esc(x.neighborhood)}</span>`:''}
      </div>
    </div>`;
  }

  // ── MAP SYSTEM ────────────────────────────────────────────────────────────
  _renderMap(filtered) {
    const sr=this.shadowRoot;
    const withCoords=filtered.filter(x=>x.latitude&&x.longitude);
    const noCoords=filtered.length-withCoords.length;

    // Update count badge
    const cntBadge=sr.getElementById('rsMapCount');
    if(cntBadge) cntBadge.textContent=`${filtered.length} listing${filtered.length!==1?'s':''} • ${withCoords.length} shown on map`;

    // Notice about missing coords
    const notice=sr.getElementById('rsMapNotice');
    if(notice) notice.style.display=noCoords>0&&withCoords.length>0?'block':'none';

    // Init or update map
    if(!this._leafletLoaded||!window.L){
      // Leaflet not yet loaded — show spinner and retry
      const el=sr.getElementById('rsMapEl');
      if(el) el.innerHTML='<div class="rs-loading"><div class="rs-spinner"></div><span>Loading map…</span></div>';
      setTimeout(()=>{if(this._state.view==='map')this._renderMap(filtered);},500);
      return;
    }

    if(!this._map) this._initMap();
    this._updateMapPins(withCoords);
  }

  _initMap() {
    const sr=this.shadowRoot;
    const el=sr.getElementById('rsMapEl');
    if(!el||!window.L) return;

    // Create Leaflet map inside shadow DOM
    this._map=window.L.map(el,{
      zoomControl: false,
      attributionControl: true,
    }).setView([39.5,-98.35],4); // center of US as default

    // Custom zoom control position
    window.L.control.zoom({position:'topright'}).addTo(this._map);

    // Beautiful light tile layer — Stadia Maps Alidade Smooth (no key needed)
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this._map);

    this._markerLayer=window.L.layerGroup().addTo(this._map);
  }

  _destroyMap() {
    if(this._map){
      try{this._map.remove();}catch(e){test}
      this._map=null;
      this._markerLayer=null;
      this._markers=[];
    }
  }

  _updateMapPins(listings) {
    const L=window.L;
    if(!this._map||!L) return;

    // Clear old markers
    if(this._markerLayer) this._markerLayer.clearLayers();
    this._markers=[];

    if(!listings.length) return;

    // Build markers
    listings.forEach(x=>{
      const lat=+x.latitude, lng=+x.longitude;
      if(!lat||!lng) return;

      const fmt=v=>'$'+Number(v).toLocaleString();
      const priceLabel=x.price?fmt(x.price):'Contact';
      const isSold=(x.status||'').toLowerCase()==='sold';

      // Custom DivIcon — price badge pin
      const icon=L.divIcon({
        className:'',
        html:`<div class="rs-map-pin${isSold?' sold':''}" data-id="${x._id}">${priceLabel}</div>`,
        iconSize:null,
        iconAnchor:[0,36],
        popupAnchor:[0,-40],
      });

      const marker=L.marker([lat,lng],{icon,riseOnHover:true});

      // Popup HTML
      const addrLine=[x.address,x.city,x.state].filter(Boolean).join(', ');
      const specs=[
        x.bedrooms?`<div class="rs-map-popup-spec">${ICONS.bed}<strong>${x.bedrooms}</strong> Beds</div>`:'',
        x.bathrooms?`<div class="rs-map-popup-spec">${ICONS.bath}<strong>${x.bathrooms}</strong> Baths</div>`:'',
        x.sqFt?`<div class="rs-map-popup-spec">${ICONS.sqft}<strong>${Number(x.sqFt).toLocaleString()}</strong> sqft</div>`:'',
      ].join('');
      const imgEl=x.mainPhoto?`<img src="${this._imgUrl(x.mainPhoto,320,200)}" alt="${this._esc(x.title||x.address)}" style="width:100%;height:100%;object-fit:cover;display:block">`:'🏡';

      const popupHTML=`
        <div class="rs-map-popup">
          <div class="rs-map-popup-img">${imgEl}</div>
          <div class="rs-map-popup-body">
            <div class="rs-map-popup-price">${x.price?fmt(x.price):'Price on request'}</div>
            <div class="rs-map-popup-addr">
              <strong>${this._esc(x.title||x.address||'Listing')}</strong>
              ${this._esc(addrLine)}
            </div>
            <div class="rs-map-popup-specs">${specs}</div>
            <button class="rs-map-popup-cta" data-slug="${this._esc(x.slug||'')}">View Listing →</button>
          </div>
        </div>`;

      const popup=L.popup({
        closeButton:false,
        className:'rs-leaflet-popup',
        maxWidth:300,
        minWidth:260,
        autoPanPadding:[20,20],
      }).setContent(popupHTML);

      // Hover — show popup
      marker.on('mouseover',()=>{
        marker.openPopup();
        // highlight pin
        const pinEl=marker.getElement()?.querySelector('.rs-map-pin');
        if(pinEl) pinEl.classList.add('hovered');
      });
      marker.on('mouseout',()=>{
        marker.closePopup();
        const pinEl=marker.getElement()?.querySelector('.rs-map-pin');
        if(pinEl) pinEl.classList.remove('hovered');
      });
      // Click — navigate
      marker.on('click',()=>this._navigate(x.slug));

      // CTA button click inside popup
      popup.on('add',()=>{
        setTimeout(()=>{
          // Leaflet injects popup into the main document (not shadow DOM)
          // We must query from document
          document.querySelectorAll('.rs-map-popup-cta').forEach(btn=>{
            btn.addEventListener('click',(e)=>{e.stopPropagation();this._navigate(btn.dataset.slug);});
          });
        },50);
      });

      marker.bindPopup(popup);
      this._markerLayer.addLayer(marker);
      this._markers.push(marker);
    });

    // Fit map bounds to all visible pins + padding
    if(listings.length>0){
      const latlngs=listings.map(x=>[+x.latitude,+x.longitude]).filter(([a,b])=>a&&b);
      if(latlngs.length===1){
        this._map.setView(latlngs[0],14,{animate:true});
      } else if(latlngs.length>1){
        const bounds=L.latLngBounds(latlngs);
        this._map.fitBounds(bounds,{
          padding:[52,52],      // px padding so pins aren't clipped
          maxZoom:15,           // don't zoom in too close
          animate:true,
          duration:0.6,
        });
      }
    }
  }

  _navigate(slug) {
    if(!slug) return;
    this.dispatchEvent(new CustomEvent('navigate-to-listing',{detail:{slug},bubbles:true,composed:true}));
  }

  // ── Active tags ───────────────────────────────────────────────────────────
  _renderTags() {
    const container=this.shadowRoot.getElementById('rsTags');
    if(!container) return;
    container.innerHTML='';
    const s=this._state;
    const fmt=v=>'$'+Number(v).toLocaleString();
    const tags=[];
    if(s.priceMin||s.priceMax){
      const label=s.priceMin&&s.priceMax?`${fmt(s.priceMin)} – ${fmt(s.priceMax)}`:s.priceMin?`${fmt(s.priceMin)}+`:`Up to ${fmt(s.priceMax)}`;
      tags.push({label:'💰 '+label,clear:()=>this._resetPrice()});
    }
    if(s.bedsMin||s.bedsMax) tags.push({label:`🛏 ${s.bedsMin||'Any'}–${s.bedsMax||'Any'} Beds`,clear:()=>{s.bedsMin='';s.bedsMax='';this._resetPanelSelect('pBedsMin');this._resetPanelSelect('pBedsMax');this._render();}});
    if(s.bathsMin||s.bathsMax) tags.push({label:`🛁 ${s.bathsMin||'Any'}–${s.bathsMax||'Any'} Baths`,clear:()=>{s.bathsMin='';s.bathsMax='';this._resetPanelSelect('pBathsMin');this._resetPanelSelect('pBathsMax');this._render();}});
    if(s.sqftMin||s.sqftMax) tags.push({label:`📐 ${s.sqftMin||'Any'}–${s.sqftMax||'Any'} sqft`,clear:()=>{s.sqftMin='';s.sqftMax='';this._resetPanelSelect('pSqftMin');this._resetPanelSelect('pSqftMax');this._render();}});
    if(s.yearMin||s.yearMax) tags.push({label:`🏗 ${s.yearMin||'Any'}–${s.yearMax||'Any'} Built`,clear:()=>{s.yearMin='';s.yearMax='';this._resetPanelSelect('pYearMin');this._resetPanelSelect('pYearMax');this._render();}});
    s.propTypes.forEach(t=>tags.push({label:'🏠 '+t,clear:()=>{s.propTypes.splice(s.propTypes.indexOf(t),1);this.shadowRoot.querySelectorAll(`[data-val="${t}"],[data-panel-type="${t}"]`).forEach(el=>el.classList.remove('sel'));const pill=this.shadowRoot.querySelector('[data-state-key="propTypes"]');if(pill)this._updatePillLabel(pill,'Type',s.propTypes.length);this._render();}}));
    s.neighborhoods.forEach(n=>tags.push({label:'📍 '+n,clear:()=>{s.neighborhoods.splice(s.neighborhoods.indexOf(n),1);this.shadowRoot.querySelectorAll(`[data-nbhd="${n}"]`).forEach(el=>el.classList.remove('sel'));this._render();}}));
    if(s.waterbody) tags.push({label:'💧 '+s.waterbody,clear:()=>{s.waterbody='';this._resetPanelSelect('pWaterbody');this._render();}});
    if(s.maxTax) tags.push({label:`🏛 Max Tax: ${fmt(s.maxTax)}/yr`,clear:()=>{s.maxTax='';const el=this.shadowRoot.getElementById('pMaxTax');if(el)el.value='';this._render();}});
    const sl={new_listings:'New Only',open_houses:'Open Houses',price_reduced:'Price Reduced'};
    s.specials.forEach(sp=>tags.push({label:'⭐ '+sl[sp],clear:()=>{s.specials.splice(s.specials.indexOf(sp),1);this.shadowRoot.querySelectorAll(`[data-special="${sp}"]`).forEach(el=>el.classList.remove('sel'));this._render();}}));

    tags.forEach(t=>{
      const el=document.createElement('div');el.className='rs-tag';
      el.innerHTML=`${t.label} <span class="rs-tag-x">✕</span>`;
      el.querySelector('.rs-tag-x').onclick=()=>{t.clear();this._renderTags();this._updateFilterBadge();};
      container.appendChild(el);
    });
    if(tags.length>1){
      const btn=document.createElement('button');btn.className='rs-clear-all';btn.textContent='Clear all';
      btn.onclick=()=>this._resetAll();container.appendChild(btn);
    }
  }

  _resetPanelSelect(id){const el=this.shadowRoot.getElementById(id);if(el)el.value='';}

  _updateFilterBadge(){
    const s=this._state;
    const c=[s.priceMin||s.priceMax?1:0,s.bedsMin||s.bedsMax?1:0,s.bathsMin||s.bathsMax?1:0,s.sqftMin||s.sqftMax?1:0,s.lotMin||s.lotMax?1:0,s.yearMin||s.yearMax?1:0,s.garageMin||s.garageMax?1:0,s.maxTax?1:0,s.waterbody?1:0,s.propTypes.length,s.neighborhoods.length,s.specials.length].reduce((a,b)=>a+b,0);
    const badge=this.shadowRoot.getElementById('rsFilterBadge');
    if(badge){badge.style.display=c>0?'inline-flex':'none';badge.textContent=c;}
  }

  _resetAll(){
    const s=this._state;
    Object.assign(s,{priceMin:null,priceMax:null,bedsMin:'',bedsMax:'',bathsMin:'',bathsMax:'',sqftMin:'',sqftMax:'',lotMin:'',lotMax:'',yearMin:'',yearMax:'',garageMin:'',garageMax:'',parkingMin:'',parkingMax:'',stories:'',maxTax:'',waterbody:'',page:1});
    s.propTypes.length=0;s.neighborhoods.length=0;s.specials.length=0;
    s.statuses.length=0;s.statuses.push('Active');
    this.shadowRoot.querySelectorAll('.rs-check-item,.rs-nbhd-item,.rs-special-btn').forEach(el=>el.classList.remove('sel'));
    this.shadowRoot.querySelectorAll('.rs-status-btn').forEach(btn=>btn.classList.toggle('sel',btn.dataset.val==='Active'));
    this.shadowRoot.querySelectorAll('.rs-pill').forEach(p=>{p.classList.remove('has-val','active');});
    this._resetPrice();this._rebuildDynamicParts();this._render();
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  _renderPagination(totalPages){
    const pag=this.shadowRoot.getElementById('rsPag');
    if(!pag)return;
    if(totalPages<=1){pag.innerHTML='';return;}
    const cur=this._state.page,max=5;
    let start=Math.max(1,cur-2),end=Math.min(totalPages,start+max-1);
    if(end-start<max-1)start=Math.max(1,end-max+1);
    let html=`<button class="rs-pbn" data-pg="prev" ${cur===1?'disabled':''}>${ICONS.chevL}</button>`;
    if(start>1){html+=`<button class="rs-pbn" data-pg="1">1</button>`;if(start>2)html+=`<span class="rs-pdot">…</span>`;}
    for(let i=start;i<=end;i++)html+=`<button class="rs-pbn${i===cur?' active':''}" data-pg="${i}">${i}</button>`;
    if(end<totalPages){if(end<totalPages-1)html+=`<span class="rs-pdot">…</span>`;html+=`<button class="rs-pbn" data-pg="${totalPages}">${totalPages}</button>`;}
    html+=`<button class="rs-pbn" data-pg="next" ${cur===totalPages?'disabled':''}>${ICONS.chevR}</button>`;
    pag.innerHTML=html;
    pag.querySelectorAll('.rs-pbn[data-pg]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const pg=btn.dataset.pg;
        if(pg==='prev'){if(cur>1){this._state.page--;this._render();}}
        else if(pg==='next'){if(cur<totalPages){this._state.page++;this._render();}}
        else{this._state.page=parseInt(pg);this._render();}
        this.scrollIntoView({behavior:'smooth',block:'start'});
      });
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  _imgUrl(raw,w=600,h=420){
    if(!raw||typeof raw!=='string') return '';
    if(raw.startsWith('https://static.wixstatic.com/media/')){try{const fn=raw.split('/media/')[1]?.split('/')[0];if(!fn)return raw;return `https://static.wixstatic.com/media/${fn}/v1/fill/w_${w},h_${h},al_c,q_80,enc_avif,quality_auto/${fn}`;}catch(e){return raw;}}
    if(raw.startsWith('http://')||raw.startsWith('https://')) return raw;
    if(raw.startsWith('wix:image://')){try{const fid=raw.split('/')[3]?.split('#')[0];if(!fid)return '';let fn=fid.includes('~mv2')?fid:`${fid}~mv2.jpg`;if(!fn.includes('.'))fn+='.jpg';return `https://static.wixstatic.com/media/${fn}/v1/fill/w_${w},h_${h},al_c,q_80,enc_avif,quality_auto/${fn}`;}catch(e){return '';}}
    return raw;
  }
  _esc(t){if(t===null||t===undefined)return '';const d=document.createElement('div');d.textContent=String(t);return d.innerHTML;}
}

customElements.define('real-estate-search',RealEstateSearch);
