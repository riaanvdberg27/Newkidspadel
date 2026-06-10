import Link from "next/link"
import { Logo } from "./logo"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Next Gen Padel Academy home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Button
            render={<Link href="/sign-in">Parent sign in</Link>}
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          />
          <Button render={<Link href="/enroll">Enroll now</Link>} size="sm" />
        </nav>
      </div>
    </header>
  )
}
