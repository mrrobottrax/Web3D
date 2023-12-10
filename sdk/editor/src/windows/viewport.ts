import { Camera } from "../../../../src/client/render/camera.js";
import { gl, solidShader } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { editor } from "../main.js";
import { borderShader } from "../render/gl.js";
import { EditorWindow } from "./window.js";

export abstract class Viewport extends EditorWindow {
	camera!: Camera;
	looking!: boolean;

	drawMeshOutlines(perspectiveMatrix: mat4, viewMatrix: mat4) {
		renderDebug(perspectiveMatrix, viewMatrix);
	}

	drawBorder() {
		if (editor.windowManager.activeWindow != this) {
			return
		}

		gl.useProgram(borderShader.program);
		gl.bindVertexArray(rectVao);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

		gl.bindVertexArray(null);
		gl.useProgram(null);
	}
}