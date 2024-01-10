import { AnimationChannel, ChannelTarget, Animation } from "./animation.js";
import { HierarchyNode, Model, NodeData, Primitive, PrimitiveData } from "./model.js";
import { mat4 } from "../math/matrix.js";
import { quaternion, vec3 } from "../math/vector.js";
import { BinaryReader } from "../file/readtypes.js";

const magicNumber: number = 1179937895;
const version: number = 2;
const chunkTypes = {
	JSON: 0x4E4F534A,
	BIN: 0x004E4942
}
const componentTypes = {
	BYTE: 5120,
	UNSIGNED_BYTE: 5121,
	SHORT: 5122,
	UNSIGNED_SHORT: 5123,
	UNSIGNED_INT: 5125,
	FLOAT: 5126,
}
const accessorTypes = {
	SCALAR: "SCALAR",
	VEC2: "VEC2",
	VEC3: "VEC3",
	VEC4: "VEC4",
	MAT2: "MAT2",
	MAT3: "MAT3",
	MAT4: "MAT4",
}

export abstract class GltfLoader {

	// function loadGlb(file: Uint8Array): Mesh | null {
	// 	let pos = 0;

	// 	// ~~~~~~ HEADER ~~~~~~~

	// 	// assert magic number
	// 	if (readUInt32(pos, file) != magicNumber) {
	// 		console.error("Failed to load glTF file");
	// 		return null;
	// 	}
	// 	pos += 4;

	// 	if (readUInt32(pos, file) != version) {
	// 		console.error("glTF: bad version");
	// 		return null;
	// 	}
	// 	pos += 4;

	// 	const length = readUInt32(pos, file);
	// 	pos += 4;

	// 	// ~~~~~~ JSON CHUNK ~~~~~~~

	// 	const jsonChunk = readChunk(pos, file);
	// 	if (jsonChunk.chunkType != chunkTypes.JSON) {
	// 		console.error("glTF: bad type");
	// 	}
	// 	pos = jsonChunk.dataPos;

	// 	const json = JSON.parse(new TextDecoder().decode(file.subarray(pos, pos + jsonChunk.chunkLength)));

	// 	// ~~~~~~~ BIN CHUNK ~~~~~~~

	// 	pos += jsonChunk.chunkLength;
	// 	const binChunk = readChunk(pos, file);
	// 	if (binChunk.chunkType != chunkTypes.BIN) {
	// 		console.error("glTF: bad type");
	// 	}
	// 	pos = binChunk.dataPos;

	// 	let buffers = [file.subarray(binChunk.dataPos, binChunk.dataPos + binChunk.chunkLength)];

	// 	// temp: load first primitive
	// 	const p = loadPrimitive(json.meshes[0].primitives[0], json, buffers, "data/models/");
	// 	if (!p) {
	// 		return null;
	// 	}

	// 	const m = new Mesh();
	// 	m.genBuffers([p]);
	// 	return m;
	// }

	static async loadGltf(json: any, buffers: Uint8Array[], texPrefix: string): Promise<Model> {
		let nodeData: NodeData[] = this.getGltfNodes(json, buffers, texPrefix);
		let baseNodes: number[] = json.scenes[0].nodes;

		// get vertex data
		let model = new Model();
		model.nodes.length = nodeData.length;
		for (let i = 0; i < nodeData.length; ++i) {
			model.nodes[i] = {
				translation: nodeData[i].translation,
				rotation: nodeData[i].rotation,
				scale: nodeData[i].scale,
				primitives: await this.genBuffers(nodeData[i].primitives),
				skinned: nodeData[i].skinned
			}

			if (nodeData[i].skinned) {
				model.nodes[i].inverseBindMatrices = nodeData[i].inverseBindMatrices;
				model.nodes[i].joints = nodeData[i].joints;
			}
		}

		// hierarchy
		const createChildRecursive = (node: number, parent: HierarchyNode | null = null) => {
			let newNode: HierarchyNode = {
				index: node,
				children: []
			}
			if (!parent) {
				model.hierarchy.push(newNode);
			} else {
				parent.children.push(newNode)
			}

			for (let i = 0; i < nodeData[node].children.length; ++i) {
				const next = nodeData[nodeData[node].children[i]];
				if (next.skinned) {
					// skip parent on skinned nodes (glTF spec for some reason)
					createChildRecursive(nodeData[node].children[i], parent);
				} else {
					createChildRecursive(nodeData[node].children[i], newNode);
				}
			}
		}

		for (let i = 0; i < baseNodes.length; ++i) {
			createChildRecursive(baseNodes[i]);
		}

		// animations
		if (json.animations) {
			model.animations = [];
			model.animations.length = json.animations.length;
			for (let i = 0; i < json.animations.length; ++i) {
				const anim = json.animations[i];
				let animation = new Animation(anim.name);

				let maxTime = 0;
				for (let i = 0; i < anim.channels.length; ++i) {
					const channel = anim.channels[i];
					const target = channel.target;
					const sampler = anim.samplers[channel.sampler];

					const inAccessor = json.accessors[sampler.input];
					const outAccessor = json.accessors[sampler.output];

					const inBufferView = json.bufferViews[inAccessor.bufferView];
					const outBufferView = json.bufferViews[outAccessor.bufferView];

					let channelObj = new AnimationChannel(target.node, target.path);

					const inBuffer = new DataView(buffers[inBufferView.buffer].buffer,
						buffers[inBufferView.buffer].byteOffset + inBufferView.byteOffset);
					const outBuffer = new DataView(buffers[outBufferView.buffer].buffer,
						buffers[outBufferView.buffer].byteOffset + outBufferView.byteOffset);

					channelObj.keyframes.length = inAccessor.count;
					for (let i = 0; i < inAccessor.count; ++i) {
						const t = inBuffer.getFloat32(i * 4, true);

						let value;

						switch (channelObj.targetChannel) {
							case ChannelTarget.translation:
								value = new vec3(
									outBuffer.getFloat32(i * 12, true),
									outBuffer.getFloat32(i * 12 + 4, true),
									outBuffer.getFloat32(i * 12 + 8, true)
								);
								break;
							case ChannelTarget.rotation:
								value = new quaternion(
									outBuffer.getFloat32(i * 16 + 12, true),
									outBuffer.getFloat32(i * 16, true),
									outBuffer.getFloat32(i * 16 + 4, true),
									outBuffer.getFloat32(i * 16 + 8, true)
								);
								break;
							case ChannelTarget.scale:
								value = new vec3(
									outBuffer.getFloat32(i * 12, true),
									outBuffer.getFloat32(i * 12 + 4, true),
									outBuffer.getFloat32(i * 12 + 8, true)
								);
								break;
							case ChannelTarget.weights:
								console.error("Weights not implemented");
								return model;

							default:
								console.error("Unknown target");
								return model;
						}

						maxTime = Math.max(maxTime, t);

						channelObj.keyframes[i] = {
							time: t,
							value: value
						}
					}
					animation.channels.push(channelObj);
				}
				animation.length = maxTime;
				model.animations[i] = animation;
			}
		}

		return model;
	}

	static async genBuffers(primitives: PrimitiveData[]): Promise<Primitive[]> { return [] };

	static getErrorData(): NodeData[] {
		// todo: return error model
		return [{
			primitives: [],
			translation: vec3.origin(),
			rotation: quaternion.identity(),
			scale: new vec3(1, 1, 1),
			children: [],
			joints: [],
			skinned: false,
			inverseBindMatrices: [],
		}];
	}

	static getGltfNodes(json: any, buffers: Uint8Array[], texPrefix: string): NodeData[] {
		let data: NodeData[] = [];
		data.length = json.nodes.length;

		// load nodes
		for (let j = 0; j < json.nodes.length; ++j) {
			const node = json.nodes[j];

			let skinned = false;
			let joints: number[] = [];
			let inverseBindMatrices: mat4[] = [];

			if (node.skin != null)
				skinned = true;

			let primitives: PrimitiveData[] = [];
			if (node.mesh != null) {

				const meshIndex = node.mesh;
				for (let i = 0; i < json.meshes[meshIndex].primitives.length; ++i) {
					const p = this.loadPrimitive(json.meshes[meshIndex].primitives[i], json, buffers, texPrefix, skinned);
					if (!p) {
						// todo: return error model
						return this.getErrorData();
					}
					primitives.push(p);
				}

				if (skinned) {
					joints = json.skins[node.skin].joints;

					// load inverse bind matrices
					const inverseBindMatricesAccessor = json.accessors[json.skins[node.skin].inverseBindMatrices];
					if (!this.assertAccessor(inverseBindMatricesAccessor, componentTypes.FLOAT, accessorTypes.MAT4))
						return this.getErrorData();

					const inverseBindMatricesBufferView = json.bufferViews[inverseBindMatricesAccessor.bufferView];
					const buffer = new DataView(buffers[inverseBindMatricesBufferView.buffer].buffer,
						buffers[inverseBindMatricesBufferView.buffer].byteOffset + inverseBindMatricesBufferView.byteOffset);

					inverseBindMatrices.length = inverseBindMatricesAccessor.count;
					for (let i = 0; i < inverseBindMatricesAccessor.count; ++i) {
						inverseBindMatrices[i] = new mat4(0);
						for (let row = 0; row < 4; ++row) {
							for (let column = 0; column < 4; ++column) {
								const float = buffer.getFloat32((i * 16 + row + column * 4) * 4, true);
								inverseBindMatrices[i].setValue(column, row, float);
							}
						}
					}
				}
			}

			let translation = vec3.origin();
			let rotation = quaternion.identity();
			let scale = new vec3(1, 1, 1);

			const t = node.translation;
			if (t) {
				translation.x = t[0];
				translation.y = t[1];
				translation.z = t[2];
			}

			const r = node.rotation;
			if (r) {
				rotation.x = r[0];
				rotation.y = r[1];
				rotation.z = r[2];
				rotation.w = r[3];
			}

			const s = node.scale;
			if (s) {
				scale.x = s[0];
				scale.y = s[1];
				scale.z = s[2];
			}

			let children: number[] = node.children;
			if (!children) {
				children = [];
			}
			const meshData: NodeData = {
				primitives: primitives,
				translation: translation,
				rotation: rotation,
				scale: scale,
				children: children,
				skinned: skinned,
				joints: joints,
				inverseBindMatrices: inverseBindMatrices,
			};

			data[j] = meshData;
		}

		return data;
	}

	static assertAccessor(accessor: any, componentType: number, accessorType: string): boolean {
		if (accessor.componentType != componentType) {
			console.error("glTF: type error");
			return false;
		}
		if (accessor.type != accessorType) {
			console.error("glTF: type error");
			return false;
		}

		return true;
	}

	static loadPrimitive(primitive: any, json: any, buffers: Uint8Array[], texPrefix: string, skinned: boolean = false): PrimitiveData | null {
		const attributes = primitive.attributes;

		const positionIndex = attributes["POSITION"];
		const texCoordIndex = attributes["TEXCOORD_0"];
		const indicesIndex = primitive["indices"];
		const materialIndex = primitive["material"];

		const positionAccessor = json.accessors[positionIndex];
		const texCoordAccessor = json.accessors[texCoordIndex];
		const indicesAccessor = json.accessors[indicesIndex];

		let boneIdsAccessor;
		let weightsAccessor;

		if (skinned) {
			const boneIdsIndex = attributes["JOINTS_0"];
			boneIdsAccessor = json.accessors[boneIdsIndex];

			const weightsIndex = attributes["WEIGHTS_0"];
			weightsAccessor = json.accessors[weightsIndex];
		}

		// asserts
		if (!this.assertAccessor(positionAccessor, componentTypes.FLOAT, accessorTypes.VEC3)) {
			return null;
		}

		if (!this.assertAccessor(texCoordAccessor, componentTypes.FLOAT, accessorTypes.VEC2)) {
			return null;
		}

		if (!this.assertAccessor(indicesAccessor, componentTypes.UNSIGNED_SHORT, accessorTypes.SCALAR)) {
			return null;
		}

		if (skinned) {
			if (!this.assertAccessor(boneIdsAccessor, componentTypes.UNSIGNED_BYTE, accessorTypes.VEC4)) {
				return null;
			}

			if (!this.assertAccessor(weightsAccessor, componentTypes.FLOAT, accessorTypes.VEC4)) {
				return null;
			}
		}

		const positionBufferView = json.bufferViews[positionAccessor.bufferView];
		const texCoordBufferView = json.bufferViews[texCoordAccessor.bufferView];
		const indicesBufferView = json.bufferViews[indicesAccessor.bufferView];

		let boneIdsBufferView;
		let weightsBufferView;

		if (skinned) {
			boneIdsBufferView = json.bufferViews[boneIdsAccessor.bufferView];
			weightsBufferView = json.bufferViews[weightsAccessor.bufferView];
		}

		const positionBuffer = new DataView(buffers[positionBufferView.buffer].buffer,
			buffers[positionBufferView.buffer].byteOffset + positionBufferView.byteOffset);
		const texCoordBuffer = new DataView(buffers[texCoordBufferView.buffer].buffer,
			buffers[texCoordBufferView.buffer].byteOffset + texCoordBufferView.byteOffset);
		const indicesBuffer = new DataView(buffers[indicesBufferView.buffer].buffer,
			buffers[indicesBufferView.buffer].byteOffset + indicesBufferView.byteOffset);

		let boneIdsBuffer;
		let weightsBuffer;

		if (skinned) {
			boneIdsBuffer = new DataView(buffers[boneIdsBufferView.buffer].buffer,
				buffers[boneIdsBufferView.buffer].byteOffset + boneIdsBufferView.byteOffset);
			weightsBuffer = new DataView(buffers[weightsBufferView.buffer].buffer,
				buffers[weightsBufferView.buffer].byteOffset + weightsBufferView.byteOffset);
		}

		// positions
		let vertices: number[] = [];
		for (let i = 0; i < positionAccessor.count * 3; ++i) {
			vertices[i] = positionBuffer.getFloat32(i * 4, true);
		}

		// tex coords
		let texCoords: number[] = [];
		for (let i = 0; i < texCoordAccessor.count * 2; ++i) {
			texCoords[i] = texCoordBuffer.getFloat32(i * 4, true);
		}

		// bone ids
		let boneIds: number[] = [];
		if (skinned && boneIdsBuffer) {
			for (let i = 0; i < boneIdsAccessor.count * 4; ++i) {
				boneIds[i] = boneIdsBuffer.getUint8(i);
			}
		}

		// weights
		let weights: number[] = [];
		if (skinned && weightsBuffer) {
			for (let i = 0; i < weightsAccessor.count * 4; ++i) {
				weights[i] = weightsBuffer.getFloat32(i * 4, true);
			}
		}

		// indices
		let indices: number[] = [];
		for (let i = 0; i < indicesAccessor.count; ++i) {
			indices[i] = indicesBuffer.getUint16(i * 2, true);
		}

		let color: number[] = [1, 1, 1, 1];

		// material
		let uri: string;
		if (materialIndex != undefined && json.materials) {
			const material = json.materials[materialIndex];
			const baseColorTex = material["pbrMetallicRoughness"]["baseColorTexture"];
			const baseColorFactor = material["pbrMetallicRoughness"]["baseColorFactor"];
			if (baseColorTex) {
				const baseColorIndex = material["pbrMetallicRoughness"]["baseColorTexture"].index;
				const baseColorSource = json.textures[baseColorIndex].source;
				const baseColorImage = json.images[baseColorSource];
				uri = texPrefix + baseColorImage.uri;
			} else {
				uri = "data/levels/textures/dev.png";
			}
			if (baseColorFactor) {
				color = baseColorFactor;
			}
		} else {
			uri = "data/levels/textures/dev.png";
		}

		let p: PrimitiveData = {
			positions: new Uint8Array(new Float32Array(vertices).buffer),
			texCoords: new Uint8Array(new Float32Array(texCoords).buffer),
			elements: new Uint16Array(indices),
			color: color,
			boneIds: new Uint8Array(boneIds),
			weights: new Uint8Array(new Float32Array(weights).buffer),
			skinned: skinned,

			textureUri: uri
		};

		return p;
	}

	static readChunk(position: number, file: Uint8Array) {
		return {
			chunkLength: BinaryReader.readUInt32(position, file),
			chunkType: BinaryReader.readUInt32(position + 4, file),
			dataPos: position + 8,
		};
	}
}