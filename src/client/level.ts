import { loadGltfFromWeb } from "./mesh/gltfloader.js";
import { HalfEdgeMesh } from "../mesh/halfedge.js";
import { ModelBase, SkinnedModel, StaticModel } from "./mesh/model.js";
import { LevelFile } from "../levelfile.js";
import { setLevelCollision } from "../physics.js";

export class Level {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	model: (StaticModel | SkinnedModel) = new ModelBase();
}

export let currentLevel: Level;

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