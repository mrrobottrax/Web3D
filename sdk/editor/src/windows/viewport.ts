import { Camera } from "../../../../src/client/render/camera.js";
import { gl } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { borderShader } from "../render/gl.js";
import { ToolEnum } from "../tools/tool.js";
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

	drawTool() {
		switch (editor.activeToolEnum) {
			case ToolEnum.Block:
				editor.blockTool.drawCurrentBlock();
				break;
		}
	}

	mouseToGrid(): vec2 {
		return this.screenToGrid(this.getRelativeMousePos());
	}

	abstract screenToGrid(v: vec2): vec2;
	abstract gridToWorld(v: vec2): vec3;
	abstract getMask(): vec3;

	getMouseWorldRounded(): vec3 {
		return this.gridToWorld(this.mouseToGrid());
	}

}