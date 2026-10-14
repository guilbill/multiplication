import type { CirclePart } from '../types'

// Cercle de centre O, diamètre [AB], rayon [OC], arc de C à B.
const CX = 160, CY = 150, R = 110
const polar = (deg: number) => ({
  x: CX + R * Math.cos((deg * Math.PI) / 180),
  y: CY - R * Math.sin((deg * Math.PI) / 180),
})
const A = polar(200), B = polar(20), C = polar(140)

export default function CircleFigure({
  highlight,
  labels = true,
}: { highlight?: CirclePart | null; labels?: boolean }) {
  const on = (p: CirclePart) => highlight === p
  const red = '#fa5252'
  const ink = '#495057'

  return (
    <svg className="circle-figure" viewBox="0 0 320 300" role="img" aria-label="Figure du cercle">
      <circle cx={CX} cy={CY} r={R} fill="#f8f9ff" stroke={ink} strokeWidth={2.5} />

      {/* Arc de C à B, par le haut */}
      <path
        d={`M ${C.x} ${C.y} A ${R} ${R} 0 0 1 ${B.x} ${B.y}`}
        fill="none"
        stroke={on('arc') ? red : 'transparent'}
        strokeWidth={7}
        strokeLinecap="round"
      />

      {/* Diamètre [AB] */}
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            stroke={on('diametre') ? red : ink} strokeWidth={on('diametre') ? 5 : 2} />
      {/* Rayon [OC] */}
      <line x1={CX} y1={CY} x2={C.x} y2={C.y}
            stroke={on('rayon') ? red : ink} strokeWidth={on('rayon') ? 5 : 2} />

      {/* Points */}
      <circle cx={CX} cy={CY} r={on('centre') ? 8 : 4} fill={on('centre') ? red : ink} />
      {[A, B, C].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill={ink} />)}

      {labels && (
        <g className="circle-labels" fill={ink}>
          <text x={CX + 12} y={CY - 10}>O</text>
          <text x={A.x - 22} y={A.y + 16}>A</text>
          <text x={B.x + 8} y={B.y + 4}>B</text>
          <text x={C.x - 22} y={C.y - 2}>C</text>
        </g>
      )}
    </svg>
  )
}
