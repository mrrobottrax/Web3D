import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { SharedAttribs, gl, lineVao, solidShader } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import gMath from "../../../../src/common/math/gmath.js";
import { quaternion, vec2, vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";
import { editor } from "../main.js";
import { Viewport } from "../windows/viewport.js";
import { SelectExtension } from "./selectextension.js";
import { SelectMode } from "./selecttool.js";

const lineLength = 0.2;

enum GizmoPart {
	None,
	X,
	Y,
	Z
}

export class TranslateTool extends SelectExtension {
	gizmoVao: WebGLVertexArrayObject | null = null;
	gizmoBuffer: WebGLBuffer | null = null;
	arrowHeadModel: Model = new Model();

	gizmoPartUnderMouse: GizmoPart = GizmoPart.None;

	dragging: boolean = false;
	dragPos: vec3 = vec3.origin();
	dragViewport!: Viewport;

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

	startDrag() {
		const viewport = editor.windowManager.activeWindow as Viewport;
		if (!viewport) return;

		this.dragging = true;

		// get grid position
		switch (this.gizmoPartUnderMouse) {
			case GizmoPart.X:
				editor.gridRotation = quaternion.identity();
				editor.gridOffset = this.center.y;
				break;
			case GizmoPart.Y:
				editor.gridRotation = quaternion.euler(90, 0, 0);
				editor.gridOffset = this.center.z;
				break;
			case GizmoPart.Z:
				editor.gridRotation = quaternion.identity();
				editor.gridOffset = this.center.y;
				break;
		}
		this.dragPos = viewport.getMouseWorldRounded();

		this.dragViewport = viewport;
	}

	stopDrag() {
		this.dragging = false;
	}

	override mouse(button: number, pressed: boolean): boolean {
		if (this.gizmoPartUnderMouse != GizmoPart.None) {
			if (button == 0) {
				if (pressed) {
					this.startDrag();
				} else {
					this.stopDrag();
				}
			}
			return false;
		}

		return super.mouse(button, pressed);
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

		const hoverColor = [1, 1, 0, 1];

		drawArrow(quaternion.identity(),
			this.gizmoPartUnderMouse == GizmoPart.X ? hoverColor : [1, 0, 0, 1]);

		drawArrow(quaternion.euler(0, 0, 90),
			this.gizmoPartUnderMouse == GizmoPart.Y ? hoverColor : [0, 1, 0, 1]);

		drawArrow(quaternion.euler(0, -90, 0),
			this.gizmoPartUnderMouse == GizmoPart.Z ? hoverColor : [0, 0, 1, 1]);

		gl.useProgram(solidShader.program);
	}

	mouseMove(dx: number, dy: number): boolean {
		if (this.dragging) {
			const viewport = this.dragViewport;

			if (!viewport) return false;
			if (viewport.looking) return false;

			const lastDrag = vec3.copy(this.dragPos);
			this.dragPos = viewport.getMouseWorldRounded();

			let delta = this.dragPos.minus(lastDrag);

			switch (this.gizmoPartUnderMouse) {
				case GizmoPart.X:
					delta.y = 0;
					delta.z = 0;
					break;
				case GizmoPart.Y:
					delta.x = 0;
					delta.z = 0;
					break;
				case GizmoPart.Z:
					delta.x = 0;
					delta.y = 0;
					break;
			}

			const select = editor.selectTool;

			this.center.add(delta);

			switch (select.mode) {
				case SelectMode.Vertex:
					select.selectedVertices.forEach(vert => {
						vert.position.add(delta);
						editor.snapToGrid(vert.position);
					});
					break;
				case SelectMode.Edge:
					select.selectedEdges.forEach(edge => {
						if (edge.halfA) {
							const v = edge.halfA.tail!;
							v.position.add(delta);
							editor.snapToGrid(v.position);

							const w = edge.halfA.next!.tail!;
							w.position.add(delta);
							editor.snapToGrid(w.position);
						} else if (edge.halfB) {
							const v = edge.halfB.tail!;
							v.position.add(delta);
							editor.snapToGrid(v.position);

							const w = edge.halfB.next!.tail!;
							w.position.add(delta);
							editor.snapToGrid(w.position);
						}
					});
				case SelectMode.Face:
					select.selectedFaces.forEach(face => {
						const start = face.halfEdge;
						let edge = start!;
						do {
							const v = edge.tail!;
							v.position.add(delta);
							editor.snapToGrid(v.position);

							edge = edge.next!;
						} while (edge != start)
					});
					break;
			}

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});

			return false;
		}

		const viewport = editor.windowManager.activeWindow as Viewport;

		if (viewport && !viewport.looking) {
			const dist = vec3.dist(this.center, viewport.camera.position);

			// check if the mouse is over an arrow
			const mouseDistToArrow = (direction: vec3): number => {
				const p = viewport.camera.perspectiveMatrix.copy();
				// don't remap z
				p.setValue(2, 2, 1);
				p.setValue(3, 2, 0);

				const view = viewport.camera.viewMatrix.copy();
				view.translate(this.center);
				// view.rotate(rotation);

				// don't do perspective divide
				if (viewport.perspective)
					view.scale(new vec3(dist, dist, dist));
				else
					view.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1 / viewport.camera.fov));

				const toScreen = p.multiply(view);

				const getPoint2D = (point: vec3): vec2 => {
					const p = point.multMat4(toScreen);

					if (viewport.perspective) {
						p.x /= -p.z;
						p.y /= -p.z;
					}

					return new vec2(p.x, p.y);
				}

				const offset = 0.01;

				const a = getPoint2D(direction.times(offset));
				const b = getPoint2D(direction.times(lineLength + offset));

				return gMath.sqrDistToLine(a, b, viewport.getGlMousePos());
			}

			const x = mouseDistToArrow(new vec3(1, 0, 0));
			const y = mouseDistToArrow(new vec3(0, 1, 0));
			const z = mouseDistToArrow(new vec3(0, 0, 1));

			this.gizmoPartUnderMouse = GizmoPart.None;

			const activationDist = 0.001;

			const clearSelect = () => {
				editor.selectTool.clearSelectionState(true);
			}

			if (x < y && x < z) {
				if (x < activationDist) {
					this.gizmoPartUnderMouse = GizmoPart.X;
					clearSelect();
					return false;
				}
			} else if (y < x && y < z) {
				if (y < activationDist) {
					this.gizmoPartUnderMouse = GizmoPart.Y;
					clearSelect();
					return false;
				}
			} else {
				if (z < activationDist) {
					this.gizmoPartUnderMouse = GizmoPart.Z;
					clearSelect();
					return false;
				}
			}
		}

		return super.mouseMove(dx, dy);
	}
}