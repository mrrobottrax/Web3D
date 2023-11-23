import { readFileSync } from 'fs'
import { LevelFile } from '../../common/system/levelfile.js';
import { setLevelCollision } from '../../common/system/physics.js';

export function setLevelServer(filepath: string) {
	const file: LevelFile = JSON.parse(readFileSync(filepath + ".lvl", 'utf-8'));
	setLevelCollision(file.collision);
}