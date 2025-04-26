/**
 * Utility function to get the correct asset path based on the environment
 * This helps ensure assets load correctly both locally and on GitHub Pages
 *
 * @param {string} path - The relative path to the asset
 * @returns {string} The correct path to use for loading the asset
 */
export function getAssetPath(path) {
    // The path should be used as-is since Vite handles the base path
    // during build based on the config.base setting
    return path;
}
