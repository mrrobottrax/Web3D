import { HalfEdgeMesh } from "./mesh/halfedge.js";
import { Model } from "./mesh/model.js";
import { MeshData } from "./mesh/primitive.js";

export interface LevelFile {
	collision: HalfEdgeMesh;
	gltfName: string,
	binName: string
}

export class Level {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	models: Model[] = [];
}