import { Primitive } from "../../common/mesh/model.js";
import { BinaryReader } from "../../common/file/readtypes.js";
import { loadPrimitiveTexture, solidTex } from "../mesh/textures.js";
import { Level, clearCurrentLevel, currentLevel } from "../../common/entities/level.js";
import { gl, SharedAttribs } from "../render/gl.js";

export async function setLevelClient(url: string): Promise<void> {
	const req = new XMLHttpRequest();
	const promise = new Promise<XMLHttpRequest>((resolve) => {
		req.addEventListener("load", function () { resolve(this); });
	});

	req.open("GET", url + ".glvl");
	req.responseType = "arraybuffer";
	req.send();

	const res = await promise;

	if (res.status != 200) {
		console.error("Failed to load level");
		return;
	}

	const file = new Uint8Array(res.response);

	const offsets = Level.getOffsetsTable(file);
	clearCurrentLevel();

	if (!currentLevel) {
		console.error("ERROR CHANGING LEVEL");
		return;
	}

	currentLevel.textureTable = getTextureTable(file, offsets);

	// currentLevel.collision = file.collision;
	currentLevel.collision = Level.getCollisionData(file, offsets);
	currentLevel.staticMeshes = getLevelPrimitives(file, offsets);
	Level.getEntityData(file, offsets);
}

function getTextureTable(file: Uint8Array, offsets: any): any {
	const start = offsets.textureTable + offsets.base;
	const subArray = file.subarray(start, start + offsets.textureTableSize);
	
	const decoder = new TextDecoder();
	const table = JSON.parse(decoder.decode(subArray));

	return table;
}

function getLevelPrimitives(file: Uint8Array, offsets: any): Primitive[] {
	let primitives: Primitive[] = [];

	const start = offsets.glMeshData + offsets.base;
	const end = start + offsets.glMeshDataSize;
	let index: number = start;

	while (index < end) {
		const texId = BinaryReader.readUInt16(index, file);
		index += 2;
		const vertLength = BinaryReader.readUInt32(index, file);
		index += 4;
		const elementLength = BinaryReader.readUInt32(index, file);
		index += 4;

		const p = createPrimitive(file, index, vertLength, elementLength, texId);
		if (p) {
			primitives.push(p);
		}

		index += vertLength + elementLength;
	}

	return primitives;
}

function createPrimitive(file: Uint8Array, index: number, vertLength: number, elementLength: number, texId: number): Primitive | null {
	const vao = gl.createVertexArray();

	const vBuffer: WebGLBuffer | null = gl.createBuffer();
	const eBuffer: WebGLBuffer | null = gl.createBuffer();

	if (!vBuffer || !eBuffer || !vao) {
		console.error("Error creating buffer");

		gl.deleteVertexArray(vao);
		gl.deleteBuffer(vBuffer);
		gl.deleteBuffer(eBuffer);

		return null;
	}

	const verts = file.subarray(index, index + vertLength);
	index += vertLength;
	const elements = file.subarray(index, index + elementLength);
	index += elementLength;

	gl.bindVertexArray(vao);

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);

	gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 32, 0);
	gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 32, 12);
	gl.vertexAttribPointer(SharedAttribs.colorAttrib, 3, gl.FLOAT, false, 32, 20);

	gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
	gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);
	gl.enableVertexAttribArray(SharedAttribs.colorAttrib);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindVertexArray(null);

	let p = new Primitive(vao, vBuffer, eBuffer, solidTex, elements.length / 2, [1, 1, 1, 1]);
	if (currentLevel)
		loadPrimitiveTexture(currentLevel.textureTable[texId], p);

	return p;
}

export { currentLevel };
