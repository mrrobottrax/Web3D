import { Entity } from "../entitysystem/entity.js";
import { BinaryReader } from "../file/readtypes.js";
import { Edge, Face, HalfEdge, HalfEdgeMesh, Vertex } from "../mesh/halfedge.js";
import { Primitive } from "../mesh/model.js";

export class Level extends Entity {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	staticMeshes: Primitive[] = [];
	textureTable: any;

	static getCollisionData(file: Uint8Array, offsets: any): HalfEdgeMesh {
		// todo: +1?
		const subArray = file.subarray(offsets.collision, offsets.lastIndex + 1);

		let index = 0;

		// edges
		const edges: Edge[] = [];
		edges.length = BinaryReader.readUInt32(index, subArray);
		index += 4;

		for (let i = 0; i < edges.length; ++i) {
			const halfEdge = BinaryReader.readUInt32(index, subArray)
			index += 4;

			edges[i] = {
				halfEdge: halfEdge
			};
		}

		// faces
		const faces: Face[] = [];
		faces.length = BinaryReader.readUInt32(index, subArray);
		index += 4;

		for (let i = 0; i < faces.length; ++i) {
			const distance = BinaryReader.readFloat32(index, subArray);
			index += 4;
			const halfEdge = BinaryReader.readUInt32(index, subArray);
			index += 4;
			const normal = BinaryReader.readVec3(index, subArray);
			index += 12;

			faces[i] = {
				distance: distance,
				halfEdge: halfEdge,
				normal: normal
			}
		}

		// half edge
		const hEdges: HalfEdge[] = [];
		hEdges.length = BinaryReader.readUInt32(index, subArray);
		index += 4;

		for (let i = 0; i < hEdges.length; ++i) {
			const face = BinaryReader.readUInt32(index, subArray);
			index += 4;
			const next = BinaryReader.readUInt32(index, subArray);
			index += 4;
			const prev = BinaryReader.readUInt32(index, subArray);
			index += 4;
			const twin = BinaryReader.readUInt32(index, subArray);
			index += 4;
			const vert = BinaryReader.readUInt32(index, subArray);
			index += 4;

			hEdges[i] = {
				face: face,
				next: next,
				prev: prev,
				twin: twin,
				vert: vert
			}
		}

		// vertices
		const vertices: Vertex[] = [];
		vertices.length = BinaryReader.readUInt32(index, subArray);
		index += 4;

		for (let i = 0; i < vertices.length; ++i) {
			const halfEdge = BinaryReader.readUInt32(index, subArray);
			index += 4;
			const position = BinaryReader.readVec3(index, subArray);
			index += 12;

			vertices[i] = {
				halfEdge: halfEdge,
				position: position
			}
		}

		let mesh = new HalfEdgeMesh();

		mesh.edges = edges;
		mesh.faces = faces;
		mesh.halfEdges = hEdges;
		mesh.vertices = vertices;

		return mesh;
	}

	static getOffsetsTable(file: Uint8Array): any {
		// read until null byte
		let index = 0;
		while (file[index] != 0) {
			++index;
		}

		const subArray = file.subarray(0, index);

		const decoder = new TextDecoder();
		let table = JSON.parse(decoder.decode(subArray));

		for (const [key, value] of Object.entries(table)) {
			if (typeof value == "number")
				table[key] += index + 1;
		}

		return table;
	}
}

export let currentLevel: Level | null;

export function clearCurrentLevel() {
	// todo: clear memory

	currentLevel = new Level();
}