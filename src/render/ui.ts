import { mat4 } from "../math/matrix.js";
import { vec3 } from "../math/vector.js";
import { SharedAttribs, gl, loadTexture, uiShader } from "./gl.js";
import { uiMatrix } from "./render.js";

let vao: WebGLVertexArrayObject | null;
let squareVertsBuffer: WebGLBuffer | null;

const squareVerts: number[] = [
	-0.5, -0.5, 1, 0, 1,
	0.5, -0.5, 1, 1, 1,
	0.5, 0.5, 1, 1, 0,
	-0.5, 0.5, 1, 0, 0,
];

let viewModelLocation = new vec3(0.8, -0.65, 0);
let viewModelScale = new vec3(0.75, 0.75, 0.75);

let gunTex: WebGLTexture;

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

	loadTexture("data/textures/fire0.png").then(
		(value) => {
			if (value) {
				gunTex = value;
			}
		}
	);
}

export function drawUi() {
	gl.useProgram(uiShader.program);
	gl.bindVertexArray(vao);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, gunTex);
	
	gl.uniformMatrix4fv(uiShader.projectionMatrixUnif, false, uiMatrix.getData());
	gl.uniform4f(uiShader.colorUnif, 1, 1, 1, 1);
	gl.uniform1i(uiShader.samplerUnif, 0);
	
	let mat;
	
	// draw viewmodel
	mat = mat4.identity();
	mat.translate(viewModelLocation);
	mat.scale(viewModelScale);
	gl.uniformMatrix4fv(uiShader.modelViewMatrixUnif, false, mat.getData());
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	
	gl.bindTexture(gl.TEXTURE_2D, null);

	gl.bindVertexArray(null);
	gl.useProgram(null);
}