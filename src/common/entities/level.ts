import { Entity } from "../entitysystem/entity.js";
import { HalfEdgeMesh } from "../mesh/halfedge.js";
import { Primitive } from "../mesh/model.js";

export class Level extends Entity {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	staticMeshes: Primitive[] = [];
	textureTable: any;

	static getCollisionData(file: Uint8Array, offsets: any): HalfEdgeMesh {
		const subArray = file.subarray(offsets.collision, offsets.lastIndex + 1);
	
		const decoder = new TextDecoder();
	
		return JSON.parse(decoder.decode(subArray));
	}

	static getOffsetsTable(file: Uint8Array): any {
		// read until null byte
		let index = 0;
		while (file[index] != 0) {
			++index;
		}
	
		const subArray = file.subarray(0, index);
	
		const decoder = new TextDecoder();
		let table = JSON.parse(decoder.decode(subArray));
	
		for (const [key, value] of Object.entries(table)) {
			if (typeof value == "number")
				table[key] += index + 1;
		}
	
		return table;
	}
}

export let currentLevel: Level | null;

export function clearCurrentLevel() {
	// todo: clear memory

	currentLevel = new Level();
}