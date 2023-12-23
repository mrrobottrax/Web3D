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
	samplerUnif: WebGLUniformLocation | null;
	colorUnif: WebGLUniformLocation | null;
}

interface InstancedShaderBase extends ShaderBase {
	program: WebGLProgram | null;
	modelViewMatrixAttrib: number | null;
	projectionMatrixUnif: WebGLUniformLocation | null;
	samplerAttrib: number | null;
}

export let solidShader: UninstancedShaderBase = {
	program: null,
	modelViewMatrixUnif: null,
	projectionMatrixUnif: null,
	samplerUnif: null,
	colorUnif: null
};

export let fallbackShader: UninstancedShaderBase = {
	program: null,
	modelViewMatrixUnif: null,
	projectionMatrixUnif: null,
	samplerUnif: null,
	colorUnif: null
};

interface DefaultShader extends UninstancedShaderBase {
}
export let defaultShader: DefaultShader = {
	program: null,
	modelViewMatrixUnif: null,
	samplerUnif: null,
	projectionMatrixUnif: null,
	colorUnif: null
};

export interface SkinnedShaderBase extends UninstancedShaderBase {
	boneMatricesUnif: WebGLUniformLocation | null
}
export let skinnedShader: SkinnedShaderBase = {
	program: null,
	modelViewMatrixUnif: null,
	samplerUnif: null,
	projectionMatrixUnif: null,
	colorUnif: null,
	boneMatricesUnif: null
};

interface UiShader extends UninstancedShaderBase {
}
export let uiShader: UiShader = {
	program: null,
	modelViewMatrixUnif: null,
	projectionMatrixUnif: null,
	samplerUnif: null,
	colorUnif: null
};

// ~~~~~~~~~~~~~ default / fallbacks ~~~~~~~~~~~~~~

export let solidTex: WebGLTexture;

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
		initProgramFromWeb("data/shaders/default/default_skinned.vert", "data/shaders/default/default_skinned.frag"),
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

	uiShader.modelViewMatrixUnif = gl.getUniformLocation(uiShader.program, "uModelViewMatrix");
	uiShader.projectionMatrixUnif = gl.getUniformLocation(uiShader.program, "uProjectionMatrix");
	uiShader.samplerUnif = gl.getUniformLocation(uiShader.program, "uSampler");
	uiShader.colorUnif = gl.getUniformLocation(uiShader.program, "uColor");

	skinnedShader.modelViewMatrixUnif = gl.getUniformLocation(skinnedShader.program, "uModelViewMatrix");
	skinnedShader.projectionMatrixUnif = gl.getUniformLocation(skinnedShader.program, "uProjectionMatrix");
	skinnedShader.samplerUnif = gl.getUniformLocation(skinnedShader.program, "uSampler");
	skinnedShader.colorUnif = gl.getUniformLocation(skinnedShader.program, "uColor");
	skinnedShader.boneMatricesUnif = gl.getUniformLocation(skinnedShader.program, "uBoneMatrices");
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

	gl.clearColor(0.15, 0.15, 0.15, 1.0);
	gl.clearDepth(1.0);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
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
	lineBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 1]), gl.DYNAMIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
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

// ~~~~~~~~~~~~~ default solid texture ~~~~~~~~~~~~~~

export function createSolidTexture(): void {
	// create texture
	const t = gl.createTexture();
	if (!t) {
		console.error("Failed to create solid texture")
		return;
	}

	solidTex = t;

	// set texture properties
	gl.bindTexture(gl.TEXTURE_2D, solidTex);

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;

	// generate texture
	const pixel = new Uint8Array([255, 255, 255, 255]); // opaque blue
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		width,
		height,
		border,
		srcFormat,
		srcType,
		pixel,
	);

	gl.bindTexture(gl.TEXTURE_2D, null);
}

// ~~~~~~~~~~~~~ load a texture from url ~~~~~~~~~~~~~~

export async function loadTexture(url: string): Promise<{ tex: WebGLTexture | null, image: HTMLImageElement }> {
	// create texture
	const texture = gl.createTexture();
	if (!texture) {
		console.error("Failed to create texture: " + url);
		return { tex: null, image: new Image() };
	}

	// set to fallback texture
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([255, 0, 255, 255]);
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		1,
		1,
		border,
		srcFormat,
		srcType,
		pixel,
	);

	// replace when texture loads
	const image = new Image();
	image.onload = () => {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			srcFormat,
			srcType,
			image,
		);

		// power of 2 textures require special treatment
		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
			//gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	image.src = url;

	return { tex: texture, image: image };
}

function isPowerOf2(value: number): boolean {
	return (value & (value - 1)) === 0;
}