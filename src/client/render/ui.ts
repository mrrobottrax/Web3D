import { mat4 } from "../../common/math/matrix.js";
import { vec3 } from "../../common/math/vector.js";
import { Time } from "../../common/system/time.js";
import { SharedAttribs, gl, glProperties, loadTexture, uiShader } from "./gl.js";
import { uiMatrix } from "./render.js";
import { drawViewmodel, initViewmodel } from "./viewmodel.js";

export let rectVao: WebGLVertexArrayObject | null;
let squareVertsBuffer: WebGLBuffer | null;

const squareVerts: number[] = [
	-0.5, -0.5, 1, 0, 1,
	0.5, -0.5, 1, 1, 1,
	0.5, 0.5, 1, 1, 0,
	-0.5, 0.5, 1, 0, 0,
];

let crossTex: WebGLTexture;
let fontTex: WebGLTexture;
let crossSizeX = 1;
let crossSizeY = 1;

export function initUi() {
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

	loadTexture("data/fonts/arial.png").then((result) => {
		if (result.tex) {
			fontTex = result.tex;
		}
	});
}

export function initUiBuffers() {
	rectVao = gl.createVertexArray();
	gl.bindVertexArray(rectVao);

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
	gl.bindVertexArray(rectVao);

	gl.clear(gl.DEPTH_BUFFER_BIT);

	gl.uniformMatrix4fv(uiShader.projectionMatrixUnif, false, uiMatrix.getData());
	gl.uniform4f(uiShader.colorUnif, 1, 1, 1, 1);
	gl.uniform1i(uiShader.samplerUnif, 0);

	drawViewmodel();
	drawCrosshair();

	gl.bindVertexArray(null);

	drawDebugText();

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

let screenTexts: {
	vao: WebGLVertexArrayObject | null
	triCount: number
	position: vec3
	timer: number
	color: vec3
}[] = [];

function drawDebugText() {
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, fontTex);

	let mat = mat4.identity();
	mat.scale(new vec3(2 * 16 / glProperties.height, 2 * 16 / glProperties.height, 1));

	for (let i = 0; i < screenTexts.length; ++i) {
		const text = screenTexts[i];

		let _mat: mat4 = mat.copy();
		_mat.translate(text.position);

		gl.uniformMatrix4fv(uiShader.modelViewMatrixUnif, false, _mat.getData());

		gl.bindVertexArray(text.vao);
		gl.drawArrays(gl.TRIANGLES, 0, text.triCount);

		text.timer -= Time.deltaTime;
		if (text.timer <= 0) {
			screenTexts.splice(i, 1);
			--i;
		}
	}

	gl.bindVertexArray(null);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

export function drawText(position: vec3, text: string,
	time: number = Time.fixedDeltaTime, color: vec3 = new vec3(1, 1, 1)) {

	// create vao
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const buffer = gl.createBuffer();

	let glyphVerts: number[] = [];
	let vertCount = 0;

	let x = 0;
	for (let i = 0; i < text.length; ++i) {
		const charIndex = text.charCodeAt(i);

		const s = 1 / 16;
		const ox = Math.floor(charIndex % 16) / 16 + 1 / 256;
		const oy = Math.floor(charIndex / 16) / 16 + 1 / 256;

		glyphVerts = glyphVerts.concat([
			-0.5 + x, -0.5, 1, ox, s + oy,
			0.5 + x, -0.5, 1, s + ox, s + oy,
			0.5 + x, 0.5, 1, s + ox, oy,
			-0.5 + x, -0.5, 1, ox, s + oy,
			0.5 + x, 0.5, 1, s + ox, oy,
			-0.5 + x, 0.5, 1, ox, oy,
		]);

		x += 1
		vertCount += 6;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glyphVerts), gl.STATIC_DRAW);

	gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 20, 12);

	gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
	gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);

	gl.bindVertexArray(null);

	screenTexts.push({
		vao: vao,
		triCount: vertCount,
		position: position,
		timer: time,
		color: color
	});
}