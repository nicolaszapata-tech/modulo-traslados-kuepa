import { useState, useEffect, useMemo } from 'react'

const STATS_URL = 'https://n8n.kuepa.com/webhook/worldbox-productiva-stats'
const HIST_KEY  = 'kuepa_worldbox_history_v1'
const MIN_REF_MS = 60 * 60 * 1000 // 1 hour minimum to use as reference

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const h = Math.floor(diff / 3600_000)
  const m = Math.floor((diff % 3600_000) / 60_000)
  if (h >= 24) return `hace ${Math.floor(h / 24)}d`
  if (h > 0)   return `hace ${h}h ${m}min`
  return `hace ${m}min`
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]') } catch { return [] }
}

function appendHistory(counts) {
  const hist = loadHistory()
  const now  = Date.now()
  const last  = hist[hist.length - 1]
  if (!last || now - new Date(last.at).getTime() > 1800_000) {
    hist.push({ counts, at: new Date().toISOString() })
    if (hist.length > 96) hist.splice(0, hist.length - 96) // keep ~2 days at 30min intervals
    localStorage.setItem(HIST_KEY, JSON.stringify(hist))
  }
}

function computeDeltas(currentCounts) {
  const hist = loadHistory()
  const now  = Date.now()
  // Find oldest entry that is at least 1h ago (prefer ~24h, fallback to oldest)
  const candidates = hist.filter(h => now - new Date(h.at).getTime() >= MIN_REF_MS)
  if (!candidates.length) return null
  const ref = candidates[0] // oldest available reference
  const deltas = {}
  for (const k of Object.keys(currentCounts)) {
    deltas[k] = (currentCounts[k] ?? 0) - (ref.counts[k] ?? 0)
  }
  return { deltas, refAt: ref.at }
}

const CIVS = [
  {
    key: 'adaptacion', label: 'ADAPTACIÓN', sublabel: 'Meses 1–3',
    levels: ['Tierra Vacía','Aldea Inicial','Pueblo Naciente','Villa Activa','Pueblo Próspero','Ciudad Emergente','Gran Aldea','Ciudad Amurallada','Metrópolis Joven','Gran Metrópolis','Megalópolis','Megaciudad','Civilización Cumbre'],
    skyFrom: '#0b160a', skyTo: '#18300f',
    terrain: '#2d5c1e', terrainDark: '#1e3c14', path: '#8B7355',
    pal: { wall: '#c8a06a', wallDark: '#a07040', roof: '#8b2020', door: '#5c3010', win: '#87ceeb', wood: '#8B4513', stone: '#9a8a7a', accent: '#f59e0b' },
    citizenColors: ['#d97706', '#b45309', '#92400e', '#78350f'],
    accent: '#f59e0b',
  },
  {
    key: 'desempeno', label: 'DESEMPEÑO', sublabel: 'Meses 4–7',
    levels: ['Tierra Vacía','Asentamiento','Pueblo Creciente','Villa Activa','Ciudad Menor','Ciudad Media','Gran Ciudad','Ciudad Fortaleza','Ciudad Imperial','Metrópolis','Gran Metrópolis','Megalópolis','Imperio'],
    skyFrom: '#080f1e', skyTo: '#0e1e3a',
    terrain: '#1a3c2a', terrainDark: '#102818', path: '#5a6878',
    pal: { wall: '#8090a8', wallDark: '#5a6878', roof: '#1e3a5a', door: '#1a3050', win: '#9dd5ef', wood: '#5a6070', stone: '#6a7a8a', accent: '#38bdf8' },
    citizenColors: ['#0369a1', '#0284c7', '#075985', '#0c4a6e'],
    accent: '#38bdf8',
  },
  {
    key: 'proyeccion', label: 'PROYECCIÓN', sublabel: 'Meses 8–11',
    levels: ['Tierra Vacía','Colonia','Pueblo Arcano','Villa Mística','Ciudad Arcana','Ciudad Mágica','Metrópolis','Bastión Arcano','Sanctum Supremo','Nexo Místico','Convergencia','El Nexo','La Singularidad'],
    skyFrom: '#0c0818', skyTo: '#1a1038',
    terrain: '#1a1440', terrainDark: '#100c28', path: '#6a5a80',
    pal: { wall: '#8878a8', wallDark: '#5a4878', roof: '#3a2060', door: '#201040', win: '#d8a0ff', wood: '#6a5a80', stone: '#7a6a8a', accent: '#a78bfa' },
    citizenColors: ['#7c3aed', '#8b5cf6', '#6d28d9', '#5b21b6'],
    accent: '#a78bfa',
  },
  {
    key: 'finalizado', label: 'FINALIZADO', sublabel: 'Completado',
    levels: ['Tierra Vacía','Pueblo Dorado','Villa de Oro','Ciudad Rica','Gran Ciudad','Capital','Imperio','Imperio Amurallado','Gran Imperio','Metrópolis Imperial','Coloso Áureo','Maravilla','El Eterno Imperio'],
    skyFrom: '#180e00', skyTo: '#281800',
    terrain: '#3a2800', terrainDark: '#281a00', path: '#b8962a',
    pal: { wall: '#d4b06a', wallDark: '#b08040', roof: '#8a5010', door: '#5a3000', win: '#ffd700', wood: '#a07030', stone: '#c0a060', accent: '#fbbf24' },
    citizenColors: ['#d97706', '#f59e0b', '#b45309', '#92400e'],
    accent: '#fbbf24',
  },
]

function getLevel(n) {
  if (n >= 2000) return 12
  if (n >= 1500) return 11
  if (n >= 1000) return 10
  if (n >= 750)  return 9
  if (n >= 500)  return 8
  if (n >= 400)  return 7
  if (n >= 300)  return 6
  if (n >= 200)  return 5
  if (n >= 150)  return 4
  if (n >= 100)  return 3
  if (n >= 50)   return 2
  if (n >= 20)   return 1
  return 0
}

function getCitizenCount(n) {
  if (n === 0)   return 0
  if (n < 20)    return 1
  if (n < 50)    return 3
  if (n < 100)   return 6
  if (n < 150)   return 9
  if (n < 200)   return 13
  if (n < 300)   return 17
  if (n < 400)   return 20
  if (n < 500)   return 23
  if (n < 750)   return 25
  if (n < 1000)  return 27
  if (n < 1500)  return 29
  return 30
}

// ── SVG pixel-art building components ─────────────────────────────

function Tree({ x, y, dark }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-3" y="0" width="5" height="14" fill="#5c3a1a" />
      <ellipse cx="0" cy="-10" rx="12" ry="16" fill={dark ? '#1a4010' : '#2d6b1a'} />
      <ellipse cx="-3" cy="-15" rx="8" ry="10" fill={dark ? '#264f18' : '#3a8a20'} />
    </g>
  )
}

function SmallHouse({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-13" y="-22" width="26" height="22" fill={pal.wall} />
      <rect x="-13" y="-22" width="3"  height="22" fill={pal.wallDark} />
      <rect x="-5"  y="-11" width="9"  height="11" fill={pal.door} />
      <rect x="-11" y="-18" width="7"  height="5"  fill={pal.win} />
      <rect x="4"   y="-18" width="7"  height="5"  fill={pal.win} />
      <polygon points="-15,-22 0,-36 15,-22" fill={pal.roof} />
      <polygon points="-15,-22 -12,-21 0,-35 0,-36" fill="rgba(0,0,0,0.18)" />
    </g>
  )
}

function MediumBuilding({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-18" y="-34" width="36" height="34" fill={pal.wall} />
      <rect x="-18" y="-34" width="4"  height="34" fill={pal.wallDark} />
      <rect x="-7"  y="-17" width="14" height="17" fill={pal.door} />
      <rect x="-15" y="-29" width="8"  height="7"  fill={pal.win} />
      <rect x="7"   y="-29" width="8"  height="7"  fill={pal.win} />
      <rect x="-15" y="-17" width="5"  height="5"  fill={pal.win} />
      <rect x="10"  y="-17" width="5"  height="5"  fill={pal.win} />
      <polygon points="-20,-34 0,-48 20,-34" fill={pal.roof} />
    </g>
  )
}

function Mill({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points="-9,0 -7,-34 7,-34 9,0" fill={pal.wall} />
      <polygon points="-9,-34 0,-46 9,-34" fill={pal.roof} />
      <rect x="-4" y="-10" width="8" height="10" fill={pal.door} />
      <rect x="-6" y="-22" width="4" height="4"  fill={pal.win} />
      <g>
        <line x1="0" y1="-34" x2="0"   y2="-56" stroke={pal.wood} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="-34" x2="22"  y2="-34" stroke={pal.wood} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="-34" x2="0"   y2="-12" stroke={pal.wood} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="-34" x2="-22" y2="-34" stroke={pal.wood} strokeWidth="2.5" strokeLinecap="round" />
        <animateTransform attributeName="transform" type="rotate"
          from="0 0 -34" to="360 0 -34" dur="5s" repeatCount="indefinite" />
      </g>
    </g>
  )
}

function Market({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-20" y="-26" width="40" height="26" fill={pal.wall} />
      <rect x="-22" y="-33" width="44" height="8"  fill={pal.accent} />
      <rect x="-7"  y="-13" width="13" height="13" fill={pal.door} />
      <rect x="-18" y="-22" width="8"  height="6"  fill={pal.win} />
      <rect x="10"  y="-22" width="8"  height="6"  fill={pal.win} />
      <rect x="-24" y="-5"  width="48" height="5"  fill={pal.wood} />
    </g>
  )
}

function Tower({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-10" y="-50" width="20" height="50" fill={pal.stone} />
      <rect x="-12" y="-58" width="7"  height="10" fill={pal.stone} />
      <rect x="-2"  y="-58" width="7"  height="10" fill={pal.stone} />
      <rect x="5"   y="-58" width="7"  height="10" fill={pal.stone} />
      <rect x="-7"  y="-42" width="6"  height="8"  fill="#080810" />
      <rect x="1"   y="-42" width="6"  height="8"  fill="#080810" />
      <rect x="-5"  y="-28" width="10" height="12" fill="#080810" />
      <rect x="-4"  y="-8"  width="8"  height="8"  fill={pal.door} />
      <line x1="0" y1="-58" x2="0" y2="-76" stroke={pal.wood} strokeWidth="1.5" />
      <polygon points="0,-76 14,-70 0,-64" fill={pal.accent}>
        <animateTransform attributeName="transform" type="rotate"
          values="-8 0 -76;8 0 -76;-8 0 -76" dur="2.5s" repeatCount="indefinite" />
      </polygon>
    </g>
  )
}

function Monument({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-24" y="-5"  width="48" height="5"  fill={pal.stone} />
      <rect x="-16" y="-10" width="32" height="5"  fill={pal.stone} />
      <rect x="-9"  y="-56" width="18" height="46" fill={pal.wall} />
      <polygon points="-9,-56 0,-76 9,-56" fill={pal.accent} />
      <circle cx="0" cy="-76" r="4" fill={pal.accent}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

// ── High-level buildings (levels 7–12) ───────────────────────────

function BackgroundSilhouettes({ pal, level }) {
  const op = level >= 9 ? 0.65 : 0.38
  const wd = pal.wallDark || pal.wall
  return (
    <g opacity={op}>
      <rect x="46"  y="90" width="20" height="58" fill={wd} />
      <polygon points="46,90 56,72 66,90" fill={pal.roof} />
      <rect x="80"  y="78" width="16" height="70" fill={wd} />
      <polygon points="80,78 88,56 96,78" fill={pal.roof} />
      <rect x="103" y="95" width="24" height="53" fill={wd} />
      <rect x="222" y="86" width="22" height="62" fill={wd} />
      <rect x="260" y="73" width="18" height="75" fill={wd} />
      <polygon points="260,73 269,50 278,73" fill={pal.roof} />
      <rect x="296" y="90" width="20" height="58" fill={wd} />
      {level >= 9 && <>
        <rect x="143" y="62" width="24" height="86" fill={wd} />
        <polygon points="143,62 155,38 167,62" fill={pal.roof} />
        <rect x="198" y="76" width="14" height="72" fill={wd} />
      </>}
    </g>
  )
}

function WallTowers({ pal, gy }) {
  return (
    <>
      <rect x="0"   y={gy-42} width="16" height="42" fill={pal.stone} />
      {[0,8].map(bx => <rect key={bx} x={bx}   y={gy-50} width="6" height="10" fill={pal.stone} />)}
      <rect x="3"   y={gy-32} width="7"  height="12" fill="#050510" />
      <rect x="364" y={gy-42} width="16" height="42" fill={pal.stone} />
      {[362,370].map(bx => <rect key={bx} x={bx} y={gy-50} width="6" height="10" fill={pal.stone} />)}
      <rect x="369" y={gy-32} width="7"  height="12" fill="#050510" />
    </>
  )
}

function GrandCathedral({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-18" y="-54" width="36" height="54" fill={pal.wall} />
      <rect x="-24" y="-76" width="14" height="76" fill={pal.stone} />
      <rect x="10"  y="-76" width="14" height="76" fill={pal.stone} />
      <polygon points="-24,-76 -17,-96 -10,-76" fill={pal.roof} />
      <polygon points="10,-76 17,-96 24,-76"   fill={pal.roof} />
      <circle cx="0" cy="-36" r="9" fill={pal.win} />
      <circle cx="0" cy="-36" r="7" fill="none" stroke={pal.accent} strokeWidth="1.5" />
      <line x1="0" y1="-45" x2="0" y2="-27" stroke={pal.accent} strokeWidth="1" />
      <line x1="-9" y1="-36" x2="9" y2="-36" stroke={pal.accent} strokeWidth="1" />
      <rect x="-6"  y="-20" width="12" height="20" fill={pal.door} />
      <ellipse cx="0" cy="-20" rx="6" ry="4" fill={pal.door} />
      <circle cx="0" cy="-36" r="9" fill="none" stroke={pal.accent} strokeWidth="0.5">
        <animate attributeName="opacity" values="0.15;0.75;0.15" dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

function GrandPyramid({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-28" y="-8"  width="56" height="8"  fill={pal.stone} />
      <rect x="-22" y="-14" width="44" height="6"  fill={pal.stone} />
      <rect x="-15" y="-18" width="30" height="4"  fill={pal.stone} />
      <polygon points="-13,-18 0,-82 13,-18" fill={pal.wall} />
      <polygon points="-13,-18 0,-82 0,-18"  fill="rgba(0,0,0,0.22)" />
      <line x1="-8" y1="-36" x2="8"  y2="-36" stroke={pal.accent} strokeWidth="1" opacity="0.5" />
      <line x1="-5" y1="-56" x2="5"  y2="-56" stroke={pal.accent} strokeWidth="1" opacity="0.5" />
      <polygon points="-3,-77 0,-86 3,-77" fill={pal.accent} />
      <circle cx="0" cy="-82" r="5" fill={pal.accent} opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r"       values="4;7;4"       dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

function Colosseum({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="-18" rx="22" ry="18" fill={pal.stone} />
      <ellipse cx="0" cy="-18" rx="16" ry="13" fill={pal.wallDark || pal.stone} />
      <ellipse cx="0" cy="-18" rx="10" ry="8"  fill="#080810" />
      {[-16,-8,0,8,16].map((ax,i) => (
        <rect key={i} x={ax-3} y="-28" width="5" height="12" fill="#080810" opacity="0.65" />
      ))}
      <ellipse cx="0" cy="-32" rx="22" ry="4" fill={pal.stone} opacity="0.85" />
      <line x1="-16" y1="-32" x2="-16" y2="-42" stroke={pal.wood} strokeWidth="1" />
      <polygon points="-16,-42 -9,-39 -16,-36" fill={pal.accent}>
        <animateTransform attributeName="transform" type="rotate"
          values="-5 -16 -42;5 -16 -42;-5 -16 -42" dur="2.1s" repeatCount="indefinite" />
      </polygon>
      <line x1="16" y1="-32" x2="16" y2="-42" stroke={pal.wood} strokeWidth="1" />
      <polygon points="16,-42 23,-39 16,-36" fill={pal.accent}>
        <animateTransform attributeName="transform" type="rotate"
          values="5 16 -42;-5 16 -42;5 16 -42" dur="1.8s" repeatCount="indefinite" />
      </polygon>
    </g>
  )
}

// ── Finalizado-exclusive buildings ────────────────────────────────

function Fountain({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="-4" rx="16" ry="5"  fill={pal.stone} />
      <ellipse cx="0" cy="-4" rx="14" ry="4"  fill="#0a2a4a" />
      <rect x="-3" y="-18" width="6" height="14" fill={pal.stone} />
      <ellipse cx="0" cy="-18" rx="10" ry="3"  fill={pal.stone} />
      <ellipse cx="0" cy="-18" rx="8"  ry="2.5" fill="#0a3a5a" />
      <line x1="0" y1="-20" x2="-8" y2="-30" stroke="#87ceeb" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.4s" repeatCount="indefinite" />
      </line>
      <line x1="0" y1="-20" x2="8"  y2="-30" stroke="#87ceeb" strokeWidth="1.5">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.4s" repeatCount="indefinite" />
      </line>
      <line x1="0" y1="-20" x2="0"  y2="-34" stroke="#87ceeb" strokeWidth="2">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
      </line>
    </g>
  )
}

function Temple({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-22" y="-6"  width="44" height="6" fill={pal.stone} />
      <rect x="-19" y="-10" width="38" height="4" fill={pal.stone} />
      <rect x="-17" y="-36" width="34" height="26" fill={pal.wall} />
      {[-12,-4,4,12].map(cx => (
        <rect key={cx} x={cx-2} y="-36" width="4" height="26" fill={pal.stone} />
      ))}
      <polygon points="-19,-36 0,-52 19,-36" fill={pal.roof} />
      <polygon points="-19,-36 -17,-35 0,-51 0,-52" fill="rgba(0,0,0,0.15)" />
      <rect x="-5" y="-18" width="10" height="18" fill={pal.door} />
      <circle cx="0" cy="-44" r="4" fill={pal.accent} opacity="0.7">
        <animate attributeName="opacity" values="0.35;0.9;0.35" dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

function Fortress({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-22" y="-42" width="44" height="42" fill={pal.stone} />
      <rect x="-22" y="-42" width="5"  height="42" fill={pal.wallDark || '#b08040'} opacity="0.35" />
      {[-20,-12,-4,4,12].map(bx => (
        <rect key={bx} x={bx} y="-48" width="6" height="8" fill={pal.stone} />
      ))}
      <rect x="-16" y="-34" width="8"  height="10" fill="#080810" />
      <rect x="8"   y="-34" width="8"  height="10" fill="#080810" />
      <rect x="-5"  y="-22" width="10" height="14" fill="#080810" />
      <rect x="-9"  y="-14" width="18" height="14" fill={pal.door} />
      <ellipse cx="0" cy="-14" rx="9" ry="5" fill={pal.wallDark || '#b08040'} />
      <line x1="-16" y1="-48" x2="-16" y2="-62" stroke={pal.wood} strokeWidth="1.5" />
      <polygon points="-16,-62 -4,-58 -16,-54" fill={pal.accent}>
        <animateTransform attributeName="transform" type="rotate"
          values="-6 -16 -62;6 -16 -62;-6 -16 -62" dur="2.2s" repeatCount="indefinite" />
      </polygon>
      <line x1="16"  y1="-48" x2="16"  y2="-62" stroke={pal.wood} strokeWidth="1.5" />
      <polygon points="16,-62 28,-58 16,-54" fill={pal.accent}>
        <animateTransform attributeName="transform" type="rotate"
          values="6 16 -62;-6 16 -62;6 16 -62" dur="1.9s" repeatCount="indefinite" />
      </polygon>
    </g>
  )
}

function TriumphArch({ x, y, pal }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-28" y="-54" width="14" height="54" fill={pal.stone} />
      <rect x="14"  y="-54" width="14" height="54" fill={pal.stone} />
      <rect x="-28" y="-60" width="56" height="10" fill={pal.wall} />
      <rect x="-14" y="-52" width="28" height="38" fill="rgba(0,0,0,0.45)" />
      <ellipse cx="0" cy="-52" rx="14" ry="7" fill="rgba(0,0,0,0.4)" />
      <rect x="-22" y="-64" width="44" height="4" fill={pal.accent} opacity="0.55" />
      {[-20,20].map(ix => (
        <rect key={ix} x={ix-2} y="-54" width="4" height="54" fill={pal.wallDark || '#b08040'} opacity="0.3" />
      ))}
      <circle cx="0" cy="-57" r="18" fill="none" stroke={pal.accent} strokeWidth="1">
        <animate attributeName="opacity" values="0.1;0.45;0.1" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

// ── Territory SVG scene ───────────────────────────────────────────

function FinalizadoScene({ level }) {
  const civ = CIVS[3]
  const p   = civ.pal
  const gy  = 148
  return (
    <svg viewBox="0 0 380 180" width="100%" height="180" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sky-finalizado" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={civ.skyFrom} />
          <stop offset="100%" stopColor={civ.skyTo} />
        </linearGradient>
        <radialGradient id="glow-fin" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="380" height={gy} fill="url(#sky-finalizado)" />
      {level >= 2 && <rect x="0" y="0" width="380" height={gy} fill="url(#glow-fin)" />}
      {[25,70,120,185,250,310,355,55,160,285,335].map((sx, i) => (
        <circle key={i} cx={sx} cy={8+(i*9)%28} r={i%4===0?1.5:1} fill="#ffd700" opacity="0.28">
          <animate attributeName="opacity" values="0.1;0.6;0.1" dur={`${1.4+i%3}s`} begin={`${i*0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <rect x="0" y={gy}   width="380" height={180-gy} fill={civ.terrainDark} />
      <rect x="0" y={gy}   width="380" height="8"      fill={civ.terrain} />
      <rect x="0" y={gy+5} width="380" height="3"      fill={civ.terrainDark} opacity="0.5" />
      {level >= 1 && <rect x="40" y={gy-1} width="300" height="5" fill={civ.path} opacity="0.95" rx="1" />}
      {level >= 8 && <BackgroundSilhouettes pal={p} level={level} />}
      {level < 7 && <Tree x={16}  y={gy-3} />}
      {level < 7 && <Tree x={364} y={gy-2} />}
      {level < 4 && <Tree x={200} y={gy-5} />}
      {level >= 1 && <>
        <SmallHouse x={88}  y={gy} pal={p} />
        <SmallHouse x={168} y={gy} pal={p} />
        <SmallHouse x={252} y={gy} pal={p} />
      </>}
      {level >= 2  && level < 11 && <Fountain   x={322} y={gy-4} pal={p} />}
      {level >= 11 &&               <Colosseum  x={322} y={gy}   pal={p} />}
      {level >= 3  && level < 9  && <Temple        x={140} y={gy} pal={p} />}
      {level >= 9  &&               <GrandCathedral x={140} y={gy} pal={p} />}
      {level >= 4  && <Market   x={216} y={gy}   pal={p} />}
      {level >= 5  && <Fortress x={50}  y={gy}   pal={p} />}
      {level >= 6  && level < 10 && <TriumphArch x={185} y={gy} pal={p} />}
      {level >= 10 &&               <GrandPyramid x={185} y={gy} pal={p} />}
      {level >= 7  && <WallTowers pal={p} gy={gy} />}
    </svg>
  )
}

function TerritoryScene({ civ, level }) {
  if (civ.key === 'finalizado') return <FinalizadoScene level={level} />
  const p = civ.pal
  const gy = 148
  const dark = civ.key === 'proyeccion'

  return (
    <svg viewBox="0 0 380 180" width="100%" height="180" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sky-${civ.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={civ.skyFrom} />
          <stop offset="100%" stopColor={civ.skyTo} />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="380" height={gy} fill={`url(#sky-${civ.key})`} />

      {/* Stars */}
      {[25,70,120,185,250,310,355,55,160,285,335].map((sx, i) => (
        <circle key={i} cx={sx} cy={8 + (i * 9) % 28} r="1" fill="white" opacity="0.25">
          <animate attributeName="opacity" values={`0.1;0.5;0.1`} dur={`${2 + i % 3}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Ground */}
      <rect x="0" y={gy}   width="380" height={180 - gy} fill={civ.terrainDark} />
      <rect x="0" y={gy}   width="380" height="8"        fill={civ.terrain} />
      <rect x="0" y={gy+5} width="380" height="3"        fill={civ.terrainDark} opacity="0.5" />

      {/* Grass tufts */}
      {[18, 42, 96, 148, 225, 292, 342, 368].map((gx, i) => (
        <rect key={i} x={gx} y={gy - 3} width="10" height="4" fill={civ.terrain} rx="2" />
      ))}

      {/* Path (level 3+) */}
      {level >= 3 && (
        <rect x="52" y={gy - 1} width="276" height="5" fill={civ.path} opacity="0.9" rx="1" />
      )}

      {/* Background city silhouettes (level 8+) — rendered before foreground */}
      {level >= 8 && <BackgroundSilhouettes pal={p} level={level} />}

      {/* Trees — disappear as city densifies */}
      {level < 7 && <Tree x={16}  y={gy - 3} dark={dark} />}
      {level < 7 && <Tree x={364} y={gy - 2} dark={dark} />}
      {level < 4 && <Tree x={32}  y={gy - 1} dark={dark} />}
      {level < 3 && <>
        <Tree x={180} y={gy - 5} dark={dark} />
        <Tree x={346} y={gy - 3} dark={dark} />
      </>}
      {level < 2 && <>
        <Tree x={100} y={gy - 3} dark={dark} />
        <Tree x={262} y={gy - 4} dark={dark} />
      </>}

      {/* Level 1+: 3 small houses */}
      {level >= 1 && <>
        <SmallHouse x={88}  y={gy} pal={p} />
        <SmallHouse x={168} y={gy} pal={p} />
        <SmallHouse x={252} y={gy} pal={p} />
      </>}

      {/* Level 2–10: Mill / Level 11+: Colosseum */}
      {level >= 2  && level < 11 && <Mill      x={322} y={gy} pal={p} />}
      {level >= 11 && <Colosseum x={322} y={gy} pal={p} />}

      {/* Level 3–8: Medium building / Level 9+: Grand Cathedral */}
      {level >= 3 && level < 9 && <MediumBuilding  x={138} y={gy} pal={p} />}
      {level >= 9 &&              <GrandCathedral   x={138} y={gy} pal={p} />}

      {/* Level 4+: Market */}
      {level >= 4 && <Market x={216} y={gy} pal={p} />}

      {/* Level 5+: Tower */}
      {level >= 5 && <Tower x={60} y={gy} pal={p} />}

      {/* Level 6–9: Monument / Level 10+: Grand Pyramid */}
      {level >= 6 && level < 10 && <Monument     x={188} y={gy} pal={p} />}
      {level >= 10 &&              <GrandPyramid  x={188} y={gy} pal={p} />}

      {/* Level 7+: Wall towers at edges (rendered last = on top) */}
      {level >= 7 && <WallTowers pal={p} gy={gy} />}
    </svg>
  )
}

// ── Animated citizens ─────────────────────────────────────────────

function CitizenLayer({ civ, count }) {
  const citizenCount = getCitizenCount(count)
  const isFin = civ.key === 'finalizado'
  const citizens = useMemo(() => Array.from({ length: citizenCount }, (_, i) => {
    const seed = i * 41 + civ.key.charCodeAt(0) * 17
    return {
      id: i,
      y:        10 + (seed % 22),
      duration: isFin ? 14 + (seed % 8) : 7 + (seed % 7),
      delay:    -((seed * 13) % 13),
      color:    civ.citizenColors[i % civ.citizenColors.length],
      rtl:      i % 3 === 1,
    }
  }), [civ.key, citizenCount, isFin])

  if (!citizenCount) return null
  return (
    <>
      {citizens.map(c => (
        <div key={c.id} style={{
          position: 'absolute', bottom: c.y, left: 0,
          width: 8, height: isFin ? 22 : 18, zIndex: 5,
          animation: `${c.rtl ? 'wb-rtl' : 'wb-ltr'} ${c.duration}s linear ${c.delay}s infinite`,
        }}>
          {isFin && <div style={{ width: 10, height: 3, background: '#fbbf24', marginLeft: -1, borderRadius: 1, marginBottom: 1 }} />}
          <div style={{ width: 8, height: 5, background: '#f0c090', borderRadius: '4px 4px 0 0' }} />
          <div style={{ width: 8, height: 9, background: c.color, marginTop: 1 }} />
          <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
            <div style={{ width: 3, height: 3, background: '#223' }} />
            <div style={{ width: 3, height: 3, background: '#223' }} />
          </div>
        </div>
      ))}
    </>
  )
}

// ── Territory panel ───────────────────────────────────────────────

function TerritoryPanel({ civ, count, delta, onHover }) {
  const level = getLevel(count)
  const hasDelta = delta != null && delta !== 0
  return (
    <div
      style={{ border: `1px solid ${civ.accent}30`, background: civ.skyFrom, position: 'relative' }}
      onMouseEnter={() => onHover(civ)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${civ.accent}22`, background: `${civ.accent}10` }}
           className="flex items-center justify-between px-4 py-2.5">
        <div>
          <div className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: civ.accent }}>
            {civ.label}
            {hasDelta && (
              <span style={{ color: delta > 0 ? '#4ade80' : '#f87171', fontSize: 9 }}>
                {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
              </span>
            )}
          </div>
          <div className="text-[9px] font-mono opacity-40 mt-0.5" style={{ color: civ.accent }}>
            {civ.sublabel}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display font-black text-2xl" style={{ color: civ.accent }}>{count}</div>
          <div className="text-[8px] font-mono text-white/25">estudiantes</div>
        </div>
      </div>

      {/* Scene */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 180 }}>
        <TerritoryScene civ={civ} level={level} />
        <CitizenLayer civ={civ} count={count} />

        {/* Bottom overlay: level name + dots */}
        <div style={{ position: 'absolute', bottom: 7, left: 8, right: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,0,0,0.7)', padding: '2px 8px', border: `1px solid ${civ.accent}30`, borderRadius: 2 }}>
            <span style={{ color: civ.accent, fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Nivel {level} — {civ.levels[level]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(0,0,0,0.6)', padding: '3px 6px', borderRadius: 2 }}>
            {Array.from({length:12},(_,i)=>i+1).map(l => (
              <div key={l} style={{
                width: 4, height: 4, borderRadius: '50%',
                background: l <= level ? civ.accent : 'rgba(255,255,255,0.1)',
                boxShadow: l <= level ? `0 0 4px ${civ.accent}90` : 'none',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

export default function WorldboxProductivaView({ onBack }) {
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [hov,      setHov]      = useState(null)
  const [growth,   setGrowth]   = useState(null) // { deltas: {...}, refAt: isoStr }

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(STATS_URL)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      const g = computeDeltas(data.counts)
      setGrowth(g)
      appendHistory(data.counts)
      setStats(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const counts = stats?.counts ?? { adaptacion: 0, desempeno: 0, proyeccion: 0, finalizado: 0 }
  const total  = stats?.total_activos ?? 0

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* CSS animations */}
      <style>{`
        @keyframes wb-ltr {
          0%   { transform: translateX(-30px) scaleX(1); }
          47%  { transform: translateX(440px) scaleX(1); }
          50%  { transform: translateX(440px) scaleX(-1); }
          97%  { transform: translateX(-30px) scaleX(-1); }
          100% { transform: translateX(-30px) scaleX(1); }
        }
        @keyframes wb-rtl {
          0%   { transform: translateX(440px) scaleX(-1); }
          47%  { transform: translateX(-30px) scaleX(-1); }
          50%  { transform: translateX(-30px) scaleX(1); }
          97%  { transform: translateX(440px) scaleX(1); }
          100% { transform: translateX(440px) scaleX(-1); }
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-amber-400 transition-colors">
            ‹ VOLVER
          </button>
          <span className="text-amber-500/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted cursor-pointer hover:text-amber-400 transition-colors" onClick={onBack}>TÉCNICOS EDTH</span>
          <span className="text-amber-500/20 font-mono">›</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400">WORLDBOX PRODUCTIVA</span>
        </div>
        <button
          onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-amber-500/30 text-amber-400/70 hover:border-amber-500 hover:text-amber-400 transition-colors disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>⟳</span>
          {loading ? 'Cargando...' : 'Actualizar datos'}
        </button>
      </div>

      {/* Title + total */}
      <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-px bg-amber-500/50" />
            <span className="text-amber-500/60 text-[10px] font-mono tracking-[0.4em] uppercase">SIMULACIÓN DE POBLACIÓN EN TIEMPO REAL</span>
          </div>
          <h1 className="font-display font-black text-4xl text-text-primary uppercase tracking-wider leading-none">
            WORLD<span className="text-amber-400">BOX</span>
            <span className="text-text-muted text-2xl ml-3">PRODUCTIVA</span>
          </h1>
          <p className="text-text-secondary text-xs font-mono mt-1.5">
            Gestiona, observa y potencia cada etapa del crecimiento estudiantil
          </p>
        </div>
        {stats && (
          <div className="text-right border border-amber-500/20 bg-amber-950/20 px-5 py-3">
            <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest">Total estudiantes activos</div>
            <div className="flex items-end justify-end gap-2">
              <div className="font-display font-black text-4xl text-amber-400">{total}</div>
              {growth && (() => {
                const totalDelta = Object.values(growth.deltas).reduce((s, v) => s + v, 0)
                if (totalDelta === 0) return null
                return (
                  <span style={{ color: totalDelta > 0 ? '#4ade80' : '#f87171' }} className="font-mono text-sm font-bold pb-1">
                    {totalDelta > 0 ? '▲' : '▼'}{Math.abs(totalDelta)}
                  </span>
                )
              })()}
            </div>
            <div className="text-[9px] font-mono text-text-muted mt-0.5">
              {stats.calculado}
              {growth && <span className="ml-2 text-white/25">· ref {timeAgo(growth.refAt)}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-500/30 bg-red-950/20 px-4 py-3 mb-4 text-[11px] font-mono text-red-400">
          ✗ Error al cargar: {error} — <button onClick={load} className="underline hover:text-red-300">Reintentar</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !stats && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CIVS.map(civ => (
            <div key={civ.key} style={{ border: `1px solid ${civ.accent}20`, background: civ.skyFrom, height: 232 }}
                 className="flex flex-col items-center justify-center gap-2">
              <div className="text-[10px] font-mono animate-pulse" style={{ color: civ.accent }}>
                {civ.label}
              </div>
              <div className="text-[9px] font-mono text-white/20">Consultando datos...</div>
            </div>
          ))}
        </div>
      )}

      {/* 2×2 WorldBox grid */}
      {(!loading || stats) && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {CIVS.map(civ => (
            <TerritoryPanel
              key={civ.key}
              civ={civ}
              count={counts[civ.key] ?? 0}
              delta={growth?.deltas?.[civ.key] ?? null}
              onHover={setHov}
            />
          ))}
        </div>
      )}

      {/* Info panel (hover details) */}
      <div
        style={{ minHeight: 58, border: '1px solid rgba(255,255,255,0.05)', borderTop: `2px solid ${hov ? hov.accent + '50' : 'transparent'}`, background: 'rgba(0,0,0,0.25)', transition: 'border-color 0.2s' }}
        className="px-5 py-3 mb-3"
      >
        {hov ? (
          <div className="flex items-center gap-8 flex-wrap">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: hov.accent }}>{hov.label}</div>
              <div className="font-display font-bold text-xl" style={{ color: hov.accent }}>
                {counts[hov.key] ?? 0} estudiantes activos
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-[10px] font-mono">
              <div className="text-white/40 mb-0.5">Período</div>
              <div className="text-white/75">{hov.sublabel}</div>
            </div>
            <div className="text-[10px] font-mono">
              <div className="text-white/40 mb-0.5">Nivel civilización</div>
              <div className="text-white/75">{hov.levels[getLevel(counts[hov.key] ?? 0)]}</div>
            </div>
            <div className="text-[10px] font-mono">
              <div className="text-white/40 mb-0.5">Ciudadanos visibles</div>
              <div className="text-white/75">{getCitizenCount(counts[hov.key] ?? 0)} {hov.key === 'finalizado' ? 'graduados' : 'caminando'}</div>
            </div>
            {hov.key === 'finalizado' && (
              <div className="text-[10px] font-mono border-l border-amber-500/30 pl-4">
                <div className="text-amber-500/60 mb-0.5">Criterio</div>
                <div className="text-amber-400/80">fecha_fin &lt; hoy · incluye graduados</div>
              </div>
            )}
            <div className="text-[10px] font-mono">
              <div className="text-white/40 mb-0.5">Nivel</div>
              <div style={{ color: hov.accent }} className="font-bold">{getLevel(counts[hov.key] ?? 0)} / 6</div>
            </div>
            {growth && (() => {
              const d = growth.deltas[hov.key] ?? 0
              const pct = counts[hov.key] > 0 ? Math.round(Math.abs(d) / counts[hov.key] * 100) : 0
              return (
                <div className="text-[10px] font-mono border-l border-white/10 pl-6">
                  <div className="text-white/40 mb-0.5">Variación vs {timeAgo(growth.refAt)}</div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: d > 0 ? '#4ade80' : d < 0 ? '#f87171' : '#a0a0b0', fontSize: 14, lineHeight: 1 }}>
                      {d > 0 ? '▲' : d < 0 ? '▼' : '—'}
                    </span>
                    <span style={{ color: d > 0 ? '#4ade80' : d < 0 ? '#f87171' : '#a0a0b0' }} className="font-bold">
                      {d === 0 ? 'Sin cambio' : `${d > 0 ? '+' : ''}${d} (${pct}%)`}
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="text-[10px] font-mono text-text-muted flex items-center gap-2">
            <span className="opacity-50">🌍</span>
            Pasa el cursor sobre cada territorio para ver sus detalles · Los ciudadanos representan la actividad estudiantil en tiempo real
          </div>
        )}
      </div>

      {/* Bottom legend */}
      <div className="flex items-center gap-1 flex-wrap border border-white/5 bg-black/20 px-4 py-2.5">
        <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted mr-3">Evolución por umbral</span>
        {[
          [20,'3 casas'],[50,'molino★'],[100,'edificio★'],[150,'mercado'],
          [200,'torre★'],[300,'monumento★'],[400,'murallas'],[500,'catedral'],
          [750,'bg densa'],[1000,'pirámide'],[1500,'coliseo★'],[2000,'maravilla'],
        ].map(([n, lbl]) => (
          <div key={n} className="flex items-center gap-1 border border-white/10 px-2 py-1 rounded-sm">
            <span className="text-[9px] font-mono text-amber-400/70">{n}+</span>
            <span className="text-[9px] font-mono text-text-muted">{lbl}</span>
          </div>
        ))}
        <span className="text-[9px] font-mono text-amber-500/50 ml-1">★ variante Finalizado</span>
      </div>
    </div>
  )
}
