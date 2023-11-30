import { initCanvas, initDefaultShaders, initLineBuffer, initializeGl } from "../../../../src/client/render/gl.js";
import { drawLine } from "../../../../src/client/render/render.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { Viewport } from "../windows/viewport.js";
import { addWindow } from "./render.js";

export async function initEditorGl(): Promise<void> {
	initCanvas();
	initializeGl();
	initDefaultShaders();
	initLineBuffer();

	addWindow(new Viewport(0, 0, 800, 600));
	drawLine(new vec3(0, 0, 0), new vec3(0, 1, 0), [1, 0, 0, 1], 100);
}