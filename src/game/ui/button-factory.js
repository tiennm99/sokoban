/**
 * Button factory: DRY rounded rectangle + text button with hover/press states.
 * Returns a Phaser container so callers can position/destroy it as one unit.
 */

import { COLORS, FONTS } from '../core/theme.js';

export function createButton(scene, x, y, label, onClick, opts = {}) {
    const {
        width = 200,
        height = 56,
        fill = COLORS.panel,
        hoverFill = COLORS.panelHover,
        textStyle = FONTS.button,
        radius = 10
    } = opts;

    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const drawBg = (color) => {
        bg.clear();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
        bg.lineStyle(2, COLORS.player, 0.6);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    };
    drawBg(fill);

    const text = scene.add.text(0, 0, label, textStyle).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(width, height);
    // Hit area is defined in the container's LOCAL coordinates and never
    // scales with the container — this keeps clicks reliable even while the
    // button is visually animating.
    container.setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
        drawBg(hoverFill);
        scene.input.setDefaultCursor('pointer');
    });
    container.on('pointerout', () => {
        drawBg(fill);
        scene.input.setDefaultCursor('default');
    });
    // Fire on pointerdown for a snappy, reliable click. No press-scale
    // animation, no release tracking — touch, mouse, and fast clicks all
    // behave the same way.
    container.on('pointerdown', () => onClick?.());

    container.setLabel = (txt) => text.setText(txt);
    return container;
}

/** Small square icon button used for pagination arrows, restart, etc. */
export function createIconButton(scene, x, y, label, onClick, opts = {}) {
    return createButton(scene, x, y, label, onClick, {
        width: 48,
        height: 48,
        textStyle: { ...FONTS.button, fontSize: '22px' },
        ...opts
    });
}
