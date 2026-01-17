import { z } from 'zod';

// Base Coin Information
export const BaseCoinSchema = z.object({
    coin_ident: z.string(),
    symbol: z.string(),
    name: z.string(),
});

// Coin Update Data Field
// Note: According to actual Noodles.fi responses, 'coin' is the full coin identifier string,
// not an object with coin_ident/symbol/name as the docs table suggests.
export const CoinUpdateDataSchema = z.object({
    coin: z.string(), // The full coin identifier, e.g. "0x...::sui::SUI"
    price: z.number().optional(),
    price_change_30m: z.number().optional(),
    price_change_1h: z.number().optional(),
    price_change_4h: z.number().optional(),
    price_change_6h: z.number().optional(),
    price_change_24h: z.number().optional(),
    vol_change_1d: z.number().optional(),
    liq_change_1d: z.number().optional(),
    tx_change_1d: z.number().optional(),
    tx_24h: z.number().optional(),
    buy_vol_24h: z.number().optional(),
    sell_vol_24h: z.number().optional(),
    buy_tx_24h: z.number().optional(),
    sell_tx_24h: z.number().optional(),
    market_cap: z.number().optional(),
    liquidity_usd: z.number().optional(),
    rank: z.number().optional(),
    holders: z.number().optional(),
    volume_24h: z.number().optional(),
});

// Types of Messages
export const MessageTypeSchema = z.enum(['ping', 'pong', 'subscribe', 'unsubscribe', 'data', 'error']);

// Server Response Message
export const NoodlesMessageSchema = z.object({
    type: MessageTypeSchema,
    channel: z.string().optional(), // e.g. "COIN_UPDATES-0x..."
    room: z.string().optional(),
    data: z.union([CoinUpdateDataSchema, z.any()]), // Use union or specific schema based on room
    error: z.string().optional(),
});

export type NoodlesMessage = z.infer<typeof NoodlesMessageSchema>;
export type CoinUpdateData = z.infer<typeof CoinUpdateDataSchema>;
