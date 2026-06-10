import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ACADEMY } from "@/lib/academy"
import { CheckCircle2, Mail, MessageCircle, ShieldCheck, Info } from "lucide-react"
import { CopyActivation } from "@/components/copy-activation"

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; activation?: string; sim?: string }>
}) {
  const { ref, activation, sim } = await searchParams

  return (
    <div className="flex min-h-dvh flex-col bg-sidebar">
      <header className="mx-auto flex h-16 w-full max-w-2xl items-center px-4 sm:px-6">
        <Link href="/" aria-label="Next Gen Padel Academy home">
          <Logo inverted />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-8 sm:px-6">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="text-balance text-center font-heading text-3xl font-extrabold tracking-tight text-sidebar-foreground sm:text-4xl">
          You&apos;re all set! Welcome aboard
        </h1>
        <p className="mt-3 max-w-md text-pretty text-center text-sidebar-foreground/70">
          Your enrollment has been received and our onboarding has kicked off automatically.
        </p>

        {ref && (
          <Badge className="mt-5 bg-accent text-accent-foreground hover:bg-accent">
            Reference: {ref}
          </Badge>
        )}

        <Card className="mt-8 w-full">
          <CardContent className="flex flex-col gap-5 p-6">
            <h2 className="font-heading text-lg font-bold">What just happened</h2>
            <Step icon={Mail} title="Welcome email sent" body="Check your inbox for confirmation and your portal activation link." />
            <Step icon={MessageCircle} title="WhatsApp confirmation" body="A confirmation message is on its way to your mobile number." />
            <Step icon={ShieldCheck} title="Parent portal ready" body="Activate your account to manage sessions, details and updates." />

            {sim && (
              <Alert>
                <Info />
                <AlertTitle>Email sending is in test mode</AlertTitle>
                <AlertDescription>
                  No live email provider is configured, so use the button below to activate your portal now.
                </AlertDescription>
              </Alert>
            )}

            {activation && <CopyActivation url={activation} />}

            {activation && (
              <Button
                render={<Link href={new URL(activation).pathname}>Activate your parent portal</Link>}
                size="lg"
                className="w-full"
              />
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-sidebar-foreground/60">
          Questions? Contact us at {ACADEMY.supportEmail} or {ACADEMY.supportPhone}
        </p>
      </main>
    </div>
  )
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="font-heading font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
