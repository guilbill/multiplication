import { useRef, useEffect, useCallback } from 'react'
import type { Stroke } from '../types'

interface Props {
  strokes: Stroke[]
  onChange: (strokes: Stroke[]) => void
  disabled?: boolean
  /** Modèle tracé en filigrane, à repasser (mode « tracer »). */
  ghost?: string
}

/** Position des lignes du cahier, en fraction de la hauteur. */
const ASCENDER = 0.18
const XHEIGHT  = 0.44
const BASELINE = 0.74
const DESCENDER = 0.93

/** Au-delà de cette largeur de contact, ce n'est plus un doigt : c'est la main. */
const PALM_SIZE = 35

export default function WriteCanvas({ strokes, onChange, disabled, ghost }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef(strokes)
  const currentRef = useRef<Stroke | null>(null)
  const startTimeRef = useRef(0)
  // Dès qu'un stylet a servi, on ignore tous les contacts de peau
  const penSeenRef = useRef(false)
  // Un seul pointeur trace à la fois : les autres contacts sont ignorés
  const activeIdRef = useRef<number | null>(null)

  useEffect(() => { strokesRef.current = strokes }, [strokes])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // ── Lignes du cahier ──
    const line = (y: number, color: string, dash: number[]) => {
      ctx.beginPath()
      ctx.setLineDash(dash)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.moveTo(8, y)
      ctx.lineTo(w - 8, y)
      ctx.stroke()
    }
    line(h * ASCENDER, '#dee2e6', [5, 5])
    line(h * XHEIGHT, '#dee2e6', [5, 5])
    line(h * BASELINE, '#adb5bd', [])
    line(h * DESCENDER, '#e9ecef', [5, 5])
    ctx.setLineDash([])

    // ── Modèle à repasser ──
    if (ghost) {
      ctx.fillStyle = '#e3e8ef'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      const font = (size: number) =>
        `${size}px 'Comic Sans MS', 'Segoe Print', 'Bradley Hand', 'Chalkboard SE', cursive`
      let size = Math.round(h * (BASELINE - ASCENDER))
      ctx.font = font(size)
      // Réduit le modèle jusqu'à ce qu'il tienne dans l'ardoise
      const maxWidth = w - 32
      const measured = ctx.measureText(ghost).width
      if (measured > maxWidth) {
        size = Math.floor(size * (maxWidth / measured))
        ctx.font = font(size)
      }
      ctx.fillText(ghost, w / 2, h * BASELINE)
    }

    // ── Tracés de l'enfant ──
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 3.5
    for (const s of strokesRef.current) {
      if (!s.x.length) continue
      ctx.beginPath()
      ctx.moveTo(s.x[0], s.y[0])
      for (let i = 1; i < s.x.length; i++) ctx.lineTo(s.x[i], s.y[i])
      if (s.x.length === 1) ctx.lineTo(s.x[0] + 0.1, s.y[0])  // un simple point
      ctx.stroke()
    }
  }, [ghost])

  // Taille réelle du canvas (écrans haute densité) + redessin
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      draw()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [draw])

  useEffect(() => { draw() }, [strokes, draw])

  function pointFrom(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  /** Tranche de la main, poignet, doigt posé pendant qu'on écrit au stylet. */
  function isPalm(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType !== 'touch') return false
    return penSeenRef.current || e.width > PALM_SIZE || e.height > PALM_SIZE
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    if (isPalm(e)) { e.preventDefault(); return }

    if (e.pointerType === 'pen') {
      // Premier contact du stylet : tout ce qui a été tracé jusque-là vient
      // de la peau (main posée avant d'écrire), on repart d'une ardoise nette.
      if (!penSeenRef.current) {
        penSeenRef.current = true
        if (strokesRef.current.length) {
          strokesRef.current = []
          onChange([])
        }
      }
      // Un trait commencé au doigt pendant que le stylet arrive est un parasite
      if (activeIdRef.current !== null) {
        currentRef.current = null
        activeIdRef.current = null
      }
      draw()
    } else if (activeIdRef.current !== null) {
      return                                   // déjà un tracé en cours
    }

    e.preventDefault()
    // Le pointeur peut déjà avoir disparu (stylet relevé très vite)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* sans capture */ }
    activeIdRef.current = e.pointerId
    if (!strokesRef.current.length) startTimeRef.current = performance.now()
    const { x, y } = pointFrom(e)
    currentRef.current = { x: [x], y: [y], t: [Math.round(performance.now() - startTimeRef.current)] }
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerId !== activeIdRef.current) return
    const cur = currentRef.current
    if (!cur || disabled) return
    e.preventDefault()
    const { x, y } = pointFrom(e)
    const n = cur.x.length - 1
    // Trace le segment tout de suite : pas de re-rendu React par point
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(cur.x[n], cur.y[n])
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    cur.x.push(x)
    cur.y.push(y)
    cur.t.push(Math.round(performance.now() - startTimeRef.current))
  }

  function handleUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerId !== activeIdRef.current) return
    activeIdRef.current = null
    const cur = currentRef.current
    currentRef.current = null
    if (!cur || disabled) return
    onChange([...strokesRef.current, cur])
  }

  function handleCancel(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerId !== activeIdRef.current) return
    activeIdRef.current = null
    currentRef.current = null
    draw()                                     // le trait avorté disparaît
  }

  return (
    <canvas
      ref={canvasRef}
      className={`write-canvas${disabled ? ' disabled' : ''}`}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
    />
  )
}
