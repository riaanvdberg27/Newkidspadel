import { cn } from "@/lib/utils"

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl font-heading text-lg font-extrabold",
          inverted ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground",
        )}
        aria-hidden="true"
      >
        NG
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading text-sm font-extrabold tracking-tight",
            inverted ? "text-primary-foreground" : "text-foreground",
          )}
        >
          Next Gen Padel
        </span>
        <span
          className={cn(
            "text-[11px] font-medium tracking-wide",
            inverted ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          Academy
        </span>
      </span>
    </div>
  )
}
