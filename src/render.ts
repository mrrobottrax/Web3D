import { defaultShader, gl, glProperties } from "./gl.js";
import { deg2Rad } from "./math.js";

const nearClip = 0.3;
const farClip = 1000;

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
	4, 1, 0,
	4, 5, 1,

	2, 3, 6,
	3, 7, 6,

	6, 5, 4,
	6, 7, 5,

	2, 6, 0,
	6, 4, 0,

	6, 2, 0,
	3, 2, 6,

	3, 1, 5,
	3, 5, 7,
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

	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false,
		calcPerspectiveMatrix(80, glProperties.width, glProperties.height));

	gl.useProgram(null);
}

export function drawFrame(): void {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(defaultShader.program);
	gl.enableVertexAttribArray(0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);

	gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		-2, -2, -5, 1,
	])

	gl.drawElements(gl.TRIANGLES, cubeElements.length, gl.UNSIGNED_BYTE, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.disableVertexAttribArray(0);
	gl.useProgram(null);
}

function calcPerspectiveMatrix(fov: number, width: number, height: number): number[] {
	const scale = getFrustumScale(fov);

	let matrix = [
		scale * (height / width), 0, 0, 0,
		0, scale, 0, 0,
		0, 0, (farClip + nearClip) / (nearClip - farClip), -1,
		0, 0, (2 * farClip * nearClip) / (nearClip - farClip), 0,
	]

	return matrix;
}

function getFrustumScale(fov: number): number {
	return 1 / Math.tan(deg2Rad(fov) / 2);
}