"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy } from "lucide-react"

export function CopyActivation({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Your activation link</span>
      <div className="flex gap-2">
        <Input readOnly value={url} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy activation link">
          {copied ? <Check className="text-primary" /> : <Copy />}
        </Button>
      </div>
    </div>
  )
}
