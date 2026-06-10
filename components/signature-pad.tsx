"use client"

import { useEffect, useRef, useState } from "react"

export function SignaturePad({
  value,
  onChange,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(false)

  // Prepare the canvas backing store for crisp lines.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = "#0d1c3d"
    }
  }, [])

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    drawing.current = true
    last.current = pos(e)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !last.current) return
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    setHasInk(true)
  }

  function end() {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    const canvas = canvasRef.current
    if (canvas && hasInk) {
      onChange(canvas.toDataURL("image/png"))
    }
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setHasInk(false)
    onChange(null)
  }

  return (
    <div>
      <div className={`relative rounded-md border-2 ${value ? "border-lime" : "border-dashed border-border"} bg-card`}>
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-40 w-full touch-none rounded-md"
          aria-label="Signature pad"
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Sign here
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{value ? "Signature captured" : "Draw your signature above"}</span>
        <button
          type="button"
          onClick={clear}
          className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-navy transition-colors hover:bg-muted"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
