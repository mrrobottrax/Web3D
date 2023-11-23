import { HalfEdgeMesh } from "../mesh/halfedge.js";

export interface LevelFile {
	collision: HalfEdgeMesh;
	gltfName: string,
	binName: string
}