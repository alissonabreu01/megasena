/**
 * Utility functions for working with the frame (moldura) in Mega Sena
 * 
 * The frame consists of the border numbers of the lottery card (6x10 grid):
 * - Top row: 1-10
 * - Bottom row: 51-60
 * - Left column: 11, 21, 31, 41
 * - Right column: 20, 30, 40, 50
 */

import { FRAME_NUMBERS, CENTER_NUMBERS } from './megasena-constants';

export { FRAME_NUMBERS, CENTER_NUMBERS };

/**
 * Checks if a number belongs to the frame
 * @param num - The number to check (1-60)
 * @returns true if the number is in the frame, false otherwise
 */
export function isFrameNumber(num: number): boolean {
    return FRAME_NUMBERS.includes(num);
}

/**
 * Checks if a number belongs to the center
 * @param num - The number to check (1-60)
 * @returns true if the number is in the center, false otherwise
 */
export function isCenterNumber(num: number): boolean {
    return CENTER_NUMBERS.includes(num);
}

/**
 * Counts how many numbers from a game are in the frame
 * @param numbers - Array of numbers from a lottery game
 * @returns The count of frame numbers
 */
export function countFrameNumbers(numbers: number[]): number {
    return numbers.filter(n => isFrameNumber(n)).length;
}

/**
 * Counts how many numbers from a game are in the center
 * @param numbers - Array of numbers from a lottery game
 * @returns The count of center numbers
 */
export function countCenterNumbers(numbers: number[]): number {
    return numbers.filter(n => isCenterNumber(n)).length;
}

/**
 * Gets the frame ratio for a game (percentage of numbers in the frame)
 * @param numbers - Array of numbers from a lottery game
 * @returns The ratio as a number between 0 and 1
 */
export function getFrameRatio(numbers: number[]): number {
    return countFrameNumbers(numbers) / numbers.length;
}

/**
 * Gets which row a number belongs to (1-6)
 * @param num - The number to check (1-60)
 * @returns The row number (1-6) or 0 if invalid
 */
export function getRow(num: number): number {
    if (num < 1 || num > 60) return 0;
    return Math.ceil(num / 10);
}

/**
 * Gets which column a number belongs to (1-10)
 * @param num - The number to check (1-60)
 * @returns The column number (1-10) or 0 if invalid
 */
export function getColumn(num: number): number {
    if (num < 1 || num > 60) return 0;
    const col = num % 10;
    return col === 0 ? 10 : col;
}

/**
 * Checks if a number is on the edge (first or last row/column)
 * @param num - The number to check (1-60)
 * @returns true if on edge, false otherwise
 */
export function isEdge(num: number): boolean {
    const row = getRow(num);
    const col = getColumn(num);
    return row === 1 || row === 6 || col === 1 || col === 10;
}

/**
 * Checks if a number is a corner (one of the 4 corners of the grid)
 * @param num - The number to check (1-60)
 * @returns true if corner, false otherwise
 */
export function isCorner(num: number): boolean {
    return num === 1 || num === 10 || num === 51 || num === 60;
}
