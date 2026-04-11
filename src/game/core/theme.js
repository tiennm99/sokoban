/**
 * Visual theme — Nord-inspired palette. One place to tweak colors and
 * typography so every scene looks consistent.
 */

export const COLORS = {
    bg: 0x2E3440,
    bgCss: '#2E3440',
    panel: 0x3B4252,
    panelHover: 0x434C5E,
    floor: 0x4C566A,
    floorAlt: 0x434C5E,
    wall: 0x1B1F27,
    wallEdge: 0x2E3440,
    player: 0x88C0D0,
    playerEdge: 0x5E81AC,
    box: 0xD08770,
    boxEdge: 0xBF616A,
    boxDone: 0xA3BE8C,
    boxDoneEdge: 0x6A8E5C,
    target: 0xEBCB8B,
    textPrimary: '#ECEFF4',
    textMuted: '#D8DEE9',
    textDim: '#81A1C1',
    accent: '#88C0D0',
    success: '#A3BE8C',
    danger: '#BF616A'
};

export const FONTS = {
    title: { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '64px', color: COLORS.textPrimary, fontStyle: 'bold' },
    subtitle: { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '28px', color: COLORS.textMuted },
    button: { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '24px', color: COLORS.textPrimary, fontStyle: 'bold' },
    label: { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '20px', color: COLORS.textPrimary },
    small: { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '16px', color: COLORS.textDim }
};

/**
 * Pick a tile size that fits the level in the given viewport with margins.
 * Caps at 64px so small levels don't look comically large.
 */
export function computeTileSize(levelWidth, levelHeight, viewportWidth, viewportHeight, { maxTile = 64, marginX = 80, marginY = 160 } = {}) {
    const maxByWidth = Math.floor((viewportWidth - marginX) / levelWidth);
    const maxByHeight = Math.floor((viewportHeight - marginY) / levelHeight);
    return Math.max(16, Math.min(maxTile, maxByWidth, maxByHeight));
}
