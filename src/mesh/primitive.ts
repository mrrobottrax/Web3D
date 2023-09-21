export interface PrimitiveData {
	positions: Float32Array;
	texCoords: Float32Array;
	elements: Uint16Array;
}

export class Primitive {
	vao: WebGLVertexArrayObject;
	elementCount: number;

	constructor(vao: WebGLVertexArrayObject, elementCount: number) {
		this.vao = vao;
		this.elementCount = elementCount;
	}
}