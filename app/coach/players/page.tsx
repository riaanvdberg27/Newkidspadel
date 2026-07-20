import { CoachShell } from "@/components/coach/coach-shell"
import { getCoachRoster } from "@/app/actions/coach"
import { CoachPlayers } from "@/components/coach/coach-players"

export const dynamic = "force-dynamic"

export default async function CoachPlayersPage() {
  const players = await getCoachRoster()

  return (
    <CoachShell>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">My Players</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {players.length} player{players.length === 1 ? "" : "s"} assigned to you. Evaluate progress and review history.
        </p>
      </div>
      <CoachPlayers players={players} />
    </CoachShell>
  )
}
