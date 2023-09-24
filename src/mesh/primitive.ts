import { quaternion, vec3 } from "../math/vector.js";

export interface MeshData {
	translation: vec3;
	rotation: quaternion;
	scale: vec3;

	primitives: PrimitiveData[];
}

export interface PrimitiveData {
	positions: Float32Array;
	texCoords: Float32Array;
	elements: Uint16Array;

	textureUris: string[];
}

export class Primitive {
	vao: WebGLVertexArrayObject;
	textures: WebGLTexture[];
	elementCount: number;
	color: number[];

	constructor(vao: WebGLVertexArrayObject, textures: WebGLTexture[], elementCount: number) {
		this.vao = vao;
		this.textures = textures;
		this.elementCount = elementCount;
		this.color = [1, 1, 1, 1];
	}
}