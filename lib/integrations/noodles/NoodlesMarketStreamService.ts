import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { CoinUpdateData, NoodlesMessageSchema } from './schema';

const NOODLES_WS_URL = 'wss://ws.noodles.fi/ws/coin-update';
const RECONNECT_DELAY_MS = 10000; // 10 seconds between reconnect attempts
const PING_INTERVAL_MS = 30000;   // Ping every 30 seconds per docs

/**
 * Cached coin data with timestamp
 */
interface CachedCoinData {
    data: CoinUpdateData;
    updatedAt: Date;
}

/**
 * Singleton service for persistent WebSocket connection to Noodles.fi
 * Maintains a single connection and caches coin data to avoid rate limiting.
 */
class NoodlesMarketStreamService extends EventEmitter {
    private static instance: NoodlesMarketStreamService | null = null;

    private ws: WebSocket | null = null;
    private isConnected: boolean = false;
    private isConnecting: boolean = false;
    private pingInterval: NodeJS.Timeout | null = null;
    private subscribedCoins: Set<string> = new Set();
    private reconnectTimeout: NodeJS.Timeout | null = null;

    // Data cache - stores latest coin updates
    private coinCache: Map<string, CachedCoinData> = new Map();

    private constructor() {
        super();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): NoodlesMarketStreamService {
        if (!NoodlesMarketStreamService.instance) {
            NoodlesMarketStreamService.instance = new NoodlesMarketStreamService();
        }
        return NoodlesMarketStreamService.instance;
    }

    /**
     * Initialize connection and subscribe to coins.
     * Safe to call multiple times - will only connect once.
     */
    public initialize(coinIds: string[]): void {
        // Add coins to subscription set
        coinIds.forEach(id => this.subscribedCoins.add(id));

        // Connect if not already connected
        if (!this.isConnected && !this.isConnecting) {
            this.connect();
        } else if (this.isConnected) {
            // Already connected, just send subscription
            this.sendSubscription(Array.from(this.subscribedCoins));
        }
    }

    /**
     * Get cached data for all subscribed coins
     */
    public getCachedData(): CoinUpdateData[] {
        return Array.from(this.coinCache.values()).map(cached => cached.data);
    }

    /**
     * Get cached data for specific coins
     */
    public getCachedDataForCoins(coinIds: string[]): CoinUpdateData[] {
        const result: CoinUpdateData[] = [];
        for (const coinId of coinIds) {
            const cached = this.coinCache.get(coinId);
            if (cached) {
                result.push(cached.data);
            }
        }
        return result;
    }

    /**
     * Check if we have any cached data
     */
    public hasCachedData(): boolean {
        return this.coinCache.size > 0;
    }

    /**
     * Get connection status
     */
    public getStatus(): { connected: boolean; subscribedCoins: number; cachedCoins: number } {
        return {
            connected: this.isConnected,
            subscribedCoins: this.subscribedCoins.size,
            cachedCoins: this.coinCache.size
        };
    }

    /**
     * Connect to the Noodles.fi WebSocket
     */
    private connect(): void {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            console.log('NoodlesService: Already connected or connecting.');
            return;
        }

        this.isConnecting = true;
        console.log(`NoodlesService: Connecting to ${NOODLES_WS_URL}...`);

        this.ws = new WebSocket(NOODLES_WS_URL, {
            headers: {
                Origin: 'https://noodles.fi'
            }
        });

        this.ws.on('open', this.handleOpen.bind(this));
        this.ws.on('message', this.handleMessage.bind(this));
        this.ws.on('error', this.handleError.bind(this));
        this.ws.on('close', this.handleClose.bind(this));
    }

    private handleOpen(): void {
        console.log('NoodlesService: Connection opened.');
        this.isConnected = true;
        this.isConnecting = false;
        this.startPing();

        // Subscribe to any pending coins
        if (this.subscribedCoins.size > 0) {
            this.sendSubscription(Array.from(this.subscribedCoins));
        }

        this.emit('connected');
    }

    private handleMessage(data: WebSocket.Data): void {
        try {
            const messageString = data.toString();
            const json = JSON.parse(messageString);

            // Validate basic structure
            const parsed = NoodlesMessageSchema.safeParse(json);

            if (!parsed.success) {
                // Silent fail for non-matching messages (like subscription confirmations)
                return;
            }

            const message = parsed.data;

            if (message.type === 'pong') {
                return;
            }

            if (message.type === 'data' && message.room === 'COIN_UPDATES') {
                const coinData = message.data as CoinUpdateData;

                // Update cache
                if (coinData && coinData.coin) {
                    this.coinCache.set(coinData.coin, {
                        data: coinData,
                        updatedAt: new Date()
                    });
                }

                this.emit('coinUpdate', coinData);
            }

        } catch (err) {
            console.error('NoodlesService: Error parsing message', err);
        }
    }

    private handleError(err: Error): void {
        console.error('NoodlesService: WebSocket error', err);
        this.isConnecting = false;
        this.emit('error', err);
    }

    private handleClose(code: number, reason: Buffer): void {
        const reasonStr = reason?.toString() || '';
        console.warn(`NoodlesService: Connection closed (code: ${code}, reason: ${reasonStr}). Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
        this.isConnected = false;
        this.isConnecting = false;
        this.stopPing();
        this.ws = null;

        // Auto-reconnect with delay
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, RECONNECT_DELAY_MS);
    }

    private sendSubscription(coins: string[]): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const payload = {
            type: 'subscribe',
            room: 'COIN_UPDATES',
            data: {
                coins: coins
            }
        };

        console.log('NoodlesService: Sending subscription for', coins.length, 'coins');
        this.ws.send(JSON.stringify(payload));
    }

    private startPing(): void {
        this.stopPing();
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, PING_INTERVAL_MS);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}

// Export singleton getter
export const getNoodlesService = () => NoodlesMarketStreamService.getInstance();
export type { CoinUpdateData };
