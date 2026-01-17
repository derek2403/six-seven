/**
 * Market Logic for Corner Model
 * 
 * This module handles the logic for converting user selections (A, B, C)
 * into a basket of corner shares (000-111).
 */

export type Outcome = 'any' | 'yes' | 'no';

export interface Selection {
    A: Outcome;
    B: Outcome;
    C: Outcome;
}

export type ContractType = 'corner' | 'slice' | 'marginal' | 'all';

export interface Basket {
    fixedCount: number;
    type: ContractType;
    corners: string[];          // List of corner IDs included (e.g., ["110", "111"])
    quantities: Record<string, number>; // Map of all 8 corners to 0 or 1
}

/**
 * All 8 possible corners in the 3-event binary world
 */
export const ALL_CORNERS = [
    "000", "001", "010", "011",
    "100", "101", "110", "111"
];

/**
 * Calculate the basket of corner shares based on user selection
 * @param selection - User's choice for A, B, C
 * @returns The calculated basket details
 */
export const getBasket = (selection: Selection): Basket => {
    // 1. Determine fixed count and contract type
    let fixedCount = 0;
    if (selection.A !== 'any') fixedCount++;
    if (selection.B !== 'any') fixedCount++;
    if (selection.C !== 'any') fixedCount++;

    let type: ContractType = 'all';
    if (fixedCount === 3) type = 'corner';
    else if (fixedCount === 2) type = 'slice';
    else if (fixedCount === 1) type = 'marginal';

    // 2. Calculate quantities for each corner
    const quantities: Record<string, number> = {};
    const corners: string[] = [];

    ALL_CORNERS.forEach(corner => {
        // corner is string "010" -> A=0, B=1, C=0
        const aVal = corner[0] === '1' ? 'yes' : 'no';
        const bVal = corner[1] === '1' ? 'yes' : 'no';
        const cVal = corner[2] === '1' ? 'yes' : 'no';

        // Check if this corner matches the selection criteria
        const matchesA = selection.A === 'any' || selection.A === aVal;
        const matchesB = selection.B === 'any' || selection.B === bVal;
        const matchesC = selection.C === 'any' || selection.C === cVal;

        if (matchesA && matchesB && matchesC) {
            quantities[corner] = 1;
            corners.push(corner);
        } else {
            quantities[corner] = 0;
        }
    });

    return {
        fixedCount,
        type,
        corners,
        quantities
    };
};

// Example usage documentation:
// getBasket({A: 'yes', B: 'yes', C: 'no'}) -> { type: 'corner', corners: ['110'], ... }
// getBasket({A: 'yes', B: 'any', C: 'any'}) -> { type: 'marginal', corners: ['100','101','110','111'], ... }
