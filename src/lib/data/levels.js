/**
 * The playable level list: the Microban set followed by the project's
 * own bonus puzzles. Views import LEVELS from here so a single index
 * space (and therefore a single progress-store key space) spans both sets.
 */
import { MICROBAN_LEVELS } from './microban-levels.js';
import { BONUS_LEVELS } from './bonus-levels.js';

export const LEVELS = [...MICROBAN_LEVELS, ...BONUS_LEVELS];

/** Number of Microban levels; bonus levels start at this index. */
export const MICROBAN_COUNT = MICROBAN_LEVELS.length;

/** True when the given level index is one of the hand-designed bonus levels. */
export const isBonusLevel = (index) => index >= MICROBAN_COUNT;
