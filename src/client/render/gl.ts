import { createSolidTexture } from "../mesh/texture.js";
import { debugTimers, updateUiMaterix } from "./render.js";

export let glProperties = {
	width: 0,
	height: 0,
	offsetX: 0,
	offsetY: 0,
	resolutionChanged: false
}
export let gl: WebGL2RenderingContext;

export enum SharedAttribs {
	positionAttrib,
	texCoordAttrib,
	boneIdsAttrib,
	boneWeightsAttrib,
	colorAttrib,
}

// ~~~~~~~~~~~~~ shaders ~~~~~~~~~~~~~~

export interface ShaderBase {
	program: WebGLProgram | null;
}

export interface UninstancedShaderBase extends ShaderBase {
	program: WebGLProgram | null;
	modelViewMatrixUnif: WebGLUniformLocation | null;
	projectionMatrixUnif: WebGLUniformLocation | null;
	colorUnif: WebGLUniformLocation | null;
}

export interface UninstancedTextureShaderBase extends ShaderBase {
	program: WebGLProgram | null;
	modelViewMatrixUnif: WebGLUniformLocation | null;
	projectionMatrixUnif: WebGLUniformLocation | null;
	samplerUnif: WebGLUniformLocation | null;
	colorUnif: WebGLUniformLocation | null;
}

interface InstancedShaderBase extends ShaderBase {
	program: WebGLProgram | null;
	modelViewMatrixAttrib: number | null;
	projectionMatrixUnif: WebGLUniformLocation | null;
	samplerAttrib: number | null;
}

export let solidShader: UninstancedTextureShaderBase = {
	program: null,
	modelViewMatrixUnif: null,
	projectionMatrixUnif: null,
	samplerUnif: null,
	colorUnif: null
};

export let fallbackShader: UninstancedTextureShaderBase = {
	program: null,
	modelViewMatrixUnif: null,
	projectionMatrixUnif: null,
	samplerUnif: null,
	colorUnif: null
};

interface WorldShader extends UninstancedTextureShaderBase {
	fogColorUnif: WebGLUniformLocation | null;
	fogNearUnif: WebGLUniformLocation | null;
	fogFarUnif: WebGLUniformLocation | null;
}

interface DefaultShader extends WorldShader {
}
export let defaultShader: DefaultShader = {
	program: null,
	modelViewMatrixUnif: null,
	samplerUnif: null,
	projectionMatrixUnif: null,
	colorUnif: null,
	fogColorUnif: null,
	fogNearUnif: null,
	fogFarUnif: null
};

export interface SkinnedShaderBase extends WorldShader {
	boneMatricesUnif: WebGLUniformLocation | null
}
export let skinnedShader: SkinnedShaderBase = {
	program: null,
	modelViewMatrixUnif: null,
	samplerUnif: null,
	projectionMatrixUnif: null,
	colorUnif: null,
	boneMatricesUnif: null,
	fogColorUnif: null,
	fogNearUnif: null,
	fogFarUnif: null
};

interface UiShader extends UninstancedTextureShaderBase {
}
export let uiShader: UiShader = {
	program: null,
	modelViewMatrixUnif: null,
	projectionMatrixUnif: null,
	samplerUnif: null,
	colorUnif: null
};

// ~~~~~~~~~~~~~ default / fallbacks ~~~~~~~~~~~~~~

export const fallBackShaders = {
	// vertex shader program
	fallbackVSource: `
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`,

	// fragment shader program
	fallbackFSource: `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
`,

	// vertex shader program
	solidVSource: `
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`,

	// fragment shader program
	solidFSource: `
precision mediump float;
uniform vec4 uColor;
void main() {
  gl_FragColor = uColor;
}
`
}

// ~~~~~~~~~~~~~ init ~~~~~~~~~~~~~~

export let canvas: HTMLCanvasElement;
export let canvasContainer: HTMLElement;

export let lineBuffer: WebGLBuffer | null;
export let lineVao: WebGLVertexArrayObject | null;
export async function initGl(): Promise<void> {
	initCanvas();
	initializeGl();
	initDefaultShaders();
	await initGameShaders();
	initLineBuffer();
}

export function initDefaultShaders() {
	// create fallback program
	const fallbackProgram: WebGLProgram | null = initShaderProgram(fallBackShaders.fallbackVSource, fallBackShaders.fallbackFSource);
	if (!fallbackProgram) {
		console.error("Failed to init fallback shader");
		return;
	}
	fallbackShader.program = fallbackProgram;

	const solidProgram: WebGLProgram | null = initShaderProgram(fallBackShaders.solidVSource, fallBackShaders.solidFSource);
	if (!solidProgram) {
		console.error("Failed to init solid shader");
		return;
	}
	solidShader.program = solidProgram;

	// create default solid texture
	createSolidTexture();

	// get shader locations
	fallbackShader.modelViewMatrixUnif = gl.getUniformLocation(fallbackShader.program, "uModelViewMatrix");
	fallbackShader.projectionMatrixUnif = gl.getUniformLocation(fallbackShader.program, "uProjectionMatrix");

	solidShader.modelViewMatrixUnif = gl.getUniformLocation(solidShader.program, "uModelViewMatrix");
	solidShader.projectionMatrixUnif = gl.getUniformLocation(solidShader.program, "uProjectionMatrix");
	solidShader.colorUnif = gl.getUniformLocation(solidShader.program, "uColor");
}

async function initGameShaders() {
	// create remaining shader programs
	await Promise.all<WebGLProgram>([
		initProgramFromWeb("data/shaders/default/default.vert", "data/shaders/default/default.frag"),
		initProgramFromWeb("data/shaders/default/ui.vert", "data/shaders/default/ui.frag"),
		initProgramFromWeb("data/shaders/default/default_skinned.vert", "data/shaders/default/default.frag"),
	]).then((results) => {
		defaultShader.program = results[0];
		uiShader.program = results[1];
		skinnedShader.program = results[2];
	});

	if (!defaultShader.program || !uiShader.program || !skinnedShader.program)
		return;

	defaultShader.modelViewMatrixUnif = gl.getUniformLocation(defaultShader.program, "uModelViewMatrix");
	defaultShader.projectionMatrixUnif = gl.getUniformLocation(defaultShader.program, "uProjectionMatrix");
	defaultShader.samplerUnif = gl.getUniformLocation(defaultShader.program, "uSampler");
	defaultShader.colorUnif = gl.getUniformLocation(defaultShader.program, "uColor");
	defaultShader.fogColorUnif = gl.getUniformLocation(defaultShader.program, "uFogColor");
	defaultShader.fogNearUnif = gl.getUniformLocation(defaultShader.program, "uFogNear");
	defaultShader.fogFarUnif = gl.getUniformLocation(defaultShader.program, "uFogFar");

	uiShader.modelViewMatrixUnif = gl.getUniformLocation(uiShader.program, "uModelViewMatrix");
	uiShader.projectionMatrixUnif = gl.getUniformLocation(uiShader.program, "uProjectionMatrix");
	uiShader.samplerUnif = gl.getUniformLocation(uiShader.program, "uSampler");
	uiShader.colorUnif = gl.getUniformLocation(uiShader.program, "uColor");

	skinnedShader.modelViewMatrixUnif = gl.getUniformLocation(skinnedShader.program, "uModelViewMatrix");
	skinnedShader.projectionMatrixUnif = gl.getUniformLocation(skinnedShader.program, "uProjectionMatrix");
	skinnedShader.samplerUnif = gl.getUniformLocation(skinnedShader.program, "uSampler");
	skinnedShader.colorUnif = gl.getUniformLocation(skinnedShader.program, "uColor");
	skinnedShader.boneMatricesUnif = gl.getUniformLocation(skinnedShader.program, "uBoneMatrices");
	skinnedShader.fogColorUnif = gl.getUniformLocation(skinnedShader.program, "uFogColor");
	skinnedShader.fogNearUnif = gl.getUniformLocation(skinnedShader.program, "uFogNear");
	skinnedShader.fogFarUnif = gl.getUniformLocation(skinnedShader.program, "uFogFar");
}

export function initCanvas() {
	const c: HTMLCanvasElement | null = document.querySelector("#game");
	const cont: HTMLElement | null = document.querySelector("#game-container");

	if (!(c && cont)) {
		console.error("Could not find canvas");
		return;
	}

	canvas = c;
	canvasContainer = cont;
}

export function initializeGl() {
	// initialize gl context
	const _gl: WebGL2RenderingContext | null = canvas.getContext("webgl2", {
		antialias: false,
		alpha: true,
	});

	// only continue if WebGL is available and working
	if (!_gl) {
		alert(
			"Unable to initialize WebGL. Your browser or machine may not support it.",
		);
		return;
	}

	gl = _gl;

	// clear
	gl.clearColor(0.15, 0.15, 0.15, 1.0);
	gl.clearDepth(1.0);

	// depth
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	// cull
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	// blend
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// defaults
	gl.vertexAttrib4f(SharedAttribs.boneIdsAttrib, 0, 0, 0, 0);
	gl.vertexAttrib4f(SharedAttribs.boneWeightsAttrib, 0, 0, 0, 0);
	gl.vertexAttrib4f(SharedAttribs.colorAttrib, 1, 1, 1, 1);
	gl.vertexAttrib4f(SharedAttribs.positionAttrib, 0, 0, 0, 1);
	gl.vertexAttrib2f(SharedAttribs.texCoordAttrib, 0, 0);
}

export function resizeCanvas() {
	const ratio = window.devicePixelRatio;
	const cssWidth = canvasContainer.clientWidth;
	const cssHeight = canvasContainer.clientHeight;
	const width = ratio * cssWidth;
	const height = ratio * cssHeight;

	if (glProperties.width == width && glProperties.height == height) {
		return;
	}

	glProperties.width = width;
	glProperties.height = height;
	glProperties.offsetX = canvas.offsetLeft * ratio;
	glProperties.offsetY = window.innerHeight - (canvas.offsetTop * ratio + glProperties.height);

	canvas.width = canvasContainer.clientWidth * ratio; // apparently using stored vars doesn't work???
	canvas.height = canvasContainer.clientHeight * ratio;

	glProperties.resolutionChanged = true;

	gl.viewport(0, 0, width, height);

	updateUiMaterix();
}

export function glEndFrame() {
	glProperties.resolutionChanged = false;

	debugTimers();
}

// ~~~~~~~~~~~~~ load shader program from web urls ~~~~~~~~~~~~~~

export async function initProgramFromWeb(vs: string, fs: string): Promise<WebGLProgram | null> {
	// send requests
	const reqV = new XMLHttpRequest();
	const reqF = new XMLHttpRequest();

	const promiseV = new Promise<XMLHttpRequest>((resolve) => {
		reqV.addEventListener("load", function () { resolve(this); });
	});

	const promiseF = new Promise<XMLHttpRequest>((resolve) => {
		reqF.addEventListener("load", function () { resolve(this); });
	});

	reqV.open("GET", vs);
	reqF.open("GET", fs);

	reqV.send();
	reqF.send();

	var shader: WebGLProgram | null = null;

	// get shader from requests
	await Promise.all<XMLHttpRequest>([promiseV, promiseF]).then((results) => {
		if (results[0].status != 200 || results[1].status != 200) {
			return null;
		}

		shader = initShaderProgram(results[0].responseText, results[1].responseText);
	});

	// fall back when request fails
	if (!shader) {
		console.error(`Failed to load shader ${vs}, ${fs}`);
		shader = initShaderProgram(fallBackShaders.fallbackVSource, fallBackShaders.fallbackFSource);
	}

	return shader;
}

// ~~~~~~~~~~~~~ create shader program ~~~~~~~~~~~~~~

export function initShaderProgram(vsSource: string, fsSource: string): WebGLProgram | null {
	const vertexShader: WebGLShader | null = loadShader(gl.VERTEX_SHADER, vsSource);
	const fragmentShader: WebGLShader | null = loadShader(gl.FRAGMENT_SHADER, fsSource);

	if (!vertexShader || !fragmentShader)
		return null;

	// create the shader program

	const shaderProgram: WebGLProgram | null = gl.createProgram();
	if (!shaderProgram)
		return null;

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);

	gl.bindAttribLocation(shaderProgram, SharedAttribs.positionAttrib, "aVertexPosition");
	gl.bindAttribLocation(shaderProgram, SharedAttribs.texCoordAttrib, "aTexCoord");
	gl.bindAttribLocation(shaderProgram, SharedAttribs.boneIdsAttrib, "aBoneIds");
	gl.bindAttribLocation(shaderProgram, SharedAttribs.boneWeightsAttrib, "aBoneWeights");
	gl.bindAttribLocation(shaderProgram, SharedAttribs.colorAttrib, "aColor");

	gl.linkProgram(shaderProgram);

	// if creating the shader program failed, alert

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert(
			`Unable to initialize the shader program: ${gl.getProgramInfoLog(
				shaderProgram,
			)}`,
		);
		return null;
	}

	return shaderProgram;
}

export function initLineBuffer() {
	lineVao = gl.createVertexArray();
	gl.bindVertexArray(lineVao);

	lineBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 1]), gl.DYNAMIC_DRAW);
	gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindVertexArray(null);
}

// ~~~~~~~~~~~~~ load shader from text ~~~~~~~~~~~~~~

function loadShader(type: number, source: string): WebGLShader | null {
	const shader: WebGLShader | null = gl.createShader(type);
	if (!shader) {
		console.error("Failed to create shader");
		return null;
	}

	// send the source to the shader object

	gl.shaderSource(shader, source);

	// compile the shader program

	gl.compileShader(shader);

	// see if it compiled successfully

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(
			`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
		);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}