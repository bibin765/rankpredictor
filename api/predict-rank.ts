// index.ts
import { Elysia } from 'elysia'
import { z } from 'zod'

const app = new Elysia()

// Constants based on analysis and KEAM historical data
const TOTAL_CANDIDATES = 86000

// Updated to reflect realistic index-score-to-rank mapping (2024 topper: ~590 index => Rank 1)
const HISTORICAL_SCORES = [
  { index: 590, rank: 1 },
  { index: 560, rank: 100 },
  { index: 530, rank: 500 },
  { index: 500, rank: 1500 },
  { index: 470, rank: 3000 },
  { index: 440, rank: 5000 },
  { index: 410, rank: 10000 },
  { index: 370, rank: 20000 },
  { index: 330, rank: 30000 },
  { index: 290, rank: 40000 },
  { index: 250, rank: 50000 },
  { index: 200, rank: 65000 },
  { index: 150, rank: 80000 },
  { index: 100, rank: 86000 }
]

function calculateIndexScore(
  keamScore: number,
  maths: number,
  physics: number,
  chemistry: number
): number {
  const pcmTotal = maths + physics + chemistry
  const cappedPCM = Math.min(300, pcmTotal)
  return keamScore + cappedPCM
}

function predictHistoricalRank(indexScore: number): number {
  if (indexScore >= HISTORICAL_SCORES[0].index) return 1

  for (let i = 1; i < HISTORICAL_SCORES.length; i++) {
    const prev = HISTORICAL_SCORES[i - 1]
    const curr = HISTORICAL_SCORES[i]
    if (indexScore >= curr.index && indexScore < prev.index) {
      const ratio = (indexScore - curr.index) / (prev.index - curr.index)
      return Math.floor(curr.rank + ratio * (prev.rank - curr.rank))
    }
  }

  return TOTAL_CANDIDATES
}

function predictRank(indexScore: number): { min: number; max: number } {
  const estimated = predictHistoricalRank(indexScore)
  return {
    min: Math.max(1, estimated - 50),
    max: Math.min(TOTAL_CANDIDATES, estimated + 50)
  }
}

app.post('/predict-rank', async ({ body }) => {
  const schema = z.object({
    keam_normalized_score: z.number(),
    maths: z.number(),
    physics: z.number(),
    chemistry: z.number()
  })

  const input = schema.parse(body)

  const indexScore = calculateIndexScore(
    input.keam_normalized_score,
    input.maths,
    input.physics,
    input.chemistry
  )

  const rank = predictRank(indexScore)

  return {
    final_index_score: Math.round(indexScore * 100) / 100,
    estimated_rank_range: {
      min_rank: rank.min,
      max_rank: rank.max
    }
  }
})

export default app;

console.log('🚀 KEAM Rank Predictor running at http://localhost:3000')