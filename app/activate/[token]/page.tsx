import Link from "next/link"
import { Logo } from "@/components/logo"
import { getActivationInfo } from "@/app/actions/activation"
import { ActivationForm } from "@/components/activation-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const info = await getActivationInfo(token)

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-4 sm:px-6">
        <Link href="/" aria-label="Next Gen Padel Academy home">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        {info.ok ? (
          <ActivationForm
            token={token}
            email={info.email}
            parentName={info.parentName}
            childName={info.childName}
            alreadyUsed={info.alreadyUsed}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <h1 className="font-heading text-xl font-bold">Link unavailable</h1>
                <p className="mt-1 text-sm text-muted-foreground">{info.error}</p>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/sign-in">Go to sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
