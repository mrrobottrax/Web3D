import { currentLevel } from "./level.js";
import { vec3 } from "./math/vector.js";
import { Face, HalfEdge, HalfEdgeMesh, Vertex } from "./mesh/halfedge.js";
import { gl } from "./render/gl.js";
import { drawLine } from "./render/render.js";

export interface CastResult {
	dist: number;
	normal: vec3;
	fract: number;
	dir: vec3;
}

const epsilon = 0.00001;
export function castAABB(size: vec3, start: vec3, end: vec3): CastResult {
	let move = end.sub(start);
	let dist = move.magnitide();
	if (dist == 0) {
		return { dist: 0, normal: vec3.origin(), fract: 0, dir: vec3.origin() };
	}

	const moveDir = move.normalised();

	// check aabb of start and end
	let v = size.mult(0.5);
	let minA = start.sub(v);
	let maxA = start.add(v);

	let totalMin = vec3.min(minA, end.sub(v));
	let totalMax = vec3.max(maxA, end.sub(v));

	// find all tris in totalMin/totalMax
	// temp: get all tris everywhere
	// todo: aabb tree
	const level = currentLevel.collision;
	let tris: Face[] = [];
	for (let i = 0; i < level.faces.length; ++i) {
		// ignore faces we are moving behind
		if (vec3.dot(level.faces[i].normal, moveDir) < 0) {
			tris.push(level.faces[i]);
		}
	}

	// box mesh
	let box = createBoxMesh(minA, maxA);

	// clip to each tri
	let normal = vec3.origin();
	let hit = false;
	for (let t = 0; t < tris.length; ++t) {
		const tri = tris[t];
		let triVerts: Array<Vertex> = new Array(3);
		let triEdges: Array<HalfEdge> = new Array(3);
		triEdges[0] = (level.halfEdges[tri.halfEdge]);
		triEdges[1] = (level.halfEdges[level.halfEdges[tri.halfEdge].next]);
		triEdges[2] = (level.halfEdges[level.halfEdges[tri.halfEdge].prev]);
		triVerts[0] = (level.vertices[triEdges[0].vert]);
		triVerts[1] = (level.vertices[triEdges[1].vert]);
		triVerts[2] = (level.vertices[triEdges[2].vert]);

		// find axis with most seperation along move dir
		let seperation: number = -Infinity;
		let seperatingAxis: vec3 = new vec3(0, 0, 0);
		let seperatingDist: number = 0;
		{
			// check tri face
			// use side with most seperation
			let triSeperation = -Infinity;
			let triDist = 0;
			for (let i = 0; i < 2; ++i) {
				// find point with least seperation
				let sep = Infinity;
				for (let j = 0; j < box.vertices.length; ++j) {
					const p = box.vertices[j].position;

					let dot = ((vec3.dot(tri.normal, p) - tri.distance) * (i > 0 ? -1 : 1));

					if (dot <= sep) {
						sep = dot;
					}
				}
				sep /= Math.abs(vec3.dot(tri.normal, moveDir));

				if (sep >= triSeperation) {
					triSeperation = sep;
					triDist = tri.distance * (i > 0 ? -1 : 1);
				}
			}

			// check cube faces
			let boxSeperation = -Infinity;
			let boxNormal = vec3.origin();
			let boxDist = 0;
			for (let f = 0; f < box.faces.length; ++f) {
				const face = box.faces[f];

				// find point with least seperation
				let sep = Infinity;
				for (let j = 0; j < 3; ++j) {
					const p = triVerts[j].position;

					// todo: optimize, along with the other appearances of this code
					let dot = vec3.dot(face.normal, p) - face.distance;

					if (dot <= sep) {
						sep = dot;
					}
				}
				sep /= Math.abs(vec3.dot(face.normal, moveDir));

				if (sep >= boxSeperation) {
					boxSeperation = sep;
					boxNormal = face.normal;
					boxDist = face.distance;
				}
			}

			// check edge combos
			let edgeSeperation = -Infinity;
			let edgeNormal = vec3.origin();
			let edgeDist = 0;
			for (let i = 0; i < 3; ++i) {
				const triEdge: HalfEdge = triEdges[i];
				const triPos = vec3.origin();
				triPos.copy(level.vertices[triEdge.vert].position);
				const triEdgeDir = triPos.sub(
					level.vertices[level.halfEdges[triEdge.next].vert].position);
				const triEdgeDir2 = triPos.sub(
					level.vertices[level.halfEdges[triEdge.prev].vert].position).inverse();

				for (let j = 0; j < box.edges.length; ++j) {
					const boxEdge = box.halfEdges[box.edges[j].halfEdge];
					const boxPos = vec3.origin();
					boxPos.copy(box.vertices[boxEdge.vert].position);
					const boxEdgeDir = boxPos.sub(
						box.vertices[box.halfEdges[boxEdge.next].vert].position);

					// check if edges build face on minkowski diff
					const buildsFace = () => {
						const boxNormal0 = box.faces[boxEdge.face].normal;
						const boxNormal1 = box.faces[box.halfEdges[boxEdge.twin].face].normal;

						// todo: normalization needed?
						const triPlaneNormal = triEdgeDir.normalised();
						const triPlaneDist = vec3.dot(tri.normal, triPlaneNormal);

						// check for cross
						{
							const sideA = vec3.dot(boxNormal0, triPlaneNormal) - triPlaneDist;
							const sideB = vec3.dot(boxNormal1, triPlaneNormal) - triPlaneDist;

							if (Math.sign(sideA) == Math.sign(sideB))
								return false;
						}

						// check for different hemispheres
						const hemispherePlaneNormal = triEdgeDir2.normalised();
						const hemispherePlaneDist = vec3.dot(tri.normal, triPlaneNormal);

						// check for both on positive side
						{
							const sideA = vec3.dot(boxNormal0, triPlaneNormal) - triPlaneDist;
							const sideB = vec3.dot(boxNormal1, triPlaneNormal) - triPlaneDist;

							if (Math.sign(sideA) > 0 && Math.sign(sideB) > 0)
								return false;
						}

						return true;
					}

					if (!buildsFace())
						continue;

					let normal = vec3.cross(triEdgeDir, boxEdgeDir).normalised();

					// make normal align with box edge
					{
						const p = vec3.copy(boxPos.sub(start));
						const dot = vec3.dot(normal, p) - seperatingDist;

						if (dot < 0) {
							normal.copy(normal.inverse());
						}
					}

					const dist = vec3.dot(normal, boxPos);

					// find point with least seperation
					let sep = Infinity;
					for (let k = 0; k < 3; ++k) {
						const p = triVerts[k].position;

						let dot = vec3.dot(normal, p) - dist;

						if (dot <= sep) {
							sep = dot;
						}
					}
					sep /= Math.abs(vec3.dot(normal, moveDir));

					if (sep >= edgeSeperation) {
						edgeSeperation = sep;
						edgeNormal = normal;
						edgeDist = dist;
					}
				}
			}

			// pick face with most seperation along move dir
			if (boxSeperation > seperation) {
				seperation = boxSeperation;
				seperatingAxis.copy(boxNormal.inverse());
				seperatingDist = -boxDist;
			}
			if (triSeperation > seperation) {
				seperation = triSeperation;
				seperatingAxis.copy(tri.normal);
				seperatingDist = triDist;
			}
			if (edgeSeperation > seperation) {
				seperation = edgeSeperation;
				seperatingAxis.copy(edgeNormal);
				seperatingDist = edgeDist;
			}

			// clip dist
			if (seperation < dist) {
				// make normal point towards player center
				const s = seperation - epsilon;
				const d = s > 0 ? s : 0;
				const p = vec3.copy(start);
				const dot = vec3.dot(seperatingAxis, p) - seperatingDist;

				// flip normal
				if (dot < 0) {
					seperatingAxis = seperatingAxis.inverse();
					seperatingDist *= -1;
				}

				// allow moves that de-penetrate
				if (vec3.dot(seperatingAxis, moveDir) < 0) {
					dist = d;
					normal = seperatingAxis;
					hit = true;
				}
			}
		}
	}
	let fract = 1;
	if (hit) {
		fract = dist / move.magnitide();
	}
	return { dist: dist, normal: normal, fract: fract, dir: moveDir };
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
	boxMesh.edges = [
		{ halfEdge: 0 },
		{ halfEdge: 1 },
		{ halfEdge: 2 },
		{ halfEdge: 3 },
		{ halfEdge: 4 },
		{ halfEdge: 5 },
		{ halfEdge: 6 },
		{ halfEdge: 7 },
		{ halfEdge: 9 },
		{ halfEdge: 11 },
		{ halfEdge: 13 },
		{ halfEdge: 15 },
	]
	return boxMesh;
}

function verifyMesh(mesh: HalfEdgeMesh): boolean {
	// verify half edges
	for (let i = 0; i < mesh.halfEdges.length; ++i) {
		const he = mesh.halfEdges[i];
		if (he.twin != -1) {
			const twin = mesh.halfEdges[he.twin];

			if (twin.twin != i)
				return false;
		}
		const next = mesh.halfEdges[he.next];
		const prev = mesh.halfEdges[he.prev];

		if (prev.next != i)
			return false;

		if (next.prev != i)
			return false;
	}

	// verify edges
	let edgesList: number[] = [];
	for (let i = 0; i < mesh.edges.length; ++i) {
		const edge = mesh.edges[i];

		if (edgesList.includes(edge.halfEdge)) {
			return false;
		}

		edgesList.push(edge.halfEdge);
	}

	return true;
}