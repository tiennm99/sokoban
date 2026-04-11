import { AUTO, Game, Scale } from 'phaser';
import MenuScene from './scenes/menu-scene.js';
import LevelScene from './scenes/level-scene.js';
import GameScene from './scenes/game-scene.js';
import { COLORS } from './core/theme.js';

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: COLORS.bgCss,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [MenuScene, LevelScene, GameScene]
};

const StartGame = (parent) => new Game({ ...config, parent });

export default StartGame;
