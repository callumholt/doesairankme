interface ScoringResult {
  position: number | null
  query: string
}

function positionScore(position: number): number {
  if (position === 1) return 1.0
  if (position === 2) return 0.8
  if (position === 3) return 0.6
  if (position === 4) return 0.4
  return 0.2
}

export function calculateScore(results: ScoringResult[]) {
  const appeared = results.filter((r) => r.position !== null)
  const appearanceRate = appeared.length / results.length

  let avgPosScore = 0
  if (appeared.length > 0) {
    avgPosScore = appeared.reduce((sum, r) => sum + positionScore(r.position!), 0) / appeared.length
  }

  const score = (appearanceRate * 0.6 + avgPosScore * 0.4) * 100

  return {
    total: results.length,
    appeared: appeared.length,
    appearanceRate,
    avgPosition: appeared.length > 0 ? appeared.reduce((sum, r) => sum + r.position!, 0) / appeared.length : null,
    score: Math.round(score * 10) / 10,
  }
}
