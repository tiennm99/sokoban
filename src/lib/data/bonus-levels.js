/**
 * Hand-designed bonus puzzles for this project.
 *
 * Unlike `microban-levels.js` (David W. Skinner's set, used under his
 * redistribution grant), these layouts are original work by the project
 * author and are covered by the repository's main LICENSE.
 *
 * Format: XSB
 *   #  wall
 *   (space) floor
 *   .  target
 *   $  box
 *   *  box on target
 *   @  player
 *   +  player on target
 *
 * Every layout must be sealed (walls fully enclose the reachable floor)
 * and solvable. Levels appear after the Microban set in level select.
 */
export const BONUS_LEVELS = [
// Compass — four boxes pushed outward onto the cardinal points.
`#######
#. . .#
# $$$ #
#.$@$.#
# $$$ #
#. . .#
#######`
];
