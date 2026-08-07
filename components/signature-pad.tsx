"use client"

import { useRef, useEffect } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"

interface SignaturePadProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
}

export function SignaturePad({ value, onChange, onClear }: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas>(null)

  useEffect(() => {
    if (canvasRef.current && !value) {
      canvasRef.current.clear()
    }
  }, [value])

  const handleEnd = () => {
    if (canvasRef.current) {
      const signatureDataUrl = canvasRef.current.toDataURL()
      onChange(signatureDataUrl)
    }
  }

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear()
      onChange("")
      onClear?.()
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <SignatureCanvas
        ref={canvasRef}
        onEnd={handleEnd}
        canvasProps={{
          className: "border border-gray-300 rounded cursor-crosshair w-full",
          width: 500,
          height: 150,
          style: { width: "100%", height: "150px", touchAction: "none" }
        }}
      />
      <div className="flex gap-2 mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="flex-1"
        >
          Clear Signature
        </Button>
        {value && (
          <span className="text-xs text-green-600 py-2 px-3 bg-green-50 rounded flex items-center">
            ✓ Signature captured
          </span>
        )}
      </div>
    </div>
  )
}
