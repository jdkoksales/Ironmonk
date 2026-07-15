// IRON MONK — Dagtaken (每日): kleine, eerlijke dagelijkse taken die de gebruiker
// terugbrengen. Volledig afgeleid van bestaande data; XP wordt één keer per taak
// per dag uitgekeerd (quest_claims voorkomt dubbel).
export type Quest = {
  key: string
  label: string
  desc: string
  xp: number
  done: boolean
  icon: string
}

export const QUEST_BONUS_XP = 25

// Bepaal de dagtaken voor een specifieke datum uit de app-state.
export function dailyQuests(app: any, date: string): Quest[] {
  const checkin = (app?.checkins || []).find((c: any) => c.date === date) || null
  const day = (app?.plan || []).find((d: any) => d.date === date) || null

  const dayTotal = day ? (day.blocks || []).reduce((x: number, b: any) => x + b.items.length, 0) : 0
  const dayDone = day ? (day.done_keys || []).length : 0
  const trainingDone = !day ? true : day.is_rest ? true : !!day.completed_at || (dayTotal > 0 && dayDone >= dayTotal)
  const medMin = checkin?.meditation_min || 0

  const quests: Quest[] = [
    {
      key: 'checkin',
      label: 'Meld je bij de meester',
      desc: 'Vul je dagelijkse check-in in',
      xp: 30,
      done: !!checkin,
      icon: '🩺',
    },
    {
      key: 'training',
      label: !day ? 'Bereid je voor' : day.is_rest ? 'Eer de rustdag' : 'Volbreng de missie',
      desc: !day
        ? 'Nog geen sessie gepland — rust en laad op'
        : day.is_rest
          ? 'Rust bewust; herstel is training'
          : `Rond de training van vandaag af (${dayDone}/${dayTotal})`,
      xp: 40,
      done: trainingDone,
      icon: day?.is_rest ? '🍵' : '⚔️',
    },
    {
      key: 'meditatie',
      label: 'Kalmeer de geest',
      desc: 'Mediteer minstens 5 minuten',
      xp: 20,
      done: medMin >= 5,
      icon: '🧘',
    },
  ]
  return quests
}
