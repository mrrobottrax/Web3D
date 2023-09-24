import { initProjection } from "./render.js";

export let glProperties = {
	width: 0,
	height: 0
}
export let gl: WebGL2RenderingContext;

enum SharedAttribs {
	positionAttrib,
	texCoordAttrib
}

// ~~~~~~~~~~~~~ shaders ~~~~~~~~~~~~~~

interface ShaderBase {
	program: WebGLProgram | null;
	modelViewMatrixUnif: WebGLUniformLocation | null;
	projectionMatrixUnif: WebGLUniformLocation | null;
	samplerUnif: WebGLUniformLocation | null;
	colorUnif: WebGLUniformLocation | null;
}

export let fallbackShader: ShaderBase = {
	program: null,
	modelViewMatrixUnif: null,
	projectionMatrixUnif: null,
	samplerUnif: null,
	colorUnif: null
};

interface DefaultShader extends ShaderBase {
}
export let defaultShader: DefaultShader = {
	program: null,
	modelViewMatrixUnif: null,
	samplerUnif: null,
	projectionMatrixUnif: null,
	colorUnif: null
};

// ~~~~~~~~~~~~~ default / fallbacks ~~~~~~~~~~~~~~

export let solidTex: WebGLTexture;

// vertex shader program
const fallbackVSource = `
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`;

// fragment shader program
const fallbackFSource = `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
`;

// ~~~~~~~~~~~~~ init ~~~~~~~~~~~~~~

export let canvas: HTMLCanvasElement;

export async function initGl(): Promise<void> {
	const c: HTMLCanvasElement | null = document.querySelector("#game");

	if (!c) {
		console.error("Could not find canvas");
		return;
	}

	canvas = c;

	// initialize the GL context
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

	// initialize gl context
	gl = _gl;

	gl.clearColor(0.15, 0.15, 0.15, 1.0);
	gl.clearDepth(1.0);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	// create fallback program
	const fallbackProgram: WebGLProgram | null = initShaderProgram(fallbackVSource, fallbackFSource);
	if (!fallbackProgram) {
		console.error("Failed to init fallback shader");
		return;
	}
	fallbackShader.program = fallbackProgram;

	defaultShader.program = fallbackShader.program;

	// create default solid texture
	createSolidTexture();

	// create remaining shader programs
	await Promise.all<WebGLProgram>([
		initProgramFromWeb("data/shaders/default/default.vert", "data/shaders/default/default.frag"),
	]).then((results) => {
		defaultShader.program = results[0];
	});

	// get shader locations
	fallbackShader.modelViewMatrixUnif = gl.getUniformLocation(fallbackShader.program, "uModelViewMatrix");
	fallbackShader.projectionMatrixUnif = gl.getUniformLocation(fallbackShader.program, "uProjectionMatrix");

	defaultShader.modelViewMatrixUnif = gl.getUniformLocation(defaultShader.program, "uModelViewMatrix");
	defaultShader.projectionMatrixUnif = gl.getUniformLocation(defaultShader.program, "uProjectionMatrix");
	defaultShader.samplerUnif = gl.getUniformLocation(defaultShader.program, "uSampler");
	defaultShader.colorUnif = gl.getUniformLocation(defaultShader.program, "uColor");
}

export function resizeCanvas() {
	const ratio = window.devicePixelRatio;
	const width = canvas.clientWidth * ratio;
	const height = canvas.clientHeight * ratio;

	if (glProperties.width == width && glProperties.height == height) {
		return;
	}

	glProperties.width = width;
	glProperties.height = height;
	canvas.width = width;
	canvas.height = height;

	gl.viewport(0, 0, width, height);

	initProjection();
}

// ~~~~~~~~~~~~~ load shader program from web urls ~~~~~~~~~~~~~~

async function initProgramFromWeb(vs: string, fs: string): Promise<WebGLProgram | null> {
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
		shader = initShaderProgram(fallbackVSource, fallbackFSource);
	}

	return shader;
}

// ~~~~~~~~~~~~~ create shader program ~~~~~~~~~~~~~~

function initShaderProgram(vsSource: string, fsSource: string): WebGLProgram | null {
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

function createSolidTexture(): void {
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

export async function loadTexture(url: string): Promise<WebGLTexture | null> {
	// create texture
	const texture = gl.createTexture();
	if (!texture) {
		console.error("Failed to create texture: " + url);
		return null
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

	return texture;
}

function isPowerOf2(value: number): boolean {
	return (value & (value - 1)) === 0;
}