import { SharedAttribs, gl, uiShader } from "./gl.js";
import { uiMatrix } from "./render.js";
import { drawViewmodel, initViewmodel } from "./viewmodel.js";

let vao: WebGLVertexArrayObject | null;
let squareVertsBuffer: WebGLBuffer | null;

const squareVerts: number[] = [
	-0.5, -0.5, 1, 0, 1,
	0.5, -0.5, 1, 1, 1,
	0.5, 0.5, 1, 1, 0,
	-0.5, 0.5, 1, 0, 0,
];

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

	initViewmodel();
}

export function drawUi() {
	gl.useProgram(uiShader.program);
	gl.bindVertexArray(vao);
	
	gl.uniformMatrix4fv(uiShader.projectionMatrixUnif, false, uiMatrix.getData());
	gl.uniform4f(uiShader.colorUnif, 1, 1, 1, 1);
	gl.uniform1i(uiShader.samplerUnif, 0);
	
	drawViewmodel();

	gl.bindVertexArray(null);
	gl.useProgram(null);
}