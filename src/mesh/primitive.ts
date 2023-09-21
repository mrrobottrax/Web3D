export interface PrimitiveData {
	vertices: Float32Array;
	elements: Uint16Array;
}

export class Primitive {
	vertBuffer: WebGLBuffer;
	elementBuffer: WebGLBuffer;
	elementCount: number;

	constructor(vertBuffer: WebGLBuffer, elementBuffer: WebGLBuffer, elementCount: number) {
		this.vertBuffer = vertBuffer;
		this.elementBuffer = elementBuffer;
		this.elementCount = elementCount;
	}
}