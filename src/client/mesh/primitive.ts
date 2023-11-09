import { mat4 } from "../../common/math/matrix.js";
import { quaternion, vec3 } from "../../common/math/vector.js";

export interface MeshData {
	translation: vec3;
	rotation: quaternion;
	scale: vec3;

	children: number[];

	skinned: boolean;
	joints: number[];
	inverseBindMatrices: mat4[];

	primitives: PrimitiveData[];
}

export interface PrimitiveData {
	positions: Float32Array;
	texCoords: Float32Array;
	elements: Uint16Array;
	weights: Float32Array;
	boneIds: Uint8Array;
	color: number[];

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