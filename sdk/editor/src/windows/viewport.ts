import { Camera } from "../../../../src/client/render/camera.js";
import { defaultShader, gl, solidShader, solidTex } from "../../../../src/client/render/gl.js";
import { drawLine, drawPrimitive, renderDebug } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorFace } from "../mesh/editormesh.js";
import { borderShader } from "../render/gl.js";
import { ToolEnum } from "../tools/tool.js";
import { EditorWindow } from "./window.js";

export abstract class Viewport extends EditorWindow {
	camera!: Camera;
	looking!: boolean;

	drawMeshOutlines(perspectiveMatrix: mat4, viewMatrix: mat4) {
		gl.useProgram(defaultShader.program);
		gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

		editor.meshes.forEach((mesh) => {
			mesh.primitives.forEach((prim) => {
				drawPrimitive(prim, this.camera.viewMatrix, defaultShader);
			})

			// todo: wireframe mode
		});

		gl.useProgram(null);

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