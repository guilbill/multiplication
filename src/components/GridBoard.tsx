import { ROWS, COLS, ROW_LABELS, cellLabel, sameCell } from '../data/gridGame'
import type { Cell, GridMark } from '../types'

interface Props {
  marks: GridMark[]
  /** Cases traversées, affichées une fois la réponse donnée. */
  path?: Cell[]
  picked?: Cell | null
  target?: Cell | null
  revealed?: boolean
  onPick?: (cell: Cell) => void
}

export default function GridBoard({ marks, path = [], picked, target, revealed, onPick }: Props) {
  const iconAt = (cell: Cell) => marks.find(m => sameCell(m.cell, cell))?.icon
  const stepAt = (cell: Cell) => path.findIndex(p => sameCell(p, cell))

  return (
    <div className="grid-board">
      {/* En-tête des colonnes */}
      <div className="grid-corner" />
      {Array.from({ length: COLS }, (_, c) => (
        <div key={`c${c}`} className="grid-head">{c + 1}</div>
      ))}

      {Array.from({ length: ROWS }, (_, r) => [
        <div key={`r${r}`} className="grid-head">{ROW_LABELS[r]}</div>,
        ...Array.from({ length: COLS }, (_, c) => {
          const cell = { r, c }
          const step = revealed ? stepAt(cell) : -1
          const isTarget = revealed && target && sameCell(cell, target)
          const isWrong = revealed && picked && target && !sameCell(picked, target) && sameCell(cell, picked)
          const cls = [
            'grid-cell',
            step > 0 && !isTarget ? 'on-path' : '',
            isTarget ? 'target' : '',
            isWrong ? 'wrong' : '',
            onPick && !revealed ? 'pickable' : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              key={`${r}-${c}`}
              className={cls}
              aria-label={cellLabel(cell)}
              disabled={!onPick || revealed}
              onClick={() => onPick?.(cell)}
            >
              {iconAt(cell) ?? (step > 0 && !isTarget ? <span className="step-dot" /> : '')}
            </button>
          )
        }),
      ])}
    </div>
  )
}
