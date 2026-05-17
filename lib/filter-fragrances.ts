type Filters = {
  season: string
  lean: string
  anosmia: string
}

export function filterFragrances<
  T extends { temperature: string; lean: string; anosmia_risk: 'High' | 'Medium' | 'Low' },
>(fragrances: T[], filters: Filters): T[] {
  return fragrances.filter((f) => {
    if (filters.season !== 'All' && f.temperature !== filters.season) return false
    if (filters.lean !== 'All' && f.lean !== filters.lean) return false
    if (filters.anosmia !== 'All' && f.anosmia_risk !== filters.anosmia) return false
    return true
  })
}
