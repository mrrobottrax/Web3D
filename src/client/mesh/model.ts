import { mat4 } from "../../common/math/matrix.js";
import { quaternion, vec3 } from "../../common/math/vector.js";
import { gl } from "../render/gl.js";

export interface HierarchyNode {
	node: number;
	children: HierarchyNode[];
}

export class Model {
	hierarchy: HierarchyNode[] = [];
	nodes: Node[] = [];

	// genBuffers(data: PrimitiveData[]) {

	// 	this.primitives = [];

	// 	for (let i = 0; i < data.length; ++i) {
	// 		const vao = gl.createVertexArray();
	// 		gl.bindVertexArray(vao);

	// 		const vBuffer: WebGLBuffer | null = gl.createBuffer();
	// 		const eBuffer: WebGLBuffer | null = gl.createBuffer();

	// 		if (!vBuffer || !eBuffer || !vao) {
	// 			console.error("Error creating buffer")
	// 			return;
	// 		}

	// 		// get textures
	// 		let t: WebGLTexture[] = [];
	// 		this.primitives.push(new Primitive(
	// 			vao,
	// 			t,
	// 			data[i].elements.length,
	// 			data[i].color
	// 		));
	// 		if (data[i].textureUris.length > 0) {
	// 			for (let j = 0; j < data[i].textureUris.length; ++j) {
	// 				const url = data[i].textureUris[0];

	// 				const textureLoaded = textures[url] !== undefined;

	// 				if (textureLoaded) {
	// 					t[j] = textures[url];
	// 				} else {
	// 					loadTexture(url).then((result) => {
	// 						textures[url] = result.tex;
	// 						if (!result.tex) {
	// 							return;
	// 						}
	// 						this.primitives[i].textures[j] = result.tex;
	// 					});
	// 				}
	// 			}
	// 		} else {
	// 			this.primitives[i].textures = [solidTex];
	// 		}

	// 		let length = data[i].positions.length + data[i].texCoords.length;

	// 		if (data[i].skinned) {
	// 			length += data[i].boneIds.length + data[i].weights.length;
	// 		}

	// 		let vertData = new Uint8Array(length);

	// 		// merge into one array
	// 		const vertCount = data[i].positions.length / 3;
	// 		for (let j = 0; j < vertCount; ++j) {
	// 			const index = j * (data[i].skinned ? 40 : 20);
	// 			const posIndex = j * 12;
	// 			const texIndex = j * 8;
	// 			const boneIdIndex = j * 4;
	// 			const weightIndex = j * 16;

	// 			let offset = 0;
	// 			for (let k = 0; k < 12; ++k) {
	// 				vertData[index + offset] = data[i].positions[posIndex + k];
	// 				++offset;
	// 			}

	// 			for (let k = 0; k < 8; ++k) {
	// 				vertData[index + offset] = data[i].texCoords[texIndex + k];
	// 				++offset
	// 			}

	// 			if (data[i].skinned) {
	// 				for (let k = 0; k < 4; ++k) {
	// 					vertData[index + offset] = data[i].boneIds[boneIdIndex + k];
	// 					++offset
	// 				}

	// 				for (let k = 0; k < 16; ++k) {
	// 					vertData[index + offset] = data[i].weights[weightIndex + k];
	// 					++offset
	// 				}
	// 			}
	// 		}

	// 		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	// 		gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.STATIC_DRAW);

	// 		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
	// 		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data[i].elements, gl.STATIC_DRAW);

	// 		if (data[i].skinned) {
	// 			gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 40, 0);
	// 			gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 40, 12);
	// 			gl.vertexAttribPointer(SharedAttribs.boneIdsAttrib, 4, gl.UNSIGNED_BYTE, false, 40, 20);
	// 			gl.vertexAttribPointer(SharedAttribs.boneWeightsAttrib, 4, gl.FLOAT, false, 40, 24);

	// 			gl.enableVertexAttribArray(SharedAttribs.boneIdsAttrib);
	// 			gl.enableVertexAttribArray(SharedAttribs.boneWeightsAttrib);
	// 		} else {
	// 			gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 20, 0);
	// 			gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 20, 12);
	// 		}

	// 		gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
	// 		gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);

	// 		gl.bindVertexArray(null);
	// 	}
	// }
}

export interface Node {
	translation: vec3;
	rotation: quaternion;
	scale: vec3;

	primitives: Primitive[];

	skinned: boolean;
	joints?: number[];
	inverseBindMatrices?: mat4[];
}

export interface NodeData {
	translation: vec3;
	rotation: quaternion;
	scale: vec3;

	children: number[];

	primitives: PrimitiveData[];

	skinned: boolean;
	joints?: number[];
	inverseBindMatrices?: mat4[];
}

export interface PrimitiveData {
	positions: Uint8Array;
	texCoords: Uint8Array;
	elements: Uint16Array;
	weights: Uint8Array;
	boneIds: Uint8Array;
	color: number[];
	skinned: boolean;

	textureUris: string[];
}

export class Primitive {
	vao: WebGLVertexArrayObject;
	textures: WebGLTexture[];
	elementCount: number;
	color: number[];

	constructor(vao: WebGLVertexArrayObject, textures: WebGLTexture[], elementCount: number, color: number[]) {
		this.vao = vao;
		this.textures = textures;
		this.elementCount = elementCount;
		this.color = color;
	}
}