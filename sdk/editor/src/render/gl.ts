import { ShaderBase, defaultShader, gl, initCanvas, initDefaultShaders, initLineBuffer, initProgramFromWeb, initializeGl, resizeCanvas, skinnedShader, uiShader } from "../../../../src/client/render/gl.js";
import { initUiBuffers } from "../../../../src/client/render/ui.js";

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

export async function initEditorGl(): Promise<void> {
	initCanvas();
	initializeGl();
	initDefaultShaders();
	await initEditorShaders();

	initLineBuffer();
	initUiBuffers();

	resizeCanvas();
}

export async function initEditorShaders() {
	// create remaining shader programs
	await Promise.all<WebGLProgram>([
		initProgramFromWeb("data/shaders/default/default.vert", "data/shaders/default/default.frag"),
		initProgramFromWeb("data/shaders/default/ui.vert", "data/shaders/default/ui.frag"),
		initProgramFromWeb("data/shaders/default/default_skinned.vert", "data/shaders/default/default.frag"),
		initProgramFromWeb("sdk/editor/data/shaders/grid.vert", "sdk/editor/data/shaders/grid.frag"),
		initProgramFromWeb("sdk/editor/data/shaders/border.vert", "sdk/editor/data/shaders/border.frag"),
	]).then((results) => {
		defaultShader.program = results[0];
		uiShader.program = results[1];
		skinnedShader.program = results[2];
		gridShader.program = results[3];
		borderShader.program = results[4];
	});

	if (!defaultShader.program || !uiShader.program || !skinnedShader.program || !gridShader.program
		|| !borderShader.program)
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

	gridShader.fillColorUnif = gl.getUniformLocation(gridShader.program, "uFillColor");
	gridShader.zeroFillColorUnif = gl.getUniformLocation(gridShader.program, "uZeroFillColor");
	gridShader.gridSizeUnif = gl.getUniformLocation(gridShader.program, "uGridSize");
	gridShader.offsetUnif = gl.getUniformLocation(gridShader.program, "uOffset");
}