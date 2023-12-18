import { gl, solidShader } from "../../../../src/client/render/gl.js";
import { drawLine, drawLineScreen } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorMesh, EditorVertex } from "../mesh/editormesh.js";
import { getKeyDown } from "../system/input.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

export enum SelectMode {
	Vertex,
	Edge,
}

export class SelectTool extends Tool {
	mode: SelectMode = SelectMode.Vertex;

	vertexButton: HTMLElement | null;
	edgeButton: HTMLElement | null;

	selectedMeshes: Set<EditorMesh> = new Set();

	selectedVertices: Set<EditorVertex> = new Set();

	constructor() {
		super();
		this.vertexButton = document.getElementById("select-vertex");
		this.edgeButton = document.getElementById("select-edge");

		if (!(this.vertexButton && this.edgeButton)) {
			console.error("MISSING BUTTONS!");
			return;
		}

		this.vertexButton.onclick = () => this.setSelectMode(SelectMode.Vertex);
		this.edgeButton.onclick = () => this.setSelectMode(SelectMode.Edge);

		this.updateModeGraphics();
	}

	setSelectMode(selectMode: SelectMode) {
		this.mode = selectMode;

		this.updateModeGraphics();
	}

	updateModeGraphics() {
		this.vertexButton?.classList.remove("selected-button");
		this.edgeButton?.classList.remove("selected-button");

		switch (this.mode) {
			case SelectMode.Vertex:
				this.vertexButton?.classList.add("selected-button");
				break;
			case SelectMode.Edge:
				this.edgeButton?.classList.add("selected-button");
				break;
		}
	}

	drawSelected(viewport: Viewport) {
		// draw selected mesh outlines
		gl.useProgram(solidShader.program);
		const p = viewport.camera.perspectiveMatrix.copy();
		p.setValue(3, 2, p.getValue(3, 2) - 0.001); // fudge the numbers for visibility
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, p.getData());

		this.selectedMeshes.forEach(mesh => {
			gl.bindVertexArray(mesh.wireFrameData.vao);

			gl.uniform4fv(solidShader.colorUnif, [0.5, 0.8, 1, 1]);
			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

			gl.drawElements(gl.LINES, mesh.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);
		})

		gl.bindVertexArray(null);
		gl.useProgram(null);

		// draw gizmos
		switch (this.mode) {
			case SelectMode.Vertex:
				gl.useProgram(solidShader.program);

				// make em slightly more visible than they should be
				const p = viewport.camera.perspectiveMatrix.copy();
				p.setValue(3, 2, p.getValue(3, 2) - 0.001);

				gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, p.getData());
				gl.bindVertexArray(rectVao);

				gl.uniform4fv(solidShader.colorUnif, [0.5, 0.8, 1, 1]);

				const cameraQuat = viewport.camera.rotation;

				editor.meshes.forEach(mesh => {
					mesh.verts.forEach((vert) => {
						// todo: speed up or slow down?
						// if (this.selectedVertices.has(vert))
						// 	return;

						let mat = viewport.camera.viewMatrix.copy();

						const pos = vert.position.multMat4(mat);

						mat.translate(vert.position);
						mat.rotate(cameraQuat);

						// don't do perspective divide
						if (viewport.threeD)
							mat.scale(new vec3(-pos.z, -pos.z, 1));
						else
							mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1));

						mat.scale(new vec3(0.01, 0.01, 1));

						gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
						gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
					});
				})

				gl.uniform4fv(solidShader.colorUnif, [1, 1, 0, 1]);

				gl.disable(gl.DEPTH_TEST);

				this.selectedVertices.forEach((vert) => {
					let mat = viewport.camera.viewMatrix.copy();

					const pos = vert.position.multMat4(mat);

					mat.translate(vert.position);
					mat.rotate(cameraQuat);

					// don't do perspective divide
					if (viewport.threeD)
						mat.scale(new vec3(-pos.z, -pos.z, 1));
					else
						mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1));

					mat.scale(new vec3(0.015, 0.015, 1));

					gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
					gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
				});

				gl.uniform4fv(solidShader.colorUnif, [1, 1, 1, 1]);

				const vUnderCursor = this.getVertexUnderCursor(viewport).vertex;
				if (vUnderCursor && !this.selectedVertices.has(vUnderCursor)) {
					let mat = viewport.camera.viewMatrix.copy();

					const pos = vUnderCursor.position.multMat4(mat);

					mat.translate(vUnderCursor.position);
					mat.rotate(cameraQuat);

					// don't do perspective divide
					if (viewport.threeD)
						mat.scale(new vec3(-pos.z, -pos.z, 1));
					else
						mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1));

					mat.scale(new vec3(0.015, 0.015, 1));

					gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
					gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
				}

				gl.enable(gl.DEPTH_TEST);

				gl.bindVertexArray(null);
				gl.useProgram(null);
				break;
		}
	}

	override mouse(button: number, pressed: boolean): boolean {
		const active = editor.windowManager.activeWindow as Viewport;

		if (active && button == 0 && pressed) {
			switch (this.mode) {
				case SelectMode.Vertex:
					this.selectVertex(active);
					break;
			}

			return true;
		}

		return false;
	}

	selectVertex(viewport: Viewport) {
		if (viewport.threeD) {
			const v = this.getVertexUnderCursor(viewport);

			if (v.vertex && v.mesh) {
				if (getKeyDown("ShiftLeft")) {
					this.selectedVertices.add(v.vertex);
					this.selectedMeshes.add(v.mesh);
				} else if (getKeyDown("ControlLeft")) {
					this.selectedVertices.delete(v.vertex);

					// make sure each mesh still has a selected vertex
					this.selectedMeshes.forEach(mesh => {
						const it = mesh.verts.values();
						let i = it.next();
						while (!i.done) {
							const v = i.value;

							// we're good :)
							if (this.selectedVertices.has(v))
								return;

							i = it.next();
						}

						// i shouldn't be here
						this.selectedMeshes.delete(mesh);
					});
				} else {
					this.selectedVertices.clear();
					this.selectedMeshes.clear();
					this.selectedVertices.add(v.vertex);
					this.selectedMeshes.add(v.mesh);
				}
			}
		} else {

		}
	}

	getVertexUnderCursor(viewport: Viewport): {
		vertex: EditorVertex | null,
		mesh: EditorMesh | null
	} {
		const persp = viewport.camera.perspectiveMatrix.copy();
		const view = viewport.camera.viewMatrix.copy();

		// don't remap z
		persp.setValue(2, 2, 1);
		persp.setValue(3, 2, 0);

		const toScreen = persp.multiply(view);

		const cursor = viewport.getRelativeMousePos().minus(viewport.size.times(0.5));
		cursor.x /= viewport.size.x * 0.5;
		cursor.y /= viewport.size.y * 0.5;

		let bestDist = Infinity;
		let bestVertex: EditorVertex | null = null;
		let bestMesh: EditorMesh | null = null;

		// find the vertex that is closest to the cursor
		const it = editor.meshes.values();
		let i = it.next();
		while (!i.done) {
			const mesh = i.value;

			const it2 = mesh.verts.values();
			let i2 = it2.next();
			while (!i2.done) {
				const vert = i2.value;

				const screenPoint = vert.position.multMat4(toScreen);

				screenPoint.x /= -screenPoint.z;
				screenPoint.y /= -screenPoint.z;

				const screen2D = new vec2(screenPoint.x, screenPoint.y);

				const d = vec2.sqrDist(cursor, screen2D);

				if (d < bestDist) {
					// todo: raycast to make sure vert is visible

					bestDist = d;
					bestVertex = vert;
					bestMesh = mesh;
				}

				i2 = it2.next();
			}

			i = it.next();
		}

		return { vertex: bestVertex, mesh: bestMesh }
	}
}