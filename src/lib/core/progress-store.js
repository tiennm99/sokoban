/**
 * Progress persistence via localStorage.
 * Tracks which levels have been completed and the best move count per level.
 * Fails gracefully if storage is unavailable (private mode, etc).
 */

const STORAGE_KEY = 'sokoban-progress-v1';

function readRaw() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { completed: {}, bestMoves: {} };
    } catch {
        return { completed: {}, bestMoves: {} };
    }
}

function writeRaw(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore: best-effort persistence
    }
}

export const progressStore = {
    isCompleted(levelIndex) {
        return !!readRaw().completed[levelIndex];
    },

    getBestMoves(levelIndex) {
        return readRaw().bestMoves[levelIndex] ?? null;
    },

    recordCompletion(levelIndex, moveCount) {
        const data = readRaw();
        data.completed[levelIndex] = true;
        const prev = data.bestMoves[levelIndex];
        if (prev == null || moveCount < prev) {
            data.bestMoves[levelIndex] = moveCount;
        }
        writeRaw(data);
    },

    getCompletedCount() {
        return Object.keys(readRaw().completed).length;
    },

    /**
     * Returns the full progress snapshot. Lets callers read many levels
     * without paying for one parse + one localStorage read per query.
     */
    snapshot() {
        return readRaw();
    },

    reset() {
        writeRaw({ completed: {}, bestMoves: {} });
    }
};
