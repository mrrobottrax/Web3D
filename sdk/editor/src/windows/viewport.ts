import { Camera } from "../../../../src/client/render/camera.js";
import { defaultShader, gl, solidShader } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { quaternion, vec2, vec3 } from "../../../../src/common/math/vector.js";
import { loadedModels } from "../../../../src/common/mesh/gltfloader.js";
import { editor } from "../main.js";
import { ToolEnum } from "../tools/tool.js";
import { SdkWindow } from "../../../common/sdkwindow.js";

export abstract class Viewport extends SdkWindow {
	camera!: Camera;
	looking!: boolean;
	perspective: boolean = false;

	drawEntities() {
		gl.useProgram(defaultShader.program);
		gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, this.camera.perspectiveMatrix.getData());

		editor.entities.forEach((entity) => {
			if (entity.model) {
				const model = loadedModels.get(entity.model);
				if (model) {
					const mat = this.camera.viewMatrix.copy();
					mat.translate(vec3.parse(entity.keyvalues.origin));
					mat.rotate(quaternion.eulerV(vec3.parse(entity.keyvalues.angles)));
					model.nodes.forEach(node => {
						node.primitives.forEach(prim => {
							drawPrimitive(prim, mat, defaultShader);
						});
					});
				}
			}
		});

		gl.useProgram(null);
	}

	drawMeshesSolid() {
		gl.useProgram(defaultShader.program);
		gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, this.camera.perspectiveMatrix.getData());

		editor.meshes.forEach((mesh) => {
			mesh.primitives.forEach((prim) => {
				drawPrimitive(prim, this.camera.viewMatrix, defaultShader);
			});
		});

		gl.useProgram(null);
	}

	drawMeshesWire() {
		gl.useProgram(solidShader.program);
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, this.camera.perspectiveMatrix.getData());

		editor.meshes.forEach((mesh) => {
			gl.bindVertexArray(mesh.wireFrameData.vao);

			gl.uniform4fv(solidShader.colorUnif, [1, 1, 1, 1]);
			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, this.camera.viewMatrix.getData());

			gl.drawElements(gl.LINES, mesh.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);

			gl.bindTexture(gl.TEXTURE_2D, null);

			gl.bindVertexArray(null);
		});

		gl.useProgram(null);
	}

	drawTool() {
		switch (editor.activeToolEnum) {
			case ToolEnum.Entity:
				editor.entityTool.draw(this);
				break;
			case ToolEnum.Block:
				editor.blockTool.drawCurrentBlock();
				break;

			case ToolEnum.Select:
				editor.selectTool.draw(this);
				break;

			case ToolEnum.Translate:
				editor.translateTool.draw(this);
				break;
			case ToolEnum.Rotate:
				editor.rotateTool.draw(this);
				break;
			case ToolEnum.Scale:
				editor.scaleTool.draw(this);
				break;

			case ToolEnum.Cut:
				editor.cutTool.draw(this);
				break;
		}
	}

	mouseToGrid(): vec2 {
		return this.screenToGrid(this.getRelativeMousePos());
	}

	abstract screenToGrid(v: vec2): vec2; // screen position to 2d grid position
	abstract gridToWorld(v: vec2): vec3; // 2d grid position to 3d world
	abstract screenRay(screenPos: vec2): Ray;
	abstract cameraRay(): Ray;
	abstract getMask(): vec3;

	mouseRay(): Ray {
		return this.screenRay(this.getRelativeMousePos());
	}

	getMouseWorldRounded(): vec3 {
		return this.gridToWorld(this.mouseToGrid());
	}

	override key(code: string, pressed: boolean): boolean {
		return editor.activeTool.key(code, pressed);
	}

	override mouse(button: number, pressed: boolean): boolean {
		return editor.activeTool.mouse(button, pressed);
	}

	override mouseMove(dx: number, dy: number): boolean {
		return editor.activeTool.mouseMove(dx, dy);
	}
}
