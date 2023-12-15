import { readFileSync } from 'fs'
import { currentLevel } from '../../client/entities/level.js';
import { Level, clearCurrentLevel } from '../../common/entities/level.js';

export function setLevelServer(filepath: string) {
	const file: Uint8Array = readFileSync(filepath + ".glvl");
	clearCurrentLevel();

	const offsets = Level.getOffsetsTable(file);

	if (!currentLevel) {
		console.error("ERROR LOADING LEVEL");
		return;
	}

	currentLevel.collision = Level.getCollisionData(file, offsets);
}