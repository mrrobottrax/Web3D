import { loadGltfFromWeb } from "./mesh/gltfloader.js";
import { HalfEdgeMesh } from "../mesh/halfedge.js";
import { LevelFile } from "../levelfile.js";
import { setLevelCollision } from "../physics.js";
import { GameObject } from "../componentsystem/gameobject.js";
import { Model } from "./mesh/model.js";

export class Level extends GameObject {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	model: Model = new Model();
}

export let currentLevel: Level;
export let gameobjectsList: GameObject[] = [];

export async function setLevelClient(url: string): Promise<void> {
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
	const model = loadGltfFromWeb(url);

	if (!model) {
		console.error("Failed to load level model");
		return;
	}

	currentLevel = new Level();
	currentLevel.collision = file.collision;
	setLevelCollision(currentLevel.collision);
	currentLevel.model = await model;
}