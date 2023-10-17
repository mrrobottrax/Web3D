import { mat4 } from "../math/matrix.js";
import { vec3 } from "../math/vector.js";
import { SharedAttribs, gl, uiShader } from "./gl.js";
import { uiMatrix } from "./render.js";

let vao: WebGLVertexArrayObject | null;
let squareVertsBuffer: WebGLBuffer | null;

const squareVerts: number[] = [
	-0.5, -0.5, 1, -1, -1,
	0.5, -0.5, 1, 1, -1,
	0.5, 0.5, 1, 1, 1,
	-0.5, 0.5, 1, -1, 1,
];

let viewModelLocation = new vec3(0, 0, 0);

export function initUi() {
	vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	squareVertsBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVerts), gl.STATIC_DRAW);

	gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 20, 12);

	gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
	gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);

	gl.bindVertexArray(null);
}

export function drawUi() {
	gl.useProgram(uiShader.program);
	gl.bindVertexArray(vao);

	gl.uniformMatrix4fv(uiShader.projectionMatrixUnif, false, uiMatrix.getData());
	gl.uniform4f(uiShader.colorUnif, 1, 1, 1, 1);
	gl.uniform1i(uiShader.samplerUnif, 0);

	let mat;
	
	// draw viewmodel
	mat = mat4.identity();
	mat.translate(viewModelLocation);
	gl.uniformMatrix4fv(uiShader.modelViewMatrixUnif, false, mat.getData());
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

	gl.bindVertexArray(null);
	gl.useProgram(null);
}