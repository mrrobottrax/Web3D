import { Entity } from "../entitysystem/entity.js";
import { BinaryReader } from "../file/readtypes.js";
import { quaternion, vec3 } from "../math/vector.js";
import { Edge, Face, HalfEdge, HalfEdgeMesh, Vertex } from "../mesh/halfedge.js";
import { Primitive } from "../mesh/model.js";
import { PlayerSpawn } from "./playerSpawn.js";

export class Level extends Entity {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	staticMeshes: Primitive[] = [];
	spawns: PlayerSpawn[] = [];
	textureTable: any;

	static getCollisionData(file: Uint8Array, offsets: any): HalfEdgeMesh {
		const start = offsets.collision + offsets.base;
		const subArray = file.subarray(start, start + offsets.collisionSize);

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

	static getEntityData(file: Uint8Array, offsets: any) {
		const start = offsets.entities + offsets.base;
		const subArray = file.subarray(start, start + offsets.entitiesSize);

		const decoder = new TextDecoder();
		const json = JSON.parse(decoder.decode(subArray));

		for (const entityAny of json) {
			this.createEntity(entityAny);
		}
	}

	private static createEntity(entityAny: any): Entity | null {
		const setupTransform = (entity: Entity) => {
			const originStrings = (entityAny.keyvalues.origin as string).split(" ");
			const originVec = new vec3(parseFloat(originStrings[0]), parseFloat(originStrings[1]), parseFloat(originStrings[2]));

			entity.transform.translation = originVec;

			const rotationStrings = (entityAny.keyvalues.angles as string).split(" ");
			const rotation = quaternion.euler(parseFloat(rotationStrings[0]), parseFloat(rotationStrings[1]), parseFloat(rotationStrings[2]));

			entity.transform.rotation = rotation;

			if (entityAny.keyvalues.scale) {
				const scaleStrings = (entityAny.keyvalues.scale as string).split(" ");
				const scale = new vec3(parseFloat(scaleStrings[0]), parseFloat(scaleStrings[1]), parseFloat(scaleStrings[2]));

				entity.transform.scale = scale;
			}
		}

		switch (entityAny.classname) {
			case "player_spawn":
				const spawnEntity = new PlayerSpawn();
				setupTransform(spawnEntity);
				spawnEntity.team = entityAny.keyvalues.team;
				currentLevel?.spawns.push(spawnEntity);
				return spawnEntity;
			default:
				console.error("UNKNOWN CLASSNAME: " + entityAny.classname)
				return null;
		}
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
		table.base = index + 1;

		// for (const [key, value] of Object.entries(table)) {
		// 	if (typeof value == "number")
		// 		table[key] += index + 1;
		// }

		return table;
	}
}

export let currentLevel: Level | null;

export function clearCurrentLevel() {
	// todo: clear memory

	currentLevel = new Level();
}