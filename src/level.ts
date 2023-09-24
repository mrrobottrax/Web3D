import { vec3 } from "./math/vector.js";
import { loadGlTFFromWeb } from "./mesh/gltfloader.js";
import { HalfEdgeMesh } from "./mesh/halfedge.js";
import { Model } from "./mesh/model.js";

export interface LevelFile {
	collision: HalfEdgeMesh;
	gltfName: string,
	binName: string
}

export class Level {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	models: Model[] = [];
}

export let currentLevel: Level;

export async function setLevel(url: string): Promise<void> {
	const req = new XMLHttpRequest();
	const promise = new Promise<XMLHttpRequest>((resolve) => {
		req.addEventListener("load", function () { resolve(this); });
	});

	req.open("GET", url + ".lvl");
	req.send();

	const res = await promise;

	if (res.status != 200) {
		console.error("Failed to load level");
		return;
	}

	const file: LevelFile = JSON.parse(res.response);
	const models = loadGlTFFromWeb(url);

	if (!models) {
		console.error("Failed to load level model");
		return;
	}

	currentLevel = new Level();
	currentLevel.collision = file.collision;
	currentLevel.models = await models;
}