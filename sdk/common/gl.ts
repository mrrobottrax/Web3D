import { ShaderBase, UninstancedShaderBase, defaultShader, gl, initCanvas, initDefaultShaders, initLineBuffer, initProgramFromWeb, initializeGl, resizeCanvas, skinnedShader, uiShader } from "../../src/client/render/gl.js";
import { initUiBuffers } from "../../src/client/render/ui.js";

interface GridShader extends ShaderBase {
	fillColorUnif: WebGLUniformLocation | null
	zeroFillColorUnif: WebGLUniformLocation | null
	gridSizeUnif: WebGLUniformLocation | null
	offsetUnif: WebGLUniformLocation | null
}
export let gridShader: GridShader = {
	program: null,
	fillColorUnif: null,
	zeroFillColorUnif: null,
	gridSizeUnif: null,
	offsetUnif: null
};

export let borderShader: ShaderBase = {
	program: null
};

export async function initSdkGl(): Promise<void> {
	initCanvas();
	initializeGl();
	initDefaultShaders();

	// wait for shaders to load
	await Promise.all([
		loadDefaultShader(),
		loadSkinnedShader(),
		loadUiShader(),
		loadGridShader(),
		loadBorderShader(),
	]);

	initLineBuffer();
	initUiBuffers();

	resizeCanvas();
}

async function loadDefaultShader() {
	defaultShader.program = await initProgramFromWeb("data/shaders/default/default.vert", "data/shaders/default/default.frag");

	if (!defaultShader.program) return;

	defaultShader.modelViewMatrixUnif = gl.getUniformLocation(defaultShader.program, "uModelViewMatrix");
	defaultShader.projectionMatrixUnif = gl.getUniformLocation(defaultShader.program, "uProjectionMatrix");
	defaultShader.samplerUnif = gl.getUniformLocation(defaultShader.program, "uSampler");
	defaultShader.colorUnif = gl.getUniformLocation(defaultShader.program, "uColor");
	defaultShader.fogColorUnif = gl.getUniformLocation(defaultShader.program, "uFogColor");
	defaultShader.fogNearUnif = gl.getUniformLocation(defaultShader.program, "uFogNear");
	defaultShader.fogFarUnif = gl.getUniformLocation(defaultShader.program, "uFogFar");

	// no fog
	gl.useProgram(defaultShader.program);

	gl.uniform4fv(defaultShader.fogColorUnif, [1, 1, 1, 1]);
	gl.uniform1f(defaultShader.fogNearUnif, 0);
	gl.uniform1f(defaultShader.fogFarUnif, 10000000000);

	gl.useProgram(null);
}

async function loadSkinnedShader() {
	skinnedShader.program = await initProgramFromWeb("data/shaders/default/default_skinned.vert", "data/shaders/default/default.frag");

	if (!skinnedShader.program) return;

	skinnedShader.modelViewMatrixUnif = gl.getUniformLocation(skinnedShader.program, "uModelViewMatrix");
	skinnedShader.projectionMatrixUnif = gl.getUniformLocation(skinnedShader.program, "uProjectionMatrix");
	skinnedShader.samplerUnif = gl.getUniformLocation(skinnedShader.program, "uSampler");
	skinnedShader.colorUnif = gl.getUniformLocation(skinnedShader.program, "uColor");
	skinnedShader.boneMatricesUnif = gl.getUniformLocation(skinnedShader.program, "uBoneMatrices");
	skinnedShader.fogColorUnif = gl.getUniformLocation(skinnedShader.program, "uFogColor");
	skinnedShader.fogNearUnif = gl.getUniformLocation(skinnedShader.program, "uFogNear");
	skinnedShader.fogFarUnif = gl.getUniformLocation(skinnedShader.program, "uFogFar");

	// no fog
	gl.useProgram(skinnedShader.program);

	gl.uniform4fv(skinnedShader.fogColorUnif, [1, 1, 1, 1]);
	gl.uniform1f(skinnedShader.fogNearUnif, 0);
	gl.uniform1f(skinnedShader.fogFarUnif, 10000000000);

	gl.useProgram(null);
}

async function loadUiShader() {
	uiShader.program = await initProgramFromWeb("data/shaders/default/ui.vert", "data/shaders/default/ui.frag");

	if (!uiShader.program) return;

	uiShader.modelViewMatrixUnif = gl.getUniformLocation(uiShader.program, "uModelViewMatrix");
	uiShader.projectionMatrixUnif = gl.getUniformLocation(uiShader.program, "uProjectionMatrix");
	uiShader.samplerUnif = gl.getUniformLocation(uiShader.program, "uSampler");
	uiShader.colorUnif = gl.getUniformLocation(uiShader.program, "uColor");
}

async function loadGridShader() {
	gridShader.program = await initProgramFromWeb("sdk/editor/data/shaders/grid.vert", "sdk/editor/data/shaders/grid.frag");

	if (!gridShader.program) return;

	gridShader.fillColorUnif = gl.getUniformLocation(gridShader.program, "uFillColor");
	gridShader.zeroFillColorUnif = gl.getUniformLocation(gridShader.program, "uZeroFillColor");
	gridShader.gridSizeUnif = gl.getUniformLocation(gridShader.program, "uGridSize");
	gridShader.offsetUnif = gl.getUniformLocation(gridShader.program, "uOffset");
}

async function loadBorderShader() {
	borderShader.program = await initProgramFromWeb("sdk/editor/data/shaders/border.vert", "sdk/editor/data/shaders/border.frag");
}