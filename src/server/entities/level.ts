import { readFileSync } from 'fs'
import { Level, clearCurrentLevel, currentLevel } from '../../common/entities/level.js';
import { PlayerSpawn } from '../../common/entities/playerSpawn.js';
import gMath from '../../common/math/gmath.js';

export function setLevelServer(filepath: string) {
	const file: Uint8Array = readFileSync(filepath + ".glvl");
	clearCurrentLevel();

	const offsets = Level.getOffsetsTable(file);

	if (!currentLevel) {
		console.error("ERROR LOADING LEVEL");
		return;
	}

	currentLevel.collision = Level.getCollisionData(file, offsets);
	Level.getEntityData(file, offsets);
}

export function findSpawn(): PlayerSpawn | null {
	if (!currentLevel?.spawns) return null;
	if (currentLevel.spawns.length == 0) return null;

	const length = currentLevel?.spawns.length;

	return currentLevel.spawns[gMath.randomInt(length)];
}