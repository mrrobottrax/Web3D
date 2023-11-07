import { quaternion, vec3 } from "../../common/math/vector.js";
import { Mesh } from "./mesh.js";
import { Model } from "./model.js";
import { MeshData, PrimitiveData } from "./primitive.js";

export async function loadGlTFFromWeb(url: string): Promise<Model[]> {
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

	let models: Model[] = [];

	// get model from requests
	await Promise.all([promise1, promise2]).then((results) => {
		if (results[0].status != 200 || results[1].status != 200) {
			return models;
		}

		models = loadGltf(JSON.parse(results[0].responseText), [new Uint8Array(results[1].response)], url.substring(0, url.lastIndexOf('/') + 1));
	});

	// fall back when request fails
	// todo: error model
	//if (!result) {
	//	console.error(`Failed to load shader ${vs}, ${fs}`);
	//	shader = initShaderProgram(fallbackVSource, fallbackFSource);
	//}

	return models;
}

export async function loadGlbFromWeb(url: string): Promise<Mesh | null> {
	// send requests
	const req1 = new XMLHttpRequest();

	const promise1 = new Promise<XMLHttpRequest>((resolve) => {
		req1.addEventListener("load", function () { resolve(this); });
	});

	req1.open("GET", url + ".glb");
	req1.send();

	let mesh: Mesh | null = null;

	// get shader from requests
	await promise1.then((result) => {
		if (result.status != 200 || result.status != 200) {
			return null;
		}

		mesh = loadGlb(new Uint8Array(result.response));
	});

	// fall back when request fails
	// todo: error model
	//if (!result) {
	//	console.error(`Failed to load shader ${vs}, ${fs}`);
	//	shader = initShaderProgram(fallbackVSource, fallbackFSource);
	//}

	return mesh;
}

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
function loadGlb(file: Uint8Array): Mesh | null {
	let pos = 0;

	// ~~~~~~ HEADER ~~~~~~~

	// assert magic number
	if (readUInt32(pos, file) != magicNumber) {
		console.error("Failed to load glTF file");
		return null;
	}
	pos += 4;

	if (readUInt32(pos, file) != version) {
		console.error("glTF: bad version");
		return null;
	}
	pos += 4;

	const length = readUInt32(pos, file);
	pos += 4;

	// ~~~~~~ JSON CHUNK ~~~~~~~

	const jsonChunk = readChunk(pos, file);
	if (jsonChunk.chunkType != chunkTypes.JSON) {
		console.error("glTF: bad type");
	}
	pos = jsonChunk.dataPos;

	const json = JSON.parse(new TextDecoder().decode(file.subarray(pos, pos + jsonChunk.chunkLength)));

	// ~~~~~~~ BIN CHUNK ~~~~~~~

	pos += jsonChunk.chunkLength;
	const binChunk = readChunk(pos, file);
	if (binChunk.chunkType != chunkTypes.BIN) {
		console.error("glTF: bad type");
	}
	pos = binChunk.dataPos;

	let buffers = [file.subarray(binChunk.dataPos, binChunk.dataPos + binChunk.chunkLength)];

	// temp: load first primitive
	const p = loadPrimitive(json.meshes[0].primitives[0], json, buffers, "data/models/");
	if (!p) {
		return null;
	}

	const m = new Mesh();
	m.genBuffers([p]);
	return m;
}

function loadGltf(json: any, buffers: Uint8Array[], texPrefix: string): Model[] {
	let meshes = getGltfMeshData(json, buffers, texPrefix);
	let models: Model[] = [];

	for (let i = 0; i < meshes.length; ++i) {
		let m = new Model();
		m.mesh.genBuffers(meshes[i].primitives);
		m.position = meshes[i].translation;
		m.rotation = meshes[i].rotation;
		m.scale = meshes[i].scale;

		models.push(m);
	}

	return models;
}

export function getGltfMeshData(json: any, buffers: Uint8Array[], texPrefix: string): MeshData[] {
	let meshes: MeshData[] = [];

	// load nodes
	for (let j = 0; j < json.scenes[0].nodes.length; ++j) {
		let primitives: PrimitiveData[] = [];
		const index = json.scenes[0].nodes[j];
		const node = json.nodes[index];
		const meshIndex = node.mesh;
		
		for (let i = 0; i < json.meshes[meshIndex].primitives.length; ++i) {
			const p = loadPrimitive(json.meshes[meshIndex].primitives[i], json, buffers, texPrefix);
			if (!p) {
				// todo: return error model
				return [];
			}
			primitives.push(p);
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

		meshes.push({
			primitives: primitives,
			translation: translation,
			rotation: rotation,
			scale: scale
		})
	}

	return meshes;
}

function loadPrimitive(primitive: any, json: any, buffers: Uint8Array[], texPrefix: string): PrimitiveData | null {
	const attributes = primitive.attributes;

	const positionIndex = attributes["POSITION"];
	const texCoordIndex = attributes["TEXCOORD_0"];
	const indicesIndex = primitive["indices"];
	const materialIndex = primitive["material"];

	const positionAccessor = json.accessors[positionIndex];
	const texCoordAccessor = json.accessors[texCoordIndex];
	const indicesAccessor = json.accessors[indicesIndex];

	// asserts
	if (positionAccessor.componentType != componentTypes.FLOAT) {
		console.error("glTF: type error");
		return null;
	}

	if (positionAccessor.type != accessorTypes.VEC3) {
		console.error("glTF: type error");
		return null;
	}

	if (texCoordAccessor.componentType != componentTypes.FLOAT) {
		console.error("glTF: type error");
		return null;
	}

	if (texCoordAccessor.type != accessorTypes.VEC2) {
		console.error("glTF: type error");
		return null;
	}

	if (indicesAccessor.componentType != componentTypes.UNSIGNED_SHORT) {
		console.error("glTF: type error");
		return null;
	}

	if (indicesAccessor.type != accessorTypes.SCALAR) {
		console.error("glTF: type error");
		return null;
	}

	const positionBufferView = json.bufferViews[positionAccessor.bufferView];
	const texCoordBufferView = json.bufferViews[texCoordAccessor.bufferView];
	const indicesBufferView = json.bufferViews[indicesAccessor.bufferView];

	const positionBuffer = new DataView(buffers[positionBufferView.buffer].buffer,
		buffers[positionBufferView.buffer].byteOffset + positionBufferView.byteOffset);
	const texCoordBuffer = new DataView(buffers[texCoordBufferView.buffer].buffer,
		buffers[texCoordBufferView.buffer].byteOffset + texCoordBufferView.byteOffset);
	const indicesBuffer = new DataView(buffers[indicesBufferView.buffer].buffer,
		buffers[indicesBufferView.buffer].byteOffset + indicesBufferView.byteOffset);

	let data = '';
	for (let i = 0; i < positionBuffer.byteLength; ++i) {
		data += positionBuffer.getUint8(i).toString(16) + " ";
	}

	// positions
	let vertices: number[] = [];

	for (let i = 0; i < positionAccessor.count * 3; ++i) {
		vertices[i] = positionBuffer.getFloat32(i * 4, true);
	}

	// positions
	let texCoords: number[] = [];

	for (let i = 0; i < texCoordAccessor.count * 2; ++i) {
		texCoords[i] = texCoordBuffer.getFloat32(i * 4, true);
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
		positions: new Float32Array(vertices),
		texCoords: new Float32Array(texCoords),
		elements: new Uint16Array(indices),
		color: color,

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