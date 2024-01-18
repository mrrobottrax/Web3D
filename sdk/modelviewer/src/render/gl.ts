import { defaultShader, gl, initCanvas, initDefaultShaders, initLineBuffer, initProgramFromWeb, initializeGl, resizeCanvas, skinnedShader, uiShader } from "../../../../src/client/render/gl.js";
import { initUiBuffers } from "../../../../src/client/render/ui.js";
import { borderShader, gridShader } from "../../../editor/src/render/gl.js";

export async function initModelViewerGl(): Promise<void> {
	initCanvas();
	initializeGl();
	initDefaultShaders();
	await initModelViewerShaders();

	initLineBuffer();
	initUiBuffers();

	resizeCanvas();

	gl.clearColor(0.1, 0.1, 0.1, 1.0);
}

async function initModelViewerShaders() {
	// create remaining shader programs
	await Promise.all<WebGLProgram>([
		initProgramFromWeb("data/shaders/default/default.vert", "data/shaders/default/default.frag"),
		initProgramFromWeb("data/shaders/default/ui.vert", "data/shaders/default/ui.frag"),
		initProgramFromWeb("data/shaders/default/default_skinned.vert", "data/shaders/default/default.frag"),
		initProgramFromWeb("sdk/editor/data/shaders/border.vert", "sdk/editor/data/shaders/border.frag"),
	]).then((results) => {
		defaultShader.program = results[0];
		uiShader.program = results[1];
		skinnedShader.program = results[2];
		borderShader.program = results[3];
	});

	if (!defaultShader.program || !uiShader.program || !skinnedShader.program || !gridShader.program)
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

	gridShader.fillColorUnif = gl.getUniformLocation(gridShader.program, "uFillColor");
	gridShader.zeroFillColorUnif = gl.getUniformLocation(gridShader.program, "uZeroFillColor");
	gridShader.gridSizeUnif = gl.getUniformLocation(gridShader.program, "uGridSize");
	gridShader.offsetUnif = gl.getUniformLocation(gridShader.program, "uOffset");

	// no fog
	gl.useProgram(defaultShader.program);
	gl.uniform4fv(defaultShader.fogColorUnif, [1, 1, 1, 1]);
	gl.uniform1f(defaultShader.fogNearUnif, 0);
	gl.uniform1f(defaultShader.fogFarUnif, 10000000000);

	gl.useProgram(skinnedShader.program);
	gl.uniform4fv(skinnedShader.fogColorUnif, [1, 1, 1, 1]);
	gl.uniform1f(skinnedShader.fogNearUnif, 0);
	gl.uniform1f(skinnedShader.fogFarUnif, 10000000000);

	gl.useProgram(null);
}