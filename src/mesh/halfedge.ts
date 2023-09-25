import { mat4 } from "../math/matrix.js";
import { vec3 } from "../math/vector.js";
import { MeshData } from "./primitive.js";

export interface Vertex {
	position: vec3;
	halfEdge: number;
}

export interface HalfEdge {
	prev: number;
	next: number;
	twin: number;
	face: number;
	vert: number;
}

export interface Face {
	normal: vec3;
	distance: number;
	halfEdge: number;
}

export class HalfEdgeMesh {
	vertices: Array<Vertex> = [];
	halfEdges: Array<HalfEdge> = [];
	faces: Array<Face> = [];

	clear() {
		this.vertices = [];
		this.halfEdges = [];
		this.faces = [];
	}

	static fromMeshes(meshes: MeshData[]): HalfEdgeMesh {
		// vertices
		let vertices: Vertex[] = [];
		for (let m = 0; m < meshes.length; ++m) {
			const mesh = meshes[m];
			for (let p = 0; p < mesh.primitives.length; ++p) {
				const vertCount = mesh.primitives[p].positions.length / 3;
				for (let i = 0; i < vertCount; ++i) {
					const index = i * 3;

					let pos = new vec3(
						mesh.primitives[p].positions[index],
						mesh.primitives[p].positions[index + 1],
						mesh.primitives[p].positions[index + 2]
					);

					let mat = new mat4(1);
					mat.translate(mesh.translation);
					mat.rotate(mesh.rotation);
					mat.scale(mesh.scale);

					pos = pos.multMat4(mat);

					vertices.push({
						halfEdge: 0,
						position: pos
					});
				}
			}
		}

		let vertOffset = 0;
		let edgeOffset = 0;
		let faceOffset = 0;
		let faces: Face[] = [];
		let halfEdges: HalfEdge[] = [];
		for (let m = 0; m < meshes.length; ++m) {
			for (let p = 0; p < meshes[m].primitives.length; ++p) {
				const primitive = meshes[m].primitives[p];
				const triCount = primitive.elements.length / 3;

				for (let i = 0; i < triCount; ++i) {
					const primEdgeIndex = i * 3;
					const edgeIndex = edgeOffset + primEdgeIndex;
					const faceIndex = faceOffset + i;

					const vert0 = vertOffset + primitive.elements[primEdgeIndex]
					const vert1 = vertOffset + primitive.elements[primEdgeIndex + 1]
					const vert2 = vertOffset + primitive.elements[primEdgeIndex + 2]
					vertices[vert0].halfEdge = edgeIndex;
					halfEdges[edgeIndex] = {
						prev: edgeIndex + 2,
						next: edgeIndex + 1,
						twin: -1,
						face: faceIndex,
						vert: vert0
					}
					vertices[vert1].halfEdge = edgeIndex + 1;
					halfEdges[edgeIndex + 1] = {
						prev: edgeIndex,
						next: edgeIndex + 2,
						twin: -1,
						face: faceIndex,
						vert: vert1
					}
					vertices[vert2].halfEdge = edgeIndex + 2;
					halfEdges[edgeIndex + 2] = {
						prev: edgeIndex + 1,
						next: edgeIndex,
						twin: -1,
						face: faceIndex,
						vert: vert2
					}

					let dir0 = vertices[vert1].position.sub(vertices[vert0].position);
					let dir1 = vertices[vert2].position.sub(vertices[vert0].position);
					const normal = vec3.cross(dir0, dir1).normalised();
					faces[faceIndex] = {
						halfEdge: edgeIndex,
						normal: normal,
						distance: vec3.dot(vertices[vert1].position, normal)
					};
				}

				vertOffset += primitive.positions.length / 3;
				edgeOffset += primitive.elements.length;
				faceOffset += triCount;
			}
		}

		// let order0: vec3[] = [];
		// for (let i = 0; i < halfEdges.length; ++i) {
		// 	order0[i] = vertices[halfEdges[i].vert].position;
		// }

		// prune duplicate vertices
		const epsilon = 0.01 * 0.01;
		for (let i = 0; i < vertices.length; ++i) {
			const a = vertices[i];
			for (let j = vertices.length - 1; j >= 0; --j) {
				if (i == j)
					continue;

				let b = vertices[j];
				if (a.position.sqrDist(b.position) < epsilon) {
					// redirect all half edges that point to an index after j
					// down by one
					for (let k = 0; k < halfEdges.length; ++k) {
						const he = halfEdges[k];

						if (he.vert > j) {
							--he.vert;
						} else if (he.vert == j) {
							he.vert = i;
						}
					}

					vertices.splice(j, 1);
				}
			}
		}

		// find twins
		for (let i = 0; i < halfEdges.length; ++i) {
			const he0 = halfEdges[i];
			const he0Next = halfEdges[he0.next];

			for (let j = i + 1; j < halfEdges.length; ++j) {
				const he1 = halfEdges[j];
				const he1Next = halfEdges[he1.next];

				// check if twin
				if (he0Next.vert == he1.vert && he0.vert == he1Next.vert) {
					he0.twin = j;
					he1.twin = i;
					break;
				}
			}
		}

		let mesh = new HalfEdgeMesh();

		mesh.vertices = vertices;
		mesh.halfEdges = halfEdges;
		mesh.faces = faces;

		// let order1: vec3[] = [];
		// for (let i = 0; i < halfEdges.length; ++i) {
		// 	order1[i] = vertices[halfEdges[i].vert].position;
		// 	if (!order0[i].equals(order1[i]))
		// 		console.log("ERROR")
		// }

		return mesh;
	}
}