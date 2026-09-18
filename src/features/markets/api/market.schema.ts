import { z } from 'zod'

export const tradeGoodInfoSchema = z.object({
  symbol: z.string(),
  name: z.string(),
})

export const marketTradeGoodSchema = z.object({
  symbol: z.string(),
  tradeVolume: z.number(),
  supply: z.string(),
  activity: z.string().optional(),
  purchasePrice: z.number(),
  sellPrice: z.number(),
})

export const marketSchema = z.object({
  symbol: z.string(),
  exports: z.array(tradeGoodInfoSchema),
  imports: z.array(tradeGoodInfoSchema),
  exchange: z.array(tradeGoodInfoSchema),
  tradeGoods: z.array(marketTradeGoodSchema).optional(),
})

export type TradeGoodInfo = z.infer<typeof tradeGoodInfoSchema>
export type MarketTradeGood = z.infer<typeof marketTradeGoodSchema>
export type Market = z.infer<typeof marketSchema>
