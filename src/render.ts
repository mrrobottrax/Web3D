import { defaultShader, gl } from "./gl.js";

let vertBuffer: WebGLBuffer | null;
let elementBuffer: WebGLBuffer | null;

const cubeVerts = [
	-1, -1, -1,
	-1, -1, 1,
	-1, 1, -1,
	-1, 1, 1,
	1, -1, -1,
	1, -1, 1,
	1, 1, -1,
	1, 1, 1,
]

const cubeElements = [
	0, 1, 4,
	1, 5, 4,

	6, 3, 2,
	6, 7, 3,

	4, 5, 6,
	5, 7, 6,

	0, 6, 2,
	0, 4, 6,

	0, 2, 6,
	6, 2, 3,

	5, 1, 3,
	7, 5, 3,
]

export function drawInit(): void {
	vertBuffer = gl.createBuffer();
	elementBuffer = gl.createBuffer();
	if (!vertBuffer || !elementBuffer) {
		console.error("Error creating buffer")
		return;
	}

	gl.useProgram(defaultShader.program)
	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(cubeElements), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.useProgram(null);
}

export function drawFrame(): void {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(defaultShader.program);
	gl.enableVertexAttribArray(0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);

	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	])

	gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	])

	gl.drawElements(gl.TRIANGLES, cubeElements.length, gl.UNSIGNED_BYTE, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.disableVertexAttribArray(0);
	gl.useProgram(null);
}