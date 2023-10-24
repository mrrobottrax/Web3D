import { currentLevel } from "./level.js";
import { vec3 } from "./math/vector.js";
import { Face, HalfEdge, HalfEdgeMesh, Vertex } from "./mesh/halfedge.js";

export interface CastResult {
	dist: number;
	normal: vec3;
	fract: number;
	dir: vec3;
}

export function castAABB(size: vec3, start: vec3, move: vec3): CastResult {
	let moveDist = move.magnitide();
	if (moveDist == 0) {
		return { dist: 0, normal: vec3.origin(), fract: 0, dir: vec3.origin() };
	}

	const moveDir = move.mult(1 / moveDist);

	// check aabb of start and end
	let v = size.mult(0.5);
	let minA = start.sub(v);
	let maxA = start.add(v);

	const end: vec3 = start.add(move);

	let totalMin = vec3.min(start.sub(v), end.sub(v));
	let totalMax = vec3.max(start.add(v), end.add(v));

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

	// find tFirst and tLast
	let normal = vec3.origin();
	let fract = Infinity;
	let minPen = Infinity;
	for (let t = 0; t < tris.length; ++t) {
		const tri = tris[t];
		let tFirst = -Infinity;
		let tLast = Infinity;
		let pen = Infinity;
		let _normal = vec3.origin();
		let _stuckNormal = vec3.origin();

		const checkCollision = () => {
			let triEdges: Array<HalfEdge> = new Array(3);
			let triVerts: Array<Vertex> = new Array(3);
			triEdges[0] = (level.halfEdges[tri.halfEdge]);
			triEdges[1] = (level.halfEdges[level.halfEdges[tri.halfEdge].next]);
			triEdges[2] = (level.halfEdges[level.halfEdges[tri.halfEdge].prev]);
			triVerts[0] = level.vertices[triEdges[0].vert];
			triVerts[1] = level.vertices[triEdges[1].vert];
			triVerts[2] = level.vertices[triEdges[2].vert];

			// update tFirst and tLast
			{
				const checkAxis = (axis: vec3, bias: number = 0) => {
					let minTri = Infinity;
					let maxTri = -Infinity;
					let minBox = Infinity;
					let maxBox = -Infinity;

					for (let vert = 0; vert < box.vertices.length; ++vert) {
						const d = vec3.dot(box.vertices[vert].position, axis);
						if (d < minBox) {
							minBox = d;
						}
						if (d > maxBox) {
							maxBox = d;
						}
					}

					for (let vert = 0; vert < triVerts.length; ++vert) {
						const d = vec3.dot(triVerts[vert].position, axis);
						if (d < minTri) {
							minTri = d;
						}
						if (d > maxTri) {
							maxTri = d;
						}
					}

					const speed = vec3.dot(axis, move);

					if (maxBox < minTri) {
						// box is in on the left

						if (speed <= 0) {
							return false;
						}

						let t = (minTri - maxBox) / speed;
						if (t > tFirst + bias) {
							tFirst = t;
							_normal.copy(axis.inverse());
						}

						t = (maxTri - minBox) / speed;
						if (t < tLast) {
							tLast = t;
						}

						if (tFirst > tLast) {
							return false;
						}
					} else if (maxTri < minBox) {
						// box is in on the right

						if (speed >= 0) {
							return false;
						}

						let t = (maxTri - minBox) / speed;
						if (t > tFirst + bias) {
							tFirst = t;
							_normal.copy(axis);
						}

						t = (minTri - maxBox) / speed;
						if (t < tLast) {
							tLast = t;
						}

						if (tFirst > tLast) {
							return false;
						}
					} else {
						// intersection

						if (speed > 0) {
							const t = (maxTri - minBox) / speed;
							if (t < tLast) {
								tLast = t;
							}

							if (tFirst > tLast) {
								return false;
							}

							const p = maxBox - minTri;
							if (p < pen) {
								pen = p;
								_stuckNormal.copy(axis.inverse());
							}
						} else if (speed < 0) {
							const t = (minTri - maxBox) / speed;
							if (t < tLast) {
								tLast = t;
							}

							if (tFirst > tLast) {
								return false;
							}

							const p = maxTri - minBox;
							if (p < pen) {
								pen = p;
								_stuckNormal.copy(axis);
							}
						}
					}

					return true;
				}

				// check both sides of tri face
				// is this even needed with new algorithm????
				//for (let i = 0; i < 2; ++i) {
				for (let i = 0; i < 1; ++i) {
					let axis = vec3.copy(tri.normal);
					if (i == 1) {
						axis = axis.inverse();
					}
					if (!checkAxis(axis))
						return false;
				}

				// check box faces
				for (let f = 0; f < box.faces.length; ++f) {
					const axis = box.faces[f].normal;
					if (!checkAxis(axis))
						return false;
				}

				// check edge combos
				for (let i = 0; i < 3; ++i) {
					const triEdge: HalfEdge = triEdges[i];
					const triPos = vec3.origin();
					triPos.copy(level.vertices[triEdge.vert].position);
					const triEdgeDir = triPos.sub(
						level.vertices[level.halfEdges[triEdge.next].vert].position);

					for (let j = 0; j < box.edges.length; ++j) {
						const boxEdge = box.halfEdges[box.edges[j].halfEdge];
						const boxPos = vec3.copy(box.vertices[boxEdge.vert].position);
						const boxEdgeDir = boxPos.sub(
							box.vertices[box.halfEdges[boxEdge.next].vert].position);

						// check if edges build face on minkowski diff
						const buildsFace = () => {
							// uses gauss map

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

							// check for both on positive side
							{
								const sideA = vec3.dot(boxNormal0, triPlaneNormal) - triPlaneDist;
								const sideB = vec3.dot(boxNormal1, triPlaneNormal) - triPlaneDist;

								if (Math.sign(sideA) > 0 && Math.sign(sideB) > 0)
									return false;
							}

							return true;
						}

						if (buildsFace()) {
							//if (true) {
							let axis = vec3.cross(triEdgeDir, boxEdgeDir).normalised();

							// align
							if (vec3.dot(axis, boxPos.sub(start)) > 0) {
								axis = axis.inverse();
							}

							if (!checkAxis(axis))
								return false;
						}
					}
				}
			}

			return true;
		}

		if (checkCollision()) {
			if (tFirst <= fract) {
				fract = tFirst;
				if (fract <= 0) {
					fract = 0;

					// check if least penetration
					if (pen < minPen) {
						minPen = pen;
						normal.copy(_stuckNormal);
					}
				} else {
					normal.copy(_normal);
				}
			}
		}
	}

	let dist;

	if (fract >= 1) {
		fract = 1;
		dist = moveDist;
		normal = vec3.origin();
	} else {
		// move back a bit
		dist = fract * moveDist - 0.001;

		if (dist < 0)
			dist = 0;

		fract = dist / moveDist;
	}

	return { dist: dist, normal: normal, fract: fract, dir: moveDir };
}

export function castRay(start: vec3, end: vec3): CastResult {
	return {dist: 0, normal: vec3.origin(), fract: 0, dir: vec3.origin()};
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