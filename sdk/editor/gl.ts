import { initCanvas, initDefaultShaders, initLineBuffer, initializeGl } from "../../src/client/render/gl.js";

export async function initEditorGl(): Promise<void> {
	initCanvas();
	initializeGl();
	await initDefaultShaders();
	initLineBuffer();
}