import { drawHalfEdgeMesh } from "../sdk/collision.js";
import { currentLevel } from "./level.js";
import { vec3 } from "./math/vector.js";
import { Face, HalfEdge, HalfEdgeMesh } from "./mesh/halfedge.js";
import { drawLine } from "./render/render.js";

interface FaceQuery {
	face: Face;
	seperation: number;
}

interface EdgeQuery {
	EdgeA: HalfEdge;
	EdgeB: HalfEdge;
	seperation: number;
	normal: vec3;
}

export function castAABB(size: vec3, start: vec3, end: vec3): number {
	// check aabb of start and end
	let v = size.mult(0.5);
	let minA = start.sub(v);
	let maxA = start.add(v);

	let totalMin = vec3.min(minA, end.sub(v));
	let totalMax = vec3.max(maxA, end.sub(v));

	// find all tris in totalMin/totalMax
	let tris: Face[] = [];
	for (let i = 0; i < currentLevel.collision.faces.length; ++i) {
		tris.push(currentLevel.collision.faces[i]);
	}

	// box mesh
	let box = createBoxMesh(minA, maxA);
	drawHalfEdgeMesh(box, [0, 0, 1, 1]);

	// check each tri for collision
	for (let i = 0; i < tris.length; ++i) {
		// check faces of the cube
		// check the tris face
	}

	return start.dist(end);
}

function satFaceTest() {

}

function createBoxMesh(min: vec3, max: vec3): HalfEdgeMesh {
	let boxMesh: HalfEdgeMesh = new HalfEdgeMesh();
	boxMesh.vertices = [
		{ position: new vec3(min.x, min.y, min.z), halfEdge: 0 },
		{ position: new vec3(min.x, min.y, max.z), halfEdge: 0 },
		{ position: new vec3(min.x, max.y, min.z), halfEdge: 0 },
		{ position: new vec3(min.x, max.y, max.z), halfEdge: 0 },
		{ position: new vec3(max.x, min.y, min.z), halfEdge: 0 },
		{ position: new vec3(max.x, min.y, max.z), halfEdge: 0 },
		{ position: new vec3(max.x, max.y, min.z), halfEdge: 0 },
		{ position: new vec3(max.x, max.y, max.z), halfEdge: 0 },
	];
	boxMesh.halfEdges = [
		// top
		{ prev: 3, next: 1, twin: 18, face: 0, vert: 3 },
		{ prev: 0, next: 2, twin: 14, face: 0, vert: 7 },
		{ prev: 1, next: 3, twin: 22, face: 0, vert: 6 },
		{ prev: 2, next: 0, twin: 10, face: 0, vert: 2 },
		// bottom
		{ prev: 7, next: 5, twin: 16, face: 1, vert: 5 },
		{ prev: 4, next: 6, twin: 8, face: 1, vert: 1 },
		{ prev: 5, next: 7, twin: 20, face: 1, vert: 0 },
		{ prev: 6, next: 4, twin: 12, face: 1, vert: 4 },
		// left
		{ prev: 11, next: 9, twin: 5, face: 2, vert: 0 },
		{ prev: 8, next: 10, twin: 19, face: 2, vert: 1 },
		{ prev: 9, next: 11, twin: 3, face: 2, vert: 3 },
		{ prev: 10, next: 8, twin: 21, face: 2, vert: 2 },
		// right
		{ prev: 15, next: 13, twin: 7, face: 3, vert: 5 },
		{ prev: 12, next: 14, twin: 23, face: 3, vert: 4 },
		{ prev: 13, next: 15, twin: 1, face: 3, vert: 6 },
		{ prev: 14, next: 12, twin: 17, face: 3, vert: 7 },
		// front
		{ prev: 19, next: 17, twin: 4, face: 4, vert: 1 },
		{ prev: 16, next: 18, twin: 15, face: 4, vert: 5 },
		{ prev: 17, next: 19, twin: 0, face: 4, vert: 7 },
		{ prev: 18, next: 16, twin: 9, face: 4, vert: 3 },
		// back
		{ prev: 23, next: 21, twin: 6, face: 5, vert: 4 },
		{ prev: 20, next: 22, twin: 11, face: 5, vert: 0 },
		{ prev: 21, next: 23, twin: 2, face: 5, vert: 2 },
		{ prev: 22, next: 20, twin: 13, face: 5, vert: 6 },
	];
	boxMesh.faces = [
		{ normal: new vec3(0, 1, 0), halfEdge: 0, distance: max.y },
		{ normal: new vec3(0, -1, 0), halfEdge: 4, distance: -min.y },
		{ normal: new vec3(-1, 0, 0), halfEdge: 8, distance: -min.x },
		{ normal: new vec3(1, 0, 0), halfEdge: 12, distance: max.x },
		{ normal: new vec3(0, 0, 1), halfEdge: 16, distance: max.z },
		{ normal: new vec3(0, 0, -1), halfEdge: 20, distance: -min.z },
	];
	return boxMesh;
}