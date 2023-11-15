import { mat4 } from "../../common/math/matrix.js";
import { quaternion, vec3 } from "../../common/math/vector.js";
import { SharedAttribs, gl, loadTexture, solidTex } from "../render/gl.js";
import { HierarchyNode, Model, NodeData, Primitive, PrimitiveData } from "./model.js";
import { textures } from "./textures.js";

export async function loadGltfFromWeb(url: string): Promise<Model> {
	// send requests
	const req1 = new XMLHttpRequest();
	const req2 = new XMLHttpRequest();

	const promise1 = new Promise<XMLHttpRequest>((resolve) => {
		req1.addEventListener("load", function () { resolve(this); });
	});
	const promise2 = new Promise<XMLHttpRequest>((resolve) => {
		req2.addEventListener("load", function () { resolve(this); });
	});

	req1.open("GET", url + ".gltf");
	req1.send();
	req2.responseType = "arraybuffer";
	req2.open("GET", url + ".bin");
	req2.send();

	let model = new Model();

	// get model from requests
	await Promise.all([promise1, promise2]).then((results) => {
		if (results[0].status != 200 || results[1].status != 200) {
			return model;
		}

		model = loadGltf(JSON.parse(results[0].responseText), [new Uint8Array(results[1].response)], url.substring(0, url.lastIndexOf('/') + 1));
	});

	// todo: error model

	return model;
}

// export async function loadGlbFromWeb(url: string): Promise<Mesh | null> {
// 	// send requests
// 	const req1 = new XMLHttpRequest();

// 	const promise1 = new Promise<XMLHttpRequest>((resolve) => {
// 		req1.addEventListener("load", function () { resolve(this); });
// 	});

// 	req1.open("GET", url + ".glb");
// 	req1.send();

// 	let mesh: Mesh | null = null;

// 	// get shader from requests
// 	await promise1.then((result) => {
// 		if (result.status != 200 || result.status != 200) {
// 			return null;
// 		}

// 		mesh = loadGlb(new Uint8Array(result.response));
// 	});

// 	// fall back when request fails
// 	// todo: error model
// 	//if (!result) {
// 	//	console.error(`Failed to load shader ${vs}, ${fs}`);
// 	//	shader = initShaderProgram(fallbackVSource, fallbackFSource);
// 	//}

// 	return mesh;
// }

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

function loadGltf(json: any, buffers: Uint8Array[], texPrefix: string): Model {
	let nodeData: NodeData[] = getGltfNodes(json, buffers, texPrefix);
	let baseNodes: number[] = json.scenes[0].nodes;

	let model = new Model();
	model.nodes.length = nodeData.length;
	for (let i = 0; i < nodeData.length; ++i) {
		model.nodes[i] = {
			translation: nodeData[i].translation,
			rotation: nodeData[i].rotation,
			scale: nodeData[i].scale,
			primitives: genBuffers(nodeData[i].primitives),
			skinned: false
		}
	}

	const createChildRecursive = (node: number, parent: HierarchyNode | null = null) => {
		let newNode: HierarchyNode = {
			node: node,
			children: []
		}
		if (!parent) {
			model.hierarchy.push(newNode);
		} else {
			parent.children.push(newNode)
		}

		for (let i = 0; i < nodeData[node].children.length; ++i) {
			createChildRecursive(nodeData[node].children[i], newNode);
		}
	}

	for (let i = 0; i < baseNodes.length; ++i) {
		createChildRecursive(i);
	}

	return model;

	// let rootModels: GameObject[] = [];
	// let nodeToModel: GameObject[] = [];
	// nodeToModel.length = meshes.length;

	// // set up children
	// const nodes = json.scenes[0].nodes;
	// for (let i = 0; i < nodes.length; ++i) {
	// 	const createModelRecursive = (index: number, parent: Transform | null = null): GameObject => {
	// 		let renderer;
	// 		let prop;
	// 		const meshData = meshes[index];

	// 		if (meshData.primitives.length == 0) {
	// 			prop = new GameObject();
	// 		} else if (meshData.skinned) {
	// 			renderer = new SkinnedMeshRenderer();
	// 			renderer.inverseBindMatrices = meshData.inverseBindMatrices;
	// 			renderer.mesh.genBuffers(meshData.primitives);

	// 			prop = new SkinnedProp();
	// 			prop.meshRenderer = renderer;
	// 		} else {
	// 			renderer = new StaticMeshRenderer();
	// 			renderer.mesh.genBuffers(meshData.primitives);

	// 			prop = new StaticProp();
	// 			prop.meshRenderer = renderer;
	// 		}

	// 		prop.transform.parent = parent;
	// 		prop.transform.position = meshData.translation;
	// 		prop.transform.rotation = meshData.rotation;
	// 		prop.transform.scale = meshData.scale;

	// 		prop.transform.children.length = meshData.children.length;
	// 		for (let j = 0; j < meshData.children.length; ++j) {
	// 			prop.transform.children[j] = createModelRecursive(meshData.children[j], prop.transform).transform;
	// 		}

	// 		nodeToModel[index] = prop;

	// 		return prop;
	// 	}

	// 	rootModels.push(createModelRecursive(nodes[i]));
	// }

	// // set up joints
	// for (let i = 0; i < nodeToModel.length; ++i) {
	// 	if (meshes[i].skinned) {
	// 		// remove skinned mesh parent
	// 		const parent = nodeToModel[i].transform.parent;
	// 		if (parent) {
	// 			const childIndex = parent.children.indexOf(nodeToModel[i].transform);
	// 			parent.children.splice(childIndex, 1);
	// 			parent.parent?.children.push(nodeToModel[i].transform);
	// 			nodeToModel[i].transform.parent = parent.parent;
	// 		}

	// 		let joints: Transform[] = [];
	// 		joints.length = meshes[i].joints.length;
	// 		for (let j = 0; j < meshes[i].joints.length; ++j) {
	// 			joints[j] = nodeToModel[meshes[i].joints[j]].transform;
	// 		}
	// 		(nodeToModel[i] as SkinnedProp).meshRenderer.joints = joints;
	// 	}
	// }

	// let baseModel

	// // animations
	// if (json.animations) {
	// 	baseModel = new AnimatedGameObject();
	// 	baseModel.animations = [];
	// 	baseModel.animations.length = json.animations.length;
	// 	for (let i = 0; i < json.animations.length; ++i) {
	// 		const anim = json.animations[i];
	// 		let animation = new Animation(anim.name);

	// 		let maxTime = 0;
	// 		for (let i = 0; i < anim.channels.length; ++i) {
	// 			const channel = anim.channels[i];
	// 			const target = channel.target;
	// 			const sampler = anim.samplers[channel.sampler];

	// 			const targetObject = nodeToModel[target.node];

	// 			const inAccessor = json.accessors[sampler.input];
	// 			const outAccessor = json.accessors[sampler.output];

	// 			const inBufferView = json.bufferViews[inAccessor.bufferView];
	// 			const outBufferView = json.bufferViews[outAccessor.bufferView];

	// 			let channelObj = new AnimationChannel(targetObject, target.path);

	// 			const inBuffer = new DataView(buffers[inBufferView.buffer].buffer,
	// 				buffers[inBufferView.buffer].byteOffset + inBufferView.byteOffset);
	// 			const outBuffer = new DataView(buffers[outBufferView.buffer].buffer,
	// 				buffers[outBufferView.buffer].byteOffset + outBufferView.byteOffset);

	// 			channelObj.keyframes.length = inAccessor.count;
	// 			for (let i = 0; i < inAccessor.count; ++i) {
	// 				const t = inBuffer.getFloat32(i * 4, true);

	// 				let value;

	// 				switch (channelObj.targetChannel) {
	// 					case ChannelTarget.translation:
	// 						value = new vec3(
	// 							outBuffer.getFloat32(i * 12, true),
	// 							outBuffer.getFloat32(i * 12 + 4, true),
	// 							outBuffer.getFloat32(i * 12 + 8, true)
	// 						);
	// 						break;
	// 					case ChannelTarget.rotation:
	// 						value = new quaternion(
	// 							outBuffer.getFloat32(i * 16 + 12, true),
	// 							outBuffer.getFloat32(i * 16, true),
	// 							outBuffer.getFloat32(i * 16 + 4, true),
	// 							outBuffer.getFloat32(i * 16 + 8, true)
	// 						);
	// 						break;
	// 					case ChannelTarget.scale:
	// 						value = new vec3(
	// 							outBuffer.getFloat32(i * 12, true),
	// 							outBuffer.getFloat32(i * 12 + 4, true),
	// 							outBuffer.getFloat32(i * 12 + 8, true)
	// 						);
	// 						break;
	// 					case ChannelTarget.weights:
	// 						console.error("Weights not implemented");
	// 						return baseModel;

	// 					default:
	// 						console.error("Unknown target");
	// 						return baseModel;
	// 				}

	// 				maxTime = Math.max(maxTime, t);

	// 				channelObj.keyframes[i] = {
	// 					time: t,
	// 					value: value
	// 				}
	// 			}
	// 			animation.channels.push(channelObj);
	// 		}
	// 		animation.length = maxTime;
	// 		baseModel.animations[i] = animation;
	// 		baseModel.controller = new AnimationController();
	// 	}
	// } else {
	// 	baseModel = new GameObject();
	// }

	// for (let i = 0; i < rootModels.length; ++i) {
	// 	baseModel.transform.children[i] = rootModels[i].transform;
	// 	baseModel.transform.children[i].parent = baseModel.transform;
	// }

	// return baseModel;
}

function genBuffers(data: PrimitiveData[]): Primitive[] {
	let primitives: Primitive[] = [];
	primitives.length = data.length;

	for (let i = 0; i < data.length; ++i) {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);

		const vBuffer: WebGLBuffer | null = gl.createBuffer();
		const eBuffer: WebGLBuffer | null = gl.createBuffer();

		if (!vBuffer || !eBuffer || !vao) {
			console.error("Error creating buffer")
			return [];
		}

		// get textures
		let t: WebGLTexture[] = [];
		primitives[i] = new Primitive(
			vao,
			t,
			data[i].elements.length,
			data[i].color
		);
		if (data[i].textureUris.length > 0) {
			for (let j = 0; j < data[i].textureUris.length; ++j) {
				const url = data[i].textureUris[0];

				const textureLoaded = textures[url] !== undefined;

				if (textureLoaded) {
					t[j] = textures[url];
				} else {
					loadTexture(url).then((result) => {
						textures[url] = result.tex;
						if (!result.tex) {
							return;
						}
						primitives[i].textures[j] = result.tex;
					});
				}
			}
		} else {
			primitives[i].textures = [solidTex];
		}

		let length = data[i].positions.length + data[i].texCoords.length;

		if (data[i].skinned) {
			length += data[i].boneIds.length + data[i].weights.length;
		}

		let vertData = new Uint8Array(length);

		// merge into one array
		const vertCount = data[i].positions.length / 3;
		for (let j = 0; j < vertCount; ++j) {
			const index = j * (data[i].skinned ? 40 : 20);
			const posIndex = j * 12;
			const texIndex = j * 8;
			const boneIdIndex = j * 4;
			const weightIndex = j * 16;

			let offset = 0;
			for (let k = 0; k < 12; ++k) {
				vertData[index + offset] = data[i].positions[posIndex + k];
				++offset;
			}

			for (let k = 0; k < 8; ++k) {
				vertData[index + offset] = data[i].texCoords[texIndex + k];
				++offset
			}

			if (data[i].skinned) {
				for (let k = 0; k < 4; ++k) {
					vertData[index + offset] = data[i].boneIds[boneIdIndex + k];
					++offset
				}

				for (let k = 0; k < 16; ++k) {
					vertData[index + offset] = data[i].weights[weightIndex + k];
					++offset
				}
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data[i].elements, gl.STATIC_DRAW);

		if (data[i].skinned) {
			gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 40, 0);
			gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 40, 12);
			gl.vertexAttribPointer(SharedAttribs.boneIdsAttrib, 4, gl.UNSIGNED_BYTE, false, 40, 20);
			gl.vertexAttribPointer(SharedAttribs.boneWeightsAttrib, 4, gl.FLOAT, false, 40, 24);

			gl.enableVertexAttribArray(SharedAttribs.boneIdsAttrib);
			gl.enableVertexAttribArray(SharedAttribs.boneWeightsAttrib);
		} else {
			gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 20, 0);
			gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 20, 12);
		}

		gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
		gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);

		gl.bindVertexArray(null);
	}

	return primitives;
}

function getErrorData(): NodeData[] {
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

export function getGltfNodes(json: any, buffers: Uint8Array[], texPrefix: string): NodeData[] {
	let meshes: NodeData[] = [];
	meshes.length = json.nodes.length;

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
				const p = loadPrimitive(json.meshes[meshIndex].primitives[i], json, buffers, texPrefix, skinned);
				if (!p) {
					// todo: return error model
					return getErrorData();
				}
				primitives.push(p);
			}

			if (skinned) {
				joints = json.skins[node.skin].joints;

				// load inverse bind matrices
				const inverseBindMatricesAccessor = json.accessors[json.skins[node.skin].inverseBindMatrices];
				if (!assertAccessor(inverseBindMatricesAccessor, componentTypes.FLOAT, accessorTypes.MAT4))
					return getErrorData();

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

		meshes[j] = meshData;
	}

	return meshes;
}

function assertAccessor(accessor: any, componentType: number, accessorType: string): boolean {
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

function loadPrimitive(primitive: any, json: any, buffers: Uint8Array[], texPrefix: string, skinned: boolean = false): PrimitiveData | null {
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
	if (!assertAccessor(positionAccessor, componentTypes.FLOAT, accessorTypes.VEC3)) {
		return null;
	}

	if (!assertAccessor(texCoordAccessor, componentTypes.FLOAT, accessorTypes.VEC2)) {
		return null;
	}

	if (!assertAccessor(indicesAccessor, componentTypes.UNSIGNED_SHORT, accessorTypes.SCALAR)) {
		return null;
	}

	if (skinned) {
		if (!assertAccessor(boneIdsAccessor, componentTypes.UNSIGNED_BYTE, accessorTypes.VEC4)) {
			return null;
		}

		if (!assertAccessor(weightsAccessor, componentTypes.FLOAT, accessorTypes.VEC4)) {
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
	const uris: string[] = [];
	if (materialIndex != undefined && json.materials) {
		const material = json.materials[materialIndex];
		const baseColorTex = material["pbrMetallicRoughness"]["baseColorTexture"];
		const baseColorFactor = material["pbrMetallicRoughness"]["baseColorFactor"];
		if (baseColorTex) {
			const baseColorIndex = material["pbrMetallicRoughness"]["baseColorTexture"].index;
			const baseColorSource = json.textures[baseColorIndex].source;
			const baseColorImage = json.images[baseColorSource];
			uris.push(texPrefix + baseColorImage.uri);
		} else {
			uris.push("data/levels/textures/dev.png");
		}
		if (baseColorFactor) {
			color = baseColorFactor;
		}
	} else {
		uris.push("data/levels/textures/dev.png");
	}

	let p: PrimitiveData = {
		positions: new Uint8Array(new Float32Array(vertices).buffer),
		texCoords: new Uint8Array(new Float32Array(texCoords).buffer),
		elements: new Uint16Array(indices),
		color: color,
		boneIds: new Uint8Array(boneIds),
		weights: new Uint8Array(new Float32Array(weights).buffer),
		skinned: skinned,

		textureUris: uris
	};

	return p;
}

function readChunk(position: number, file: Uint8Array) {
	return {
		chunkLength: readUInt32(position, file),
		chunkType: readUInt32(position + 4, file),
		dataPos: position + 8,
	};
}

function readUInt32(position: number, file: Uint8Array): number {
	let num = new Uint32Array(1);

	for (let i = 3; i >= 0; --i) {
		num[0] = num[0] << 8;
		num[0] |= file[position + i];
	}

	return num[0];
}