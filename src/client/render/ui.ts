import { mat4 } from "../../common/math/matrix.js";
import { vec3 } from "../../common/math/vector.js";
import { SharedAttribs, gl, glProperties, loadTexture, uiShader } from "./gl.js";
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

let crossTex: WebGLTexture;
let crossSizeX = 1;
let crossSizeY = 1;

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

	loadTexture("data/textures/cross.png").then((result) => {
		if (result.tex) {
			crossTex = result.tex;
			let oldOnload = result.image.onload;

			result.image.onload = function (ev) {
				if (oldOnload) {
					oldOnload.call(this, ev);
				}
				crossSizeX = result.image.width;
				crossSizeY = result.image.height;
			};


		}
	});
}

export function drawUi() {
	gl.useProgram(uiShader.program);
	gl.bindVertexArray(vao);

	gl.clear(gl.DEPTH_BUFFER_BIT);

	gl.uniformMatrix4fv(uiShader.projectionMatrixUnif, false, uiMatrix.getData());
	gl.uniform4f(uiShader.colorUnif, 1, 1, 1, 1);
	gl.uniform1i(uiShader.samplerUnif, 0);

	drawViewmodel();
	drawCrosshair();

	gl.bindVertexArray(null);
	gl.useProgram(null);
}

function drawCrosshair() {
	let mat;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, crossTex);

	mat = mat4.identity();

	mat.scale(new vec3(2 * crossSizeX / glProperties.height, 2 * crossSizeY / glProperties.height, 1));

	gl.uniformMatrix4fv(uiShader.modelViewMatrixUnif, false, mat.getData());
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

	gl.bindTexture(gl.TEXTURE_2D, null);
}