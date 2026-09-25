// Всички картинки в играта — векторни (SVG), рисувани тук. Растеризират се при зареждане (BootScene)
// в двойна резолюция (TS), за да са остри на телефони и големи монитори.

export const OUT = '#4a2c17';
const SW = 'stroke="#4a2c17" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

export interface SvgDef { w: number; h: number; body: string }

const d = (w: number, h: number, body: string): SvgDef => ({ w, h, body });

function sesame(xs: [number, number, number][]): string {
  return xs
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.8" transform="rotate(${r} ${x} ${y})" fill="#fff4d6" stroke="#c98a3a" stroke-width="0.8"/>`)
    .join('');
}

function speckles(pts: [number, number][], color: string, r = 1.8): string {
  return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`).join('');
}

function friesSticks(color: string, dark: string, n = 9, w = 70, top = 6, base = 38): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = 8 + (i * (w - 16)) / (n - 1);
    const hgt = top + ((i * 7) % 11);
    const rot = ((i * 13) % 17) - 8;
    s += `<rect x="${x - 4}" y="${hgt}" width="8" height="${base - hgt}" rx="2" fill="${color}" stroke="${dark}" stroke-width="1.6" transform="rotate(${rot} ${x} ${base})"/>`;
  }
  return s;
}

function cupBody(band: string): string {
  return `<path d="M6 14 L44 14 L39 78 Q38.5 82 34 82 L16 82 Q11.5 82 11 78 Z" fill="#ffffff" ${SW}/>
  <path d="M8.3 40 L41.7 40 L40.3 58 L9.7 58 Z" fill="${band}"/>
  <circle cx="25" cy="49" r="6" fill="#fff" opacity="0.9"/>
  <path d="M22 49 l3 -4 l3 4 l-3 4z" fill="${band}"/>`;
}

function liquidPath(color: string, foam = false): string {
  // вътрешността на чашата (за пълнене) — същата форма като cup_empty
  return `<path d="M3 0 L41 0 L36 62 Q35.5 65 31 65 L13 65 Q8.5 65 8 62 Z" fill="${color}"/>
  <path d="M5 2 L12 2 L11 60 L9 60 Z" fill="#ffffff" opacity="0.25"/>
  ${foam ? '<rect x="3" y="0" width="38" height="4" fill="#fff" opacity="0.5"/>' : ''}`;
}

function lidCup(band: string, straw: string): string {
  return `<rect x="30" y="0" width="7" height="30" rx="2" transform="rotate(12 33 20)" fill="${straw}" ${SW}/>
  ${cupBody(band)}
  <path d="M3 10 Q3 6 8 6 L42 6 Q47 6 47 10 L47 15 L3 15 Z" fill="#f2f2f2" ${SW}/>`;
}

export const SVGS: Record<string, SvgDef> = {
  // ------------------------------------------------------------ съставки за бургер
  bun_bottom: d(100, 30, `<path d="M6 5 H94 Q97 5 96 10 L92 21 Q90 27 83 27 H17 Q10 27 8 21 L4 10 Q3 5 6 5Z" fill="#e9a24c" ${SW}/>
    <path d="M8 6.5 H92" stroke="#f8d596" stroke-width="4" stroke-linecap="round"/>`),
  bun_top: d(104, 56, `<path d="M5 47 Q4 7 52 5 Q100 7 99 47 Q99 52 92 52 H12 Q5 52 5 47Z" fill="#ee9f45" ${SW}/>
    <path d="M18 24 Q28 12 46 10" stroke="#f9d59a" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${sesame([[35, 20, 20], [52, 15, -10], [68, 20, 35], [45, 30, -30], [62, 32, 10], [78, 31, -20], [28, 35, 40], [86, 42, 0], [20, 44, -15]])}`),
  patty_raw: d(96, 26, `<rect x="4" y="3" width="88" height="20" rx="10" fill="#e0707a" ${SW}/>
    ${speckles([[15, 10], [28, 15], [40, 9], [55, 16], [66, 10], [80, 14], [22, 18], [72, 18], [48, 12]], '#f7a9b0', 2.2)}`),
  patty_cooked: d(96, 26, `<rect x="4" y="3" width="88" height="20" rx="10" fill="#7d4321" ${SW}/>
    <path d="M18 7 l10 12 M36 7 l10 12 M54 7 l10 12 M72 7 l8 10" stroke="#4f2810" stroke-width="3" stroke-linecap="round"/>
    ${speckles([[14, 14], [30, 9], [62, 16], [82, 9]], '#a0643a', 2)}`),
  patty_burnt: d(96, 26, `<rect x="4" y="3" width="88" height="20" rx="10" fill="#2b1e18" ${SW}/>
    ${speckles([[15, 10], [28, 15], [40, 9], [55, 16], [66, 10], [80, 14]], '#5a5048', 2.4)}`),
  cheese: d(100, 30, `<path d="M3 4 H97 L94 12 Q88 12 86 20 Q84 27 80 20 Q76 12 60 12 L40 12 Q30 12 28 22 Q26 28 23 22 Q20 12 8 12 Z" fill="#ffc928" ${SW}/>
    <circle cx="50" cy="8" r="2" fill="#f3a712"/><circle cx="70" cy="7" r="1.6" fill="#f3a712"/>`),
  tomato_layer: d(96, 20, `<rect x="4" y="3" width="42" height="14" rx="7" fill="#e8342c" ${SW}/>
    <rect x="50" y="3" width="42" height="14" rx="7" fill="#e8342c" ${SW}/>
    <path d="M12 8 H36 M58 8 H84" stroke="#ff8b7e" stroke-width="3" stroke-linecap="round"/>`),
  lettuce_layer: d(104, 22, `<path d="M3 10 Q8 2 14 9 Q20 2 26 9 Q32 2 38 9 Q44 2 50 9 Q56 2 62 9 Q68 2 74 9 Q80 2 86 9 Q92 2 101 10 Q98 20 88 16 Q80 21 70 16 Q60 21 50 16 Q40 21 30 16 Q20 21 12 16 Q4 20 3 10Z" fill="#6fcf3a" ${SW}/>
    <path d="M14 12 Q50 9 90 12" stroke="#b6f07a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
  onion_layer: d(96, 16, `<ellipse cx="26" cy="8" rx="22" ry="5.5" fill="#f4e6f7" stroke="#8d4fa0" stroke-width="3"/>
    <ellipse cx="70" cy="8" rx="22" ry="5.5" fill="#f4e6f7" stroke="#8d4fa0" stroke-width="3"/>`),
  pickle_layer: d(96, 16, `<ellipse cx="24" cy="8" rx="18" ry="5.5" fill="#8cc152" ${SW}/><ellipse cx="72" cy="8" rx="18" ry="5.5" fill="#8cc152" ${SW}/>
    ${speckles([[18, 8], [28, 7], [66, 8], [78, 7]], '#dff5b8', 1.6)}`),

  // ------------------------------------------------------------ суровини в кашони / кошници
  tomato: d(60, 56, `<circle cx="30" cy="31" r="22" fill="#ec3b2e" ${SW}/>
    <path d="M17 24 Q20 16 28 16" stroke="#ff9b8f" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M30 12 L27 5 M22 13 Q30 20 38 13 Q32 11 30 12 Q26 10 22 13Z" fill="#3fae3a" ${SW}/>`),
  tomato_slices: d(90, 56, `<ellipse cx="25" cy="34" rx="18" ry="16" fill="#ec3b2e" ${SW}/><ellipse cx="25" cy="34" rx="11" ry="10" fill="#ff8f80"/>
    <ellipse cx="46" cy="30" rx="18" ry="16" fill="#ec3b2e" ${SW}/><ellipse cx="46" cy="30" rx="11" ry="10" fill="#ff8f80"/>
    <ellipse cx="66" cy="34" rx="18" ry="16" fill="#ec3b2e" ${SW}/><ellipse cx="66" cy="34" rx="11" ry="10" fill="#ff8f80"/>
    ${speckles([[63, 30], [70, 36], [66, 38], [60, 36], [72, 30]], '#ffe082', 1.8)}`),
  potato: d(64, 48, `<ellipse cx="32" cy="25" rx="27" ry="19" fill="#c8924f" ${SW}/>
    ${speckles([[20, 18], [38, 14], [44, 30], [26, 32], [50, 22]], '#8b5a2b', 2)}
    <path d="M14 20 Q20 12 30 11" stroke="#e3b579" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
  potato_sticks: d(84, 46, `${friesSticks('#fbe6a6', '#caa55a', 10, 84, 10, 40)}`),
  fries_pale: d(90, 44, friesSticks('#fbe6a6', '#caa55a', 11, 90, 6, 42)),
  fries_golden: d(90, 44, friesSticks('#ffc53a', '#c47f10', 11, 90, 6, 42)),
  fries_brown: d(90, 44, friesSticks('#c77c22', '#7b4410', 11, 90, 6, 42)),
  fries_burnt: d(90, 44, friesSticks('#3a2a1e', '#171008', 11, 90, 6, 42)),
  fries_box: d(64, 80, `${friesSticks('#ffc53a', '#c47f10', 8, 60, 2, 40).replace(/rotate\(([-\d]+) /g, (_m, a) => `rotate(${Number(a) / 2} `)}
    <path d="M6 30 L58 30 L52 76 Q51 78 48 78 L16 78 Q13 78 12 76 Z" fill="#e53935" ${SW}/>
    <path d="M6 30 Q32 44 58 30" fill="#c62828" ${SW}/>
    <circle cx="32" cy="56" r="10" fill="#ffc928" stroke="#4a2c17" stroke-width="2"/>
    <path d="M27 56 Q32 50 37 56 M27 58 H37" stroke="#4a2c17" stroke-width="2" fill="none"/>`),
  salted: d(40, 24, `${speckles([[6, 12], [14, 6], [22, 14], [30, 8], [36, 16], [18, 20], [10, 18]], '#ffffff', 2)}`),

  // ------------------------------------------------------------ напитки
  cup_empty: d(50, 86, `<path d="M6 14 L44 14 L39 78 Q38.5 82 34 82 L16 82 Q11.5 82 11 78 Z" fill="#ffffff" fill-opacity="0.55" ${SW}/>
    <path d="M8 28 L42 28" stroke="#4a2c17" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>`),
  liq_cola: d(44, 66, liquidPath('#5a2a0c', true)),
  liq_fanta: d(44, 66, liquidPath('#ff8a1c', true)),
  liq_sprite: d(44, 66, liquidPath('#b9ee7a', true)),
  liq_milkshake: d(44, 66, liquidPath('#f7a8c8')),
  liq_juice: d(44, 66, liquidPath('#ffb300')),
  drink_cola: d(50, 86, lidCup('#b3261e', '#ffffff')),
  drink_fanta: d(50, 86, lidCup('#ff8a1c', '#1e88e5')),
  drink_sprite: d(50, 86, lidCup('#43a047', '#ffeb3b')),
  coffee_cup: d(64, 56, `<path d="M8 12 H48 L44 44 Q43 50 36 50 H20 Q13 50 12 44 Z" fill="#fff" ${SW}/>
    <path d="M48 20 Q60 20 58 30 Q56 38 46 37" fill="none" ${SW}/>
    <ellipse cx="28" cy="13" rx="19" ry="4" fill="#6d3b1a" stroke="#4a2c17" stroke-width="2"/>`),
  coffee_cap: d(64, 56, `<path d="M8 12 H48 L44 44 Q43 50 36 50 H20 Q13 50 12 44 Z" fill="#fff" ${SW}/>
    <path d="M48 20 Q60 20 58 30 Q56 38 46 37" fill="none" ${SW}/>
    <ellipse cx="28" cy="13" rx="19" ry="4" fill="#f1dcc0" stroke="#4a2c17" stroke-width="2"/>
    <path d="M22 13 Q28 9 34 13 Q28 16 22 13" fill="#b07a4a"/>`),

  // ------------------------------------------------------------ кухня
  plate: d(130, 34, `<ellipse cx="65" cy="17" rx="61" ry="13" fill="#ffffff" ${SW}/><ellipse cx="65" cy="15" rx="44" ry="7" fill="#eef3f7"/>`),
  board: d(140, 80, `<rect x="4" y="8" width="132" height="68" rx="14" fill="#d9a066" ${SW}/>
    <circle cx="120" cy="22" r="6" fill="#b37a43" stroke="#4a2c17" stroke-width="2"/>
    <path d="M18 30 H90 M22 50 H110 M16 64 H70" stroke="#c38a52" stroke-width="3" stroke-linecap="round"/>`),
  knife: d(90, 26, `<path d="M4 14 Q30 3 60 8 L60 18 Q30 20 4 14Z" fill="#dfe6ea" ${SW}/>
    <rect x="58" y="7" width="28" height="12" rx="4" fill="#5d4037" ${SW}/>`),
  crate: d(110, 56, `<rect x="4" y="12" width="102" height="40" rx="5" fill="#c68a4a" ${SW}/>
    <path d="M6 26 H104 M6 40 H104" stroke="#8d5a2b" stroke-width="3"/>`),
  sack: d(96, 90, `<path d="M16 26 Q8 70 18 84 H78 Q88 70 80 26 Z" fill="#c9a26b" ${SW}/>
    <path d="M14 26 Q48 16 82 26 Q48 34 14 26Z" fill="#a37c46" ${SW}/>
    <path d="M30 50 Q48 58 66 50" stroke="#8a6333" stroke-width="3" fill="none"/>
    <text x="48" y="74" font-family="Arial Black,Arial" font-weight="900" font-size="13" text-anchor="middle" fill="#6d4a20">КАРТОФИ</text>`),
  patty_tray: d(120, 60, `<rect x="4" y="16" width="112" height="38" rx="8" fill="#9ecfe8" ${SW}/>
    <rect x="10" y="22" width="100" height="26" rx="6" fill="#d7eef9"/>`),
  bin: d(96, 56, `<path d="M4 12 H92 L86 52 H10 Z" fill="#b0bec5" ${SW}/><path d="M8 18 H88" stroke="#eceff1" stroke-width="3"/>`),
  bun_bag: d(110, 60, `<path d="M6 20 H104 L98 56 H12 Z" fill="#f5deb3" ${SW}/>
    <path d="M18 20 Q14 4 30 6 L90 6 Q98 6 94 20" fill="#fff4dc" ${SW}/>`),
  fryer: d(260, 150, `<rect x="4" y="18" width="252" height="128" rx="16" fill="#b0bec5" ${SW}/>
    <rect x="16" y="28" width="228" height="54" rx="10" fill="#6d4c1e" ${SW}/>
    <rect x="20" y="32" width="220" height="16" rx="8" fill="#b88422"/>
    <rect x="16" y="98" width="228" height="36" rx="8" fill="#90a4ae" stroke="#4a2c17" stroke-width="2"/>
    <circle cx="44" cy="116" r="11" fill="#eceff1" ${SW}/><path d="M44 116 L50 110" ${SW}/>
    <circle cx="216" cy="116" r="7" fill="#ff5252" ${SW}/>`),
  basket: d(110, 70, `<path d="M6 16 H90 L84 62 H12 Z" fill="#cfd8dc" fill-opacity="0.35" ${SW}/>
    <path d="M20 16 L22 62 M34 16 L35 62 M48 16 L48 62 M62 16 L61 62 M76 16 L74 62 M8 30 H88 M10 46 H86" stroke="#78909c" stroke-width="2"/>
    <path d="M90 22 H106" stroke="#212121" stroke-width="8" stroke-linecap="round"/>`),
  grill: d(220, 150, `<rect x="4" y="22" width="212" height="124" rx="14" fill="#546e7a" ${SW}/>
    <rect x="14" y="30" width="192" height="92" rx="8" fill="#263238" ${SW}/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M22 ${38 + i * 11} H198" stroke="#455a64" stroke-width="4" stroke-linecap="round"/>`).join('')}
    <circle cx="40" cy="134" r="6" fill="#ff7043" stroke="#4a2c17" stroke-width="2"/><circle cx="180" cy="134" r="6" fill="#ff7043" stroke="#4a2c17" stroke-width="2"/>`),
  soda_machine: d(260, 210, `<rect x="4" y="4" width="252" height="202" rx="16" fill="#e53935" ${SW}/>
    <rect x="16" y="16" width="228" height="46" rx="10" fill="#fff3e0" ${SW}/>
    <rect x="16" y="74" width="228" height="120" rx="10" fill="#37474f" ${SW}/>
    <rect x="16" y="180" width="228" height="14" rx="4" fill="#90a4ae" stroke="#4a2c17" stroke-width="2"/>`),
  nozzle: d(46, 34, `<rect x="4" y="3" width="38" height="18" rx="6" fill="#cfd8dc" ${SW}/><rect x="17" y="20" width="12" height="11" rx="3" fill="#90a4ae" ${SW}/>`),
  warmer: d(240, 56, `<rect x="4" y="18" width="232" height="34" rx="8" fill="#ffb74d" ${SW}/>
    <rect x="14" y="4" width="212" height="12" rx="6" fill="#ff7043" ${SW}/>`),
  salt: d(40, 64, `<path d="M8 22 H32 L34 60 H6 Z" fill="#eceff1" ${SW}/>
    <path d="M8 22 Q8 6 20 6 Q32 6 32 22Z" fill="#b0bec5" ${SW}/>
    ${speckles([[16, 13], [22, 11], [26, 15], [18, 17]], '#4a2c17', 1.3)}
    <text x="20" y="48" font-family="Arial Black,Arial" font-size="12" font-weight="900" text-anchor="middle" fill="#4a2c17">СОЛ</text>`),
  trash: d(80, 96, `<path d="M10 24 H70 L64 92 H16 Z" fill="#78909c" ${SW}/>
    <rect x="4" y="12" width="72" height="14" rx="5" fill="#546e7a" ${SW}/><rect x="30" y="4" width="20" height="10" rx="4" fill="#546e7a" ${SW}/>
    <path d="M28 36 V80 M40 36 V80 M52 36 V80" stroke="#546e7a" stroke-width="4" stroke-linecap="round"/>`),
  coffee_machine: d(200, 200, `<rect x="4" y="20" width="192" height="176" rx="16" fill="#5d4037" ${SW}/>
    <rect x="18" y="32" width="164" height="40" rx="8" fill="#efebe9" ${SW}/>
    <rect x="18" y="84" width="164" height="90" rx="8" fill="#3e2723" ${SW}/>
    <rect x="18" y="176" width="164" height="12" rx="4" fill="#9e9e9e" stroke="#4a2c17" stroke-width="2"/>`),
  milk_jug: d(60, 70, `<path d="M12 18 H44 L48 64 H8 Z" fill="#cfd8dc" ${SW}/><path d="M44 24 Q58 26 54 42 Q52 50 46 50" fill="none" ${SW}/>
    <path d="M12 18 L4 10" ${SW}/><rect x="10" y="30" width="36" height="10" fill="#ffffff"/>`),

  // ------------------------------------------------------------ зала
  table: d(170, 86, `<rect x="76" y="40" width="18" height="42" fill="#8d5a2b" ${SW}/>
    <ellipse cx="85" cy="80" rx="34" ry="6" fill="#6d4420" ${SW}/>
    <ellipse cx="85" cy="30" rx="80" ry="24" fill="#ffffff" ${SW}/>
    <path d="M8 32 Q10 48 20 50 L150 50 Q160 48 162 32" fill="#e53935" ${SW}/>
    <path d="M30 50 V44 M55 50 V44 M85 50 V44 M115 50 V44 M140 50 V44" stroke="#ffffff" stroke-width="5"/>
    <ellipse cx="85" cy="28" rx="80" ry="22" fill="#fff8ec"/>`),
  chair: d(70, 110, `<rect x="10" y="4" width="50" height="60" rx="12" fill="#ff8f00" ${SW}/><rect x="18" y="12" width="34" height="44" rx="8" fill="#ffb300"/>
    <rect x="8" y="60" width="54" height="14" rx="6" fill="#ef6c00" ${SW}/>
    <path d="M14 74 V106 M56 74 V106" ${SW}/>`),
  dirty: d(110, 44, `<ellipse cx="44" cy="30" rx="36" ry="10" fill="#fff" ${SW}/><ellipse cx="72" cy="24" rx="30" ry="9" fill="#fff" ${SW}/>
    ${speckles([[38, 28], [52, 31], [70, 22], [80, 25], [30, 31]], '#a1887f', 3)}
    <path d="M86 12 L100 30" stroke="#90a4ae" stroke-width="4" stroke-linecap="round"/>`),
  door: d(120, 240, `<rect x="6" y="6" width="108" height="232" rx="6" fill="#8d5a2b" ${SW}/>
    <rect x="18" y="20" width="84" height="96" rx="6" fill="#b3e5fc" ${SW}/>
    <path d="M30 34 L50 30 M28 50 L70 38" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    <rect x="18" y="132" width="84" height="90" rx="6" fill="#a1683a" stroke="#4a2c17" stroke-width="2"/>
    <circle cx="96" cy="126" r="6" fill="#ffd54f" ${SW}/>`),
  window: d(200, 120, `<rect x="6" y="6" width="188" height="108" rx="10" fill="#bbdefb" ${SW}/>
    <path d="M100 8 V112 M8 60 H192" stroke="#4a2c17" stroke-width="4"/>
    <path d="M24 26 L50 20 M120 30 L160 18" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    <path d="M6 6 Q40 36 34 114 L6 114Z M194 6 Q160 36 166 114 L194 114Z" fill="#ef5350" ${SW}/>`),
  plant: d(70, 110, `<path d="M16 64 H54 L48 106 H22 Z" fill="#8d6e63" ${SW}/>
    <path d="M35 66 Q10 40 20 16 Q34 36 35 66 Q40 30 58 22 Q58 50 35 66 Q30 44 8 44 Q18 64 35 66" fill="#66bb6a" ${SW}/>`),
  picture: d(90, 70, `<rect x="4" y="4" width="82" height="62" rx="4" fill="#ffe082" ${SW}/><rect x="12" y="12" width="66" height="46" fill="#81d4fa"/>
    <path d="M12 58 L34 32 L50 48 L62 38 L78 58Z" fill="#43a047"/><circle cx="64" cy="24" r="7" fill="#fff176"/>`),
  jukebox: d(80, 120, `<path d="M6 116 V40 Q6 4 40 4 Q74 4 74 40 V116 Z" fill="#8e24aa" ${SW}/>
    <path d="M16 60 Q16 16 40 16 Q64 16 64 60 Z" fill="#ffca28" ${SW}/>
    <rect x="16" y="70" width="48" height="30" rx="4" fill="#212121" ${SW}/>
    ${[0, 1, 2].map((i) => `<circle cx="${26 + i * 14}" cy="85" r="4" fill="${['#ff5252', '#69f0ae', '#40c4ff'][i]}"/>`).join('')}`),
  neon: d(220, 70, `<rect x="4" y="4" width="212" height="62" rx="16" fill="#1a1a2e" ${SW}/>
    <text x="110" y="46" font-family="Arial Black,Arial" font-size="26" font-weight="900" text-anchor="middle" fill="#ff4fd8" stroke="#ffd1f5" stroke-width="1">BURGERS</text>`),

  // ------------------------------------------------------------ интерфейс и ефекти
  coin: d(44, 44, `<circle cx="22" cy="22" r="18" fill="#ffca28" ${SW}/><circle cx="22" cy="22" r="12" fill="#ffe082" stroke="#e0a100" stroke-width="2"/>
    <text x="22" y="28" font-family="Arial Black,Arial" font-size="15" font-weight="900" text-anchor="middle" fill="#c77800">$</text>`),
  gem: d(44, 44, `<path d="M8 16 L16 6 H28 L36 16 L22 40 Z" fill="#4dd0e1" ${SW}/><path d="M8 16 H36 M16 6 L18 16 L22 40 M28 6 L26 16 L22 40" stroke="#4a2c17" stroke-width="1.6" fill="none"/>
    <path d="M14 14 L18 9" stroke="#e0f7fa" stroke-width="3" stroke-linecap="round"/>`),
  star: d(64, 62, `<path d="M32 4 L40 23 L60 24 L44 37 L50 57 L32 46 L14 57 L20 37 L4 24 L24 23 Z" fill="#ffd21f" ${SW}/>
    <path d="M24 26 L30 16" stroke="#fff6c2" stroke-width="4" stroke-linecap="round"/>`),
  star_empty: d(64, 62, `<path d="M32 4 L40 23 L60 24 L44 37 L50 57 L32 46 L14 57 L20 37 L4 24 L24 23 Z" fill="#000" fill-opacity="0.25" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3" stroke-linejoin="round"/>`),
  heart: d(36, 32, `<path d="M18 29 Q2 18 4 10 Q6 2 13 3 Q17 4 18 9 Q19 4 23 3 Q30 2 32 10 Q34 18 18 29Z" fill="#ff4d6d" ${SW}/>`),
  hand: d(70, 84, `<path d="M26 40 V12 Q26 4 33 4 Q40 4 40 12 V34 Q48 30 52 36 Q60 34 62 42 Q70 42 70 52 V62 Q70 80 50 80 H38 Q26 80 18 68 L6 50 Q2 42 10 40 Q16 38 26 50 Z" fill="#ffffff" ${SW}/>
    <path d="M40 38 V50 M52 38 V50" stroke="#4a2c17" stroke-width="2.5" stroke-linecap="round"/>`),
  flip: d(46, 46, `<circle cx="23" cy="23" r="20" fill="#ffffff" ${SW}/>
    <path d="M13 22 Q14 12 24 12 Q32 12 34 19 M33 12 V20 H25" fill="none" stroke="#43a047" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M33 25 Q32 34 22 34 Q14 34 12 27 M13 34 V26 H21" fill="none" stroke="#43a047" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  smoke: d(48, 44, `<circle cx="16" cy="26" r="12" fill="#9e9e9e"/><circle cx="30" cy="18" r="14" fill="#bdbdbd"/><circle cx="34" cy="30" r="10" fill="#9e9e9e"/>`),
  spark: d(24, 24, `<path d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z" fill="#fff59d" stroke="#ffb300" stroke-width="1.5"/>`),
  dot: d(12, 12, `<circle cx="6" cy="6" r="5" fill="#ffffff"/>`),
  puddle: d(100, 26, `<path d="M8 14 Q4 4 22 6 Q34 0 50 5 Q70 1 84 7 Q98 8 92 16 Q96 24 74 22 Q54 26 34 22 Q10 24 8 14Z" fill="#8d6e63" fill-opacity="0.7"/>`),
  lock: d(48, 56, `<path d="M14 24 V16 Q14 6 24 6 Q34 6 34 16 V24" fill="none" stroke="#4a2c17" stroke-width="5"/>
    <rect x="6" y="22" width="36" height="30" rx="6" fill="#ffca28" ${SW}/><circle cx="24" cy="36" r="4" fill="#4a2c17"/>`),
  check: d(40, 40, `<circle cx="20" cy="20" r="17" fill="#43a047" ${SW}/><path d="M11 20 L18 27 L30 13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  clock: d(44, 44, `<circle cx="22" cy="22" r="18" fill="#fff" ${SW}/><path d="M22 10 V22 L30 27" stroke="#4a2c17" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
  gear: d(48, 48, `<circle cx="24" cy="24" r="14" fill="#90a4ae" ${SW}/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="20" y="2" width="8" height="10" rx="2" fill="#90a4ae" stroke="#4a2c17" stroke-width="2.5" transform="rotate(${a} 24 24)"/>`).join('')}
    <circle cx="24" cy="24" r="14" fill="#90a4ae"/><circle cx="24" cy="24" r="6" fill="#eceff1" ${SW}/>`),
  pause: d(44, 44, `<rect x="10" y="8" width="9" height="28" rx="3" fill="#fff" ${SW}/><rect x="25" y="8" width="9" height="28" rx="3" fill="#fff" ${SW}/>`),
  broom: d(60, 60, `<path d="M40 6 L26 34" stroke="#8d5a2b" stroke-width="6" stroke-linecap="round"/><path d="M14 30 L36 40 L28 56 Q14 58 6 48 Z" fill="#ffca28" ${SW}/>`),
  bolt: d(40, 48, `<path d="M24 2 L6 28 H20 L14 46 L34 18 H20 Z" fill="#ffd21f" ${SW}/>`),
  snow: d(44, 44, `<path d="M22 4 V40 M6 13 L38 31 M6 31 L38 13" stroke="#4fc3f7" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="22" r="5" fill="#fff" stroke="#4fc3f7" stroke-width="3"/>`),
  gift: d(60, 60, `<rect x="6" y="24" width="48" height="32" rx="4" fill="#e53935" ${SW}/><rect x="3" y="16" width="54" height="12" rx="3" fill="#ef5350" ${SW}/>
    <rect x="25" y="16" width="10" height="40" fill="#ffd54f" stroke="#4a2c17" stroke-width="2"/>
    <path d="M30 16 Q16 2 12 10 Q10 16 30 16 Q44 2 48 10 Q50 16 30 16" fill="#ffd54f" ${SW}/>`),
  logo_burger: d(240, 200, `
    <path d="M14 120 H226 Q232 120 230 128 L222 152 Q218 162 206 162 H34 Q22 162 18 152 L10 128 Q8 120 14 120Z" fill="#e9a24c" ${SW}/>
    <rect x="8" y="98" width="224" height="30" rx="15" fill="#7d4321" ${SW}/>
    <path d="M6 94 H234 L228 108 Q218 108 214 122 Q210 132 204 120 Q198 108 150 108 L90 108 Q60 108 56 124 Q52 134 46 122 Q40 108 14 108Z" fill="#ffc928" ${SW}/>
    <path d="M8 90 Q18 74 30 88 Q42 74 54 88 Q66 74 78 88 Q90 74 102 88 Q114 74 126 88 Q138 74 150 88 Q162 74 174 88 Q186 74 198 88 Q210 74 232 90 Q226 100 210 98 L30 98 Q14 100 8 90Z" fill="#6fcf3a" ${SW}/>
    <path d="M10 84 Q8 12 120 8 Q232 12 230 84 Q230 92 220 92 H20 Q10 92 10 84Z" fill="#ee9f45" ${SW}/>
    <path d="M40 46 Q60 22 100 18" stroke="#f9d59a" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${sesame([[80, 40, 20], [120, 30, -10], [160, 40, 35], [100, 60, -30], [140, 62, 10], [180, 60, -20], [60, 66, 40], [200, 76, 0]]).replace(/rx="3.2" ry="1.8"/g, 'rx="7" ry="4"')}`),
};

// ------------------------------------------------------------ клиенти
export interface CustomerLook { skin: string; hair: string; hairStyle: 'short' | 'long' | 'bun' | 'bald' | 'curly' | 'pony'; shirt: string; pants: string; extra?: 'tie' | 'glasses' | 'shades' | 'cap' | 'beret' | 'hat' | 'chain' | 'bow' | 'chef' | 'apron' | 'bowtie' }

export function customerSvg(l: CustomerLook, kid = false): SvgDef {
  const w = 100, h = 170;
  const headY = 46;
  let hair = '';
  let backHair = '';
  const fringe = `<path d="M26 44 Q24 14 50 13 Q76 14 74 44 Q66 30 50 30 Q34 30 26 44Z" fill="${l.hair}" ${SW}/>`;
  switch (l.hairStyle) {
    case 'short': hair = `<path d="M26 44 Q24 14 50 13 Q76 14 74 44 Q70 30 60 28 Q46 34 30 30 Q27 36 26 44Z" fill="${l.hair}" ${SW}/>`; break;
    case 'long': backHair = `<path d="M24 82 Q18 16 50 13 Q82 16 76 82 Z" fill="${l.hair}" ${SW}/>`; hair = fringe; break;
    case 'bun': hair = `<circle cx="50" cy="12" r="11" fill="${l.hair}" ${SW}/><path d="M26 44 Q24 16 50 16 Q76 16 74 44 Q64 26 50 28 Q36 26 26 44Z" fill="${l.hair}" ${SW}/>`; break;
    case 'bald': hair = `<path d="M25 46 Q22 40 26 34 M75 46 Q78 40 74 34" stroke="${l.hair}" stroke-width="6" stroke-linecap="round"/>`; break;
    case 'curly': hair = `${[[30, 26], [40, 18], [52, 15], [64, 19], [72, 28], [26, 38], [75, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${l.hair}" ${SW}/>`).join('')}`; break;
    case 'pony': backHair = `<path d="M70 28 Q94 40 86 74 Q78 54 68 44Z" fill="${l.hair}" ${SW}/>`; hair = fringe; break;
  }
  let extra = '';
  switch (l.extra) {
    case 'tie': extra = `<path d="M50 96 L45 104 L50 132 L55 104 Z" fill="#1e3a8a" ${SW}/>`; break;
    case 'glasses': extra = `<circle cx="40" cy="${headY}" r="8" fill="none" stroke="#4a2c17" stroke-width="2.5"/><circle cx="60" cy="${headY}" r="8" fill="none" stroke="#4a2c17" stroke-width="2.5"/><path d="M48 ${headY} H52" stroke="#4a2c17" stroke-width="2.5"/>`; break;
    case 'shades': extra = `<path d="M30 ${headY - 6} H70 V${headY + 2} Q70 ${headY + 8} 62 ${headY + 8} Q54 ${headY + 8} 52 ${headY} H48 Q46 ${headY + 8} 38 ${headY + 8} Q30 ${headY + 8} 30 ${headY + 2}Z" fill="#111" stroke="#4a2c17" stroke-width="2"/>`; break;
    case 'cap': extra = `<path d="M26 34 Q26 12 50 12 Q74 12 74 34 Z" fill="#e53935" ${SW}/><path d="M60 32 H88 Q88 38 74 38 H60Z" fill="#c62828" ${SW}/>`; break;
    case 'beret': extra = `<path d="M22 28 Q30 6 58 10 Q82 14 76 30 Q50 22 22 28Z" fill="#212121" ${SW}/><path d="M50 9 V3" ${SW}/>`; break;
    case 'hat': extra = `<ellipse cx="50" cy="28" rx="40" ry="8" fill="#f5deb3" ${SW}/><path d="M30 28 Q30 6 50 6 Q70 6 70 28Z" fill="#f5deb3" ${SW}/><path d="M31 22 H69" stroke="#e53935" stroke-width="5"/>`; break;
    case 'chain': extra = `<path d="M34 94 Q50 118 66 94" fill="none" stroke="#ffd21f" stroke-width="4"/><circle cx="50" cy="112" r="5" fill="#ffd21f" stroke="#4a2c17" stroke-width="1.5"/>`; break;
    case 'chef': extra = `<path d="M30 30 Q18 22 24 10 Q30 2 40 8 Q50 -2 60 8 Q70 2 76 10 Q82 22 70 30 Z" fill="#ffffff" ${SW}/><rect x="30" y="24" width="40" height="10" rx="3" fill="#ffffff" ${SW}/><path d="M36 100 H64 V150 H36Z" fill="#ffffff" ${SW}/>`; break;
    case 'apron': extra = `<path d="M34 104 H66 V150 H34Z" fill="#ffffff" ${SW}/><path d="M40 122 H60" stroke="#e53935" stroke-width="3"/>`; break;
    case 'bowtie': extra = `<path d="M50 96 L40 90 V102 Z M50 96 L60 90 V102Z" fill="#b71c1c" ${SW}/>`; break;
    case 'bow': extra = `<path d="M50 14 L36 6 V22 Z M50 14 L64 6 V22Z" fill="#ff4081" ${SW}/>`; break;
  }
  const body = `
    <path d="M36 140 V166 M64 140 V166" stroke="${l.pants}" stroke-width="12" stroke-linecap="round"/>
    <path d="M22 150 Q20 96 50 92 Q80 96 78 150 Z" fill="${l.shirt}" ${SW}/>
    <path d="M22 118 Q12 126 18 140 M78 118 Q88 126 82 140" stroke="${l.shirt}" stroke-width="11" stroke-linecap="round" fill="none"/>
    <rect x="42" y="74" width="16" height="20" fill="${l.skin}" ${SW}/>
    ${backHair}
    <ellipse cx="50" cy="${headY}" rx="25" ry="28" fill="${l.skin}" ${SW}/>
    <ellipse cx="25" cy="${headY + 2}" rx="5" ry="7" fill="${l.skin}" ${SW}/><ellipse cx="75" cy="${headY + 2}" rx="5" ry="7" fill="${l.skin}" ${SW}/>
    <ellipse cx="50" cy="${headY}" rx="23" ry="26" fill="${l.skin}"/>
    ${hair}
    <ellipse cx="36" cy="${headY + 10}" rx="5" ry="3" fill="#ff8a80" opacity="0.55"/><ellipse cx="64" cy="${headY + 10}" rx="5" ry="3" fill="#ff8a80" opacity="0.55"/>
    ${extra}`;
  void kid;
  return d(w, h, body);
}

// лица (слагат се върху главата на клиента)
const eye = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="4" fill="#2b1a0f"/><circle cx="${x + 1}" cy="${y - 1.5}" r="1.1" fill="#fff"/>`;
export const FACES: Record<string, SvgDef> = {
  face_happy: d(50, 34, `${eye(15, 10)}${eye(35, 10)}<path d="M14 21 Q25 32 36 21 Z" fill="#b71c1c" stroke="#2b1a0f" stroke-width="2.5" stroke-linejoin="round"/>`),
  face_neutral: d(50, 34, `${eye(15, 10)}${eye(35, 10)}<path d="M17 24 Q25 27 33 24" fill="none" stroke="#2b1a0f" stroke-width="2.8" stroke-linecap="round"/>`),
  face_worried: d(50, 34, `<path d="M9 3 L20 6 M41 3 L30 6" stroke="#2b1a0f" stroke-width="2.5" stroke-linecap="round"/>${eye(15, 11)}${eye(35, 11)}<path d="M17 27 Q25 22 33 27" fill="none" stroke="#2b1a0f" stroke-width="2.8" stroke-linecap="round"/>`),
  face_angry: d(50, 34, `<path d="M8 2 L21 8 M42 2 L29 8" stroke="#2b1a0f" stroke-width="3.2" stroke-linecap="round"/>${eye(15, 12)}${eye(35, 12)}<path d="M15 28 Q25 20 35 28" fill="#b71c1c" stroke="#2b1a0f" stroke-width="2.5"/>`),
  face_eat: d(50, 34, `<path d="M10 11 Q15 6 20 11 M30 11 Q35 6 40 11" fill="none" stroke="#2b1a0f" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="25" cy="24" rx="7" ry="6" fill="#b71c1c" stroke="#2b1a0f" stroke-width="2.5"/>`),
  face_love: d(50, 34, `<path d="M15 14 Q7 8 10 4 Q13 1 15 5 Q17 1 20 4 Q23 8 15 14Z M35 14 Q27 8 30 4 Q33 1 35 5 Q37 1 40 4 Q43 8 35 14Z" fill="#ff4d6d" stroke="#2b1a0f" stroke-width="1.5"/><path d="M14 21 Q25 32 36 21 Z" fill="#b71c1c" stroke="#2b1a0f" stroke-width="2.5" stroke-linejoin="round"/>`),
};

export function toSvgString(def: SvgDef, scale: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${def.w * scale}" height="${def.h * scale}" viewBox="0 0 ${def.w} ${def.h}">${def.body}</svg>`;
}
