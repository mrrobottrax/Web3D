import { vec3 } from "../math/vector.js";
import { PrimitiveData } from "./primitive.js";

interface Vertex {
	position: vec3;
	halfEdge: number;
}

interface HalfEdge {
	prev: number;
	next: number;
	twin: number;
	face: number;
	vert: number;
}

interface Face {
	normal: vec3;
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

	static fromPrimitive(primitive: PrimitiveData): HalfEdgeMesh {
		// vertices
		const vertCount = primitive.positions.length / 3;
		let vertices: Vertex[] = [];
		for (let i = 0; i < vertCount; ++i) {
			const index = i * 3;
			vertices[i] = {
				position: new vec3(
					primitive.positions[index],
					primitive.positions[index + 1],
					primitive.positions[index + 2]),
				halfEdge: 0
			}
		}

		// faces
		const triCount = primitive.elements.length / 3;
		let faces: Face[] = [];

		// half edges
		let halfEdges: HalfEdge[] = [];
		for (let i = 0; i < triCount; ++i) {
			const index = i * 3;

			const vert0 = primitive.elements[index]
			const vert1 = primitive.elements[index + 1]
			const vert2 = primitive.elements[index + 2]
			vertices[vert0].halfEdge = index;
			halfEdges[index] = {
				prev: index + 2,
				next: index + 1,
				twin: -1,
				face: i,
				vert: vert0
			}
			vertices[vert1].halfEdge = index + 1;
			halfEdges[index + 1] = {
				prev: index,
				next: index + 2,
				twin: -1,
				face: i,
				vert: vert1
			}
			vertices[vert2].halfEdge = index + 2;
			halfEdges[index + 2] = {
				prev: index + 1,
				next: index,
				twin: -1,
				face: i,
				vert: vert2
			}

			let dir0 = vertices[vert1].position.sub(vertices[vert0].position);
			let dir1 = vertices[vert2].position.sub(vertices[vert0].position);
			faces[i] = {
				halfEdge: index,
				normal: vec3.cross(dir0, dir1).normalised()
			};
		}

		let order0: vec3[] = [];
		for (let i = 0; i < halfEdges.length; ++i) {
			order0[i] = vertices[halfEdges[i].vert].position;
		}

		// prune duplicate vertices
		for (let i = 0; i < vertices.length; ++i) {
			const a = vertices[i];
			for (let j = vertices.length - 1; j >= 0; --j) {
				if (i == j)
					continue;

				let b = vertices[j];
				if (a.position.equals(b.position)) {
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

		return mesh;
	}
}