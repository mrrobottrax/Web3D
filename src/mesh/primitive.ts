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

	constructor(vao: WebGLVertexArrayObject, textures: WebGLTexture[], elementCount: number) {
		this.vao = vao;
		this.textures = textures;
		this.elementCount = elementCount;
	}
}