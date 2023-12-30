import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { SharedAttribs, gl, lineVao, solidShader } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";
import { editor } from "../main.js";
import { Viewport } from "../windows/viewport.js";
import { SelectExtension } from "./selectextension.js";
import { SelectMode } from "./selecttool.js";

const lineLength = 0.2;

export class TranslateTool extends SelectExtension {
	gizmoVao: WebGLVertexArrayObject | null = null;
	gizmoBuffer: WebGLBuffer | null = null;
	arrowHeadModel: Model = new Model();

	init() {
		this.gizmoVao = gl.createVertexArray();
		gl.bindVertexArray(this.gizmoVao);
		
		this.gizmoBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gizmoBuffer);
		
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, lineLength, 0, 0]), gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);
		
		ClientGltfLoader.loadGltfFromWeb("./sdk/editor/data/models/arrow").then(model => {
			this.arrowHeadModel = model;
		});
		
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindVertexArray(null);
	}

	override draw(viewport: Viewport) {
		super.draw(viewport);

		const select = editor.selectTool;

		switch (select.mode) {
			case SelectMode.Vertex:
				if (select.selectedVertices.size == 0) return;
				break;
			case SelectMode.Edge:
				if (select.selectedEdges.size == 0) return;
				break;
			case SelectMode.Face:
				if (select.selectedFaces.size == 0) return;
				break;
			case SelectMode.Mesh:
				if (select.selectedMeshes.size == 0) return;
				break;
		}

		const startMat = viewport.camera.viewMatrix.copy();

		const dist = vec3.dist(this.center, viewport.camera.position);
		// const pos = this.center.multMat4(startMat);

		const drawArrow = (rotation: quaternion, color: number[]) => {
			// line
			gl.bindVertexArray(this.gizmoVao);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.gizmoBuffer);

			let mat = startMat.copy();
			mat.translate(this.center);
			mat.rotate(rotation);

			// don't do perspective divide
			if (viewport.perspective)
				mat.scale(new vec3(dist, dist, dist));
			else
				mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1 / viewport.camera.fov));

			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
			gl.uniform4fv(solidShader.colorUnif, color);

			gl.drawArrays(gl.LINES, 0, 2);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindVertexArray(null);

			// arrow
			mat = startMat.copy();
			mat.translate(this.center);
			mat.rotate(rotation);

			// don't do perspective divide
			if (viewport.perspective)
				mat.scale(new vec3(dist, dist, dist));
			else
				mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1 / viewport.camera.fov));

			mat.translate(new vec3(lineLength, 0, 0));
			mat.rotate(quaternion.euler(0, 0, -90));
			mat.scale(new vec3(0.02, 0.02, 0.02));
			this.arrowHeadModel.nodes.forEach(node => {
				node.primitives.forEach(primitive => {
					drawPrimitive(primitive, mat, solidShader, color);
				});
			});
		}

		gl.clear(gl.DEPTH_BUFFER_BIT);

		gl.useProgram(solidShader.program);
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, viewport.camera.perspectiveMatrix.getData());

		drawArrow(quaternion.identity(), [1, 0, 0, 1]);
		drawArrow(quaternion.euler(0, 90, 0), [0, 0, 1, 1]);
		drawArrow(quaternion.euler(0, 0, 90), [0, 1, 0, 1]);

		gl.useProgram(solidShader.program);
	}

 	mouseMove(dx: number, dy: number): boolean {
		// check if the mouse is over an arrow

		return super.mouseMove(dx, dy);
	}
}