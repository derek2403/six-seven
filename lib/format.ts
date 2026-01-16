import { USDC_CONFIG } from './config';

/**
 * Format a balance string with proper decimal places for USDC
 * @param balance - The raw balance string (in smallest units)
 * @returns Formatted balance string with decimals
 */
export const formatBalance = (balance: string): string => {
    const num = BigInt(balance);
    const decimals = BigInt(10 ** USDC_CONFIG.DECIMALS);
    const whole = num / decimals;
    const fraction = num % decimals;
    return `${whole}.${fraction.toString().padStart(USDC_CONFIG.DECIMALS, '0')}`;
};

/**
 * Parse a human-readable amount to raw units
 * @param amount - The amount in human-readable format (e.g., "100")
 * @returns BigInt representing the amount in smallest units
 */
export const parseAmount = (amount: string): bigint => {
    return BigInt(parseFloat(amount) * (10 ** USDC_CONFIG.DECIMALS));
};
