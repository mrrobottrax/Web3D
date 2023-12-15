import { Camera } from "../../../../src/client/render/camera.js";
import { defaultShader, gl, solidShader, solidTex } from "../../../../src/client/render/gl.js";
import { drawPrimitive, renderDebug } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { borderShader } from "../render/gl.js";
import { EditorWindow } from "./window.js";

export abstract class Viewport extends EditorWindow {
	camera!: Camera;
	looking!: boolean;

	drawMeshesSolid(perspectiveMatrix: mat4, viewMatrix: mat4) {
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

	drawMeshesWire(perspectiveMatrix: mat4, viewMatrix: mat4) {
		gl.useProgram(solidShader.program);
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

		editor.meshes.forEach((mesh) => {
			gl.bindVertexArray(mesh.wireFrameData.vao);

			gl.uniform4fv(solidShader.colorUnif, [1, 1, 1, 1]);
			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewMatrix.getData());

			gl.drawElements(gl.LINES, mesh.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);

			gl.bindTexture(gl.TEXTURE_2D, null);

			gl.bindVertexArray(null);
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
		gl.disable(gl.DEPTH_TEST);
		
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
		
		gl.enable(gl.DEPTH_TEST);
		gl.bindVertexArray(null);
		gl.useProgram(null);
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