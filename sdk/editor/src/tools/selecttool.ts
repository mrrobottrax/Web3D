import { drawBox } from "../../../../src/client/render/debugRender.js";
import { defaultShader, gl, lineBuffer, lineVao, solidShader } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import gMath from "../../../../src/common/math/gmath.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorFace, EditorFullEdge, EditorHalfEdge, EditorMesh, EditorVertex } from "../mesh/editormesh.js";
import { getSdkKeyDown } from "../../../common/sdkinput.js";
import { PropertiesPanel } from "../system/propertiespanel.js";
import { Viewport } from "../windows/viewport.js";
import { Tool, ToolEnum } from "./tool.js";

export enum SelectMode {
	Vertex,
	Edge,
	Face,
	Mesh,
	Entity
}

export class SelectTool extends Tool {
	mode: SelectMode = SelectMode.Mesh;

	vertexButton: HTMLElement | null;
	edgeButton: HTMLElement | null;
	faceButton: HTMLElement | null;
	meshButton: HTMLElement | null;
	entityButton: HTMLElement | null;

	meshUnderCursor: EditorMesh | null = null;
	entityUnderCursor: any = null;
	faceUnderCursor: EditorFace | null = null;
	vertexUnderCursor: EditorVertex | null = null;
	edgeUnderCursor: EditorFullEdge | null = null;

	selectedEntities: Set<any> = new Set();
	selectedMeshes: Set<EditorMesh> = new Set();
	selectedVertices = new Set<EditorVertex>();
	selectedEdges = new Set<EditorFullEdge>();
	selectedFaces = new Set<EditorFace>();

	cursorCopy: boolean = false;
	cursorMove: boolean = false;

	startDragPos = vec3.origin();
	dragPos: vec3 = vec3.origin();
	dragging: boolean = false;

	selectBoxStart = vec2.origin();
	selectBoxEnd = vec2.origin();
	creatingSelectBox = false;

	constructor() {
		super();
		this.vertexButton = document.getElementById("select-vertex");
		this.edgeButton = document.getElementById("select-edge");
		this.faceButton = document.getElementById("select-face");
		this.meshButton = document.getElementById("select-mesh");
		this.entityButton = document.getElementById("select-entity");

		if (!(this.vertexButton && this.edgeButton && this.faceButton
			&& this.meshButton && this.entityButton)) {
			console.error("MISSING BUTTONS!");
			return;
		}

		this.vertexButton.onclick = () => this.setSelectMode(SelectMode.Vertex);
		this.edgeButton.onclick = () => this.setSelectMode(SelectMode.Edge);
		this.faceButton.onclick = () => this.setSelectMode(SelectMode.Face);
		this.meshButton.onclick = () => this.setSelectMode(SelectMode.Mesh);
		this.entityButton.onclick = () => this.setSelectMode(SelectMode.Entity);

		this.updateModeGraphics();
	}

	override close(): void {
		this.clearSelected();
		this.clearSelectionState(true);
	}

	setSelectMode(selectMode: SelectMode) {
		editor.setTool(ToolEnum.Select);

		this.mode = selectMode;
		this.clearSelected();
		this.clearSelectionState();

		this.updateModeGraphics();
	}

	updateModeGraphics() {
		this.vertexButton?.classList.remove("selected-button");
		this.edgeButton?.classList.remove("selected-button");
		this.faceButton?.classList.remove("selected-button");
		this.meshButton?.classList.remove("selected-button");
		this.entityButton?.classList.remove("selected-button");

		switch (this.mode) {
			case SelectMode.Vertex:
				this.vertexButton?.classList.add("selected-button");
				break;
			case SelectMode.Edge:
				this.edgeButton?.classList.add("selected-button");
				break;
			case SelectMode.Face:
				this.faceButton?.classList.add("selected-button");
				break;
			case SelectMode.Mesh:
				this.meshButton?.classList.add("selected-button");
				break;
			case SelectMode.Entity:
				this.entityButton?.classList.add("selected-button");
				break;
		}
	}

	override mouseMove(dx: number, dy: number): boolean {
		if (!editor.windowManager.activeWindow) return false;

		const activeViewport = editor.windowManager.activeWindow as Viewport;

		if (activeViewport.looking) return false;

		// drag vertices
		if (this.dragging && this.mode == SelectMode.Vertex) {
			const start = this.dragPos;
			const end = activeViewport.getMouseWorldRounded();
			const delta = end.minus(start);
			editor.snapToGrid(delta);

			if (delta.sqrMagnitude() > 0) {
				this.hasDragged = true;

				const move = (vert: EditorVertex, delta: vec3) => {
					vert.position.add(delta);
					editor.snapToGrid(vert.position);
				}

				// move selected
				{
					if (this.selectedVertices) {
						const it = this.selectedVertices.values();
						let i = it.next();
						while (!i.done) {
							const v = i.value;

							move(v, delta);

							i = it.next()
						}
					}
				}

				// update selected meshes
				{
					const it = this.selectedMeshes.values();
					let i = it.next();
					while (!i.done) {
						const v = i.value;

						v.updateShape();

						i = it.next()
					}
				}
			}

			this.dragPos = end;
			return false;
		}

		if (this.creatingSelectBox) {
			this.selectBoxEnd = activeViewport.getGlMousePos();

			return false;
		}

		// shouldn't be done in 2d viewport for vertex mode
		let meshDist = 0;
		if (activeViewport.perspective || (this.mode != SelectMode.Vertex)) {
			const underCursor = this.getMeshUnderCursor(activeViewport, activeViewport.perspective && this.mode == SelectMode.Vertex);
			if (underCursor.mesh) {
				this.meshUnderCursor = underCursor.mesh;
				this.faceUnderCursor = underCursor.face;
				meshDist = underCursor.dist;
			} else {
				this.faceUnderCursor = null;
				this.meshUnderCursor = null;
			}
		}

		switch (this.mode) {
			case SelectMode.Vertex:
				// check if there is a selected vertex under the cursor
				this.vertexUnderCursor = this.getVertexUnderCursor(activeViewport, true);
				this.cursorMove = this.vertexUnderCursor != null;

				const secondVertex = this.getVertexUnderCursor(activeViewport);
				if (secondVertex) this.vertexUnderCursor = secondVertex;
				break;
			case SelectMode.Edge:
				this.edgeUnderCursor = this.getEdgeUnderCursor(activeViewport);
				break;
			case SelectMode.Mesh:
				this.entityUnderCursor = this.getEntityUnderCursor(activeViewport, meshDist);
				break;
			case SelectMode.Entity:
				this.entityUnderCursor = this.getEntityUnderCursor(activeViewport, meshDist);
				break;
		}

		return false;
	}

	draw(viewport: Viewport) {
		this.drawGizmos(viewport);

		this.setCursor();
	}

	setCursor() {
		if (this.cursorCopy) {
			document.body.style.cursor = "copy";
			return;
		}

		if (this.cursorMove) {
			document.body.style.cursor = "move";
			return;
		}

		document.body.style.cursor = "default";
	}

	key(code: string, pressed: boolean): boolean {
		this.cursorCopy = getSdkKeyDown("ShiftLeft") || getSdkKeyDown("ControlLeft");

		if (pressed) {
			switch (code) {
				case "Delete":
					this.deleteSelected();
					break;
				case "Backspace":
					this.dissolveSelected();
					break;
			}
		}

		return false;
	}

	dissolveSelected() {
		console.log("Dissolve");
		switch (this.mode) {
			case SelectMode.Edge:
				this.selectedEdges.forEach(edge => {
					if (edge.halfA && edge.halfB) {
						edge.halfA.face!.mesh!.dissolveEdge(edge);
					}
				});
				break;
			case SelectMode.Vertex:
				this.selectedVertices.forEach(vert => {
					vert.edges.values().next().value.face.mesh.dissolveVertex(vert);
				});
				break;
		}

		this.selectedMeshes.forEach(mesh => {
			mesh.updateShape();
		});

		this.clearSelected();
		this.clearSelectionState();
	}

	deleteSelected() {
		switch (this.mode) {
			case SelectMode.Mesh:
				{
					this.selectedMeshes.forEach(mesh => {
						mesh.deleteSelf();
					});
					this.selectedEntities.forEach(entity => {
						editor.entities.delete(entity);
					});
				}
				break;
			case SelectMode.Entity:
				{
					this.selectedEntities.forEach(entity => {
						editor.entities.delete(entity);
					});
				}
				break;
			case SelectMode.Face:
				{
					this.selectedFaces.forEach(face => {
						face.mesh!.deleteFace(face);
					});
				}
				break;
			case SelectMode.Edge:
				{
					this.selectedEdges.forEach(edge => {
						let h;
						if (edge.halfA) {
							h = edge.halfA;
						} else {
							h = edge.halfB
						}

						h?.face?.mesh?.deleteEdge(edge);
					});
				}
				break;
			case SelectMode.Vertex:
				{
					this.selectedVertices.forEach(vert => {
						vert.edges.forEach(edge => {
							edge.face?.mesh?.deleteEdge(edge.full!);
						});
					});
				}
				break;
		}

		this.selectedMeshes.forEach(mesh => {
			mesh.updateShape();
		});

		this.clearSelected();
		this.clearSelectionState();
	}

	outlineFudge = 0.0002;
	drawGizmos(viewport: Viewport) {
		if ((this.mode != SelectMode.Mesh) && (this.mode != SelectMode.Entity)) {
			// draw selected mesh outlines
			gl.useProgram(solidShader.program);
			const p = viewport.camera.perspectiveMatrix.copy();
			p.setValue(3, 2, p.getValue(3, 2) - this.outlineFudge); // fudge the numbers for visibility
			gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, p.getData());
			gl.uniform4fv(solidShader.colorUnif, [0.5, 0.8, 1, 1]);
			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

			this.selectedMeshes.forEach(mesh => {
				gl.bindVertexArray(mesh.wireFrameData.vao);

				gl.drawElements(gl.LINES, mesh.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);
			});

			// mesh under cursor
			if (viewport.perspective) {
				if (this.meshUnderCursor && !this.selectedMeshes.has(this.meshUnderCursor)) {
					gl.bindVertexArray(this.meshUnderCursor.wireFrameData.vao);

					gl.drawElements(gl.LINES, this.meshUnderCursor.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);
				}
			}
		} else {
			// draw selected meshes
			if (viewport.perspective) {
				gl.useProgram(defaultShader.program);
				gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, viewport.camera.perspectiveMatrix.getData());

				this.selectedMeshes.forEach(mesh => {
					mesh.primitives.forEach(prim => {
						drawPrimitive(prim, viewport.camera.viewMatrix, defaultShader, [1, 1, 0.8, 1]);
					})
				})
			}

			// draw selected mesh outlines
			gl.useProgram(solidShader.program);
			const p = viewport.camera.perspectiveMatrix.copy();
			p.setValue(3, 2, p.getValue(3, 2) - this.outlineFudge); // fudge the numbers for visibility
			gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, p.getData());
			gl.uniform4fv(solidShader.colorUnif, [1, 1, 0, 1]);
			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

			this.selectedMeshes.forEach(mesh => {
				gl.bindVertexArray(mesh.wireFrameData.vao);
				gl.drawElements(gl.LINES, mesh.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);
			});

			// draw selected entities
			this.selectedEntities.forEach(entity => {
				const min = new vec3(entity.min[0], entity.min[1], entity.min[2]);
				const max = new vec3(entity.max[0], entity.max[1], entity.max[2]);
				const origin = vec3.parse(entity.keyvalues.origin);
				drawBox(min, max, origin, [0, 1, 0, 1]);
			});
		}

		gl.bindVertexArray(null);
		gl.useProgram(null);

		// draw gizmos
		switch (this.mode) {
			case SelectMode.Vertex:
				this.drawVertexHandles(viewport);
				break;
			case SelectMode.Face:
				this.drawFaceHandles(viewport);
				break;
			case SelectMode.Edge:
				this.drawEdgeHandles(viewport);
				break;
		}

		// draw select box
		if (this.creatingSelectBox && viewport == editor.windowManager.activeWindow && !viewport.perspective) {
			gl.useProgram(solidShader.program);
			gl.bindVertexArray(rectVao);

			const selectMin = vec2.min(this.selectBoxStart, this.selectBoxEnd);
			const selectMax = vec2.max(this.selectBoxStart, this.selectBoxEnd);

			const selectCenter = selectMin.plus(selectMax).times(0.5);
			const selectScale = new vec2(selectMax.x - selectCenter.x, selectMax.y - selectCenter.y);

			const mat = mat4.identity();
			mat.translate(new vec3(selectCenter.x, selectCenter.y, 0));
			mat.scale(new vec3(selectScale.x, selectScale.y, 1));

			gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, mat4.identity().getData());
			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
			gl.uniform4fv(solidShader.colorUnif, [1, 1, 0, 1]);

			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

			gl.bindVertexArray(null);
			gl.useProgram(null);
		}
	}

	drawEdgeHandles(viewport: Viewport) {
		gl.useProgram(solidShader.program);
		gl.bindVertexArray(lineVao);
		gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)

		// perspective
		const p = viewport.camera.perspectiveMatrix.copy();
		p.setValue(3, 2, p.getValue(3, 2) - this.outlineFudge); // fudge the numbers for visibility
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, p.getData());

		gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

		// colour
		gl.uniform4fv(solidShader.colorUnif, new Float32Array([0, 1, 0, 1]));

		const drawEdgeHalf = (edge: EditorHalfEdge, directionIndicator = false) => {
			const a = edge.tail!.position;
			const b = edge.next!.tail!.position;

			gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]));
			gl.drawArrays(gl.LINES, 0, 2);
		}

		const drawEdge = (edge: EditorFullEdge | null) => {
			if (!edge) return;

			if (edge?.halfA && edge?.halfB) {
				// double sided
				drawEdgeHalf(edge.halfA);
			} else if (edge?.halfA) {
				// a
				drawEdgeHalf(edge.halfA, true);
			} else if (edge?.halfB) {
				// b
				drawEdgeHalf(edge.halfB, true);
			}
		}

		drawEdge(this.edgeUnderCursor);

		gl.disable(gl.DEPTH_TEST);

		gl.uniform4fv(solidShader.colorUnif, new Float32Array([1, 1, 0, 1]));
		this.selectedEdges.forEach(edge => {
			drawEdge(edge);
		});

		gl.enable(gl.DEPTH_TEST);

		gl.bindBuffer(gl.ARRAY_BUFFER, null)
		gl.bindVertexArray(null);
		gl.useProgram(null);
	}

	drawFaceHandles(viewport: Viewport) {
		gl.useProgram(solidShader.program);

		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, viewport.camera.perspectiveMatrix.getData());
		gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

		// face under cursor
		gl.uniform4fv(solidShader.colorUnif, [0.5, 0.8, 1, 0.2]);
		if (viewport.perspective) {
			const face = this.faceUnderCursor;
			if (face?.primitive && !this.selectedFaces.has(face)) {
				gl.bindVertexArray(face.primitive.vao);

				gl.drawElements(gl.TRIANGLES, face.elementCount, gl.UNSIGNED_SHORT, face.elementOffset * 2);

				gl.bindVertexArray(null);
			}
		}


		// selected faces
		gl.uniform4fv(solidShader.colorUnif, [1, 1, 0, 0.1]);
		this.selectedFaces.forEach(face => {
			if (face.primitive) {
				gl.bindVertexArray(face.primitive.vao);

				gl.drawElements(gl.TRIANGLES, face.elementCount, gl.UNSIGNED_SHORT, face.elementOffset * 2);

				gl.bindVertexArray(null);
			}
		})

		gl.useProgram(null);
	}

	drawVertexHandles(viewport: Viewport) {
		// todo: use point sprites

		gl.useProgram(solidShader.program);

		// make em slightly more visible than they should be
		const p = viewport.camera.perspectiveMatrix.copy();
		p.setValue(3, 2, p.getValue(3, 2) - 0.001);

		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, p.getData());
		gl.bindVertexArray(rectVao);

		gl.uniform4fv(solidShader.colorUnif, viewport.perspective ? [0.5, 0.8, 1, 1] : [1, 1, 1, 1]);

		const cameraQuat = viewport.camera.rotation;

		const meshSet = viewport.perspective ? this.selectedMeshes : editor.meshes;

		// vert gizmos
		meshSet.forEach(mesh => {
			mesh.verts.forEach((vert) => {
				let mat = viewport.camera.viewMatrix.copy();

				const pos = vert.position.multMat4(mat);

				mat.translate(vert.position);
				mat.rotate(cameraQuat);

				// don't do perspective divide
				if (viewport.perspective)
					mat.scale(new vec3(-pos.z, -pos.z, 1));
				else
					mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1));

				mat.scale(new vec3(0.01, 0.01, 1));

				gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			});
		})

		if (this.meshUnderCursor && !this.selectedMeshes.has(this.meshUnderCursor)) {
			this.meshUnderCursor.verts.forEach((vert) => {
				let mat = viewport.camera.viewMatrix.copy();

				const pos = vert.position.multMat4(mat);

				mat.translate(vert.position);
				mat.rotate(cameraQuat);

				// don't do perspective divide
				if (viewport.perspective)
					mat.scale(new vec3(-pos.z, -pos.z, 1));
				else
					mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1));

				mat.scale(new vec3(0.01, 0.01, 1));

				gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			});
		}

		gl.uniform4fv(solidShader.colorUnif, [1, 1, 0, 1]);

		gl.disable(gl.DEPTH_TEST);

		// selected vert gizmos
		if (this.mode == SelectMode.Vertex) {
			this.selectedVertices.forEach(thing => {
				let mat = viewport.camera.viewMatrix.copy();

				const vert = thing as EditorVertex;

				const pos = vert.position.multMat4(mat);

				mat.translate(vert.position);
				mat.rotate(cameraQuat);

				// don't do perspective divide
				if (viewport.perspective)
					mat.scale(new vec3(-pos.z, -pos.z, 1));
				else
					mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1));

				mat.scale(new vec3(0.015, 0.015, 1));

				gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			});

			// draw vertex under cursor
			gl.uniform4fv(solidShader.colorUnif, [0, 1, 0, 1]);

			if (this.vertexUnderCursor && !this.selectedVertices.has(this.vertexUnderCursor)) {
				let mat = viewport.camera.viewMatrix.copy();

				const vert = this.vertexUnderCursor as EditorVertex;

				const pos = vert.position.multMat4(mat);

				mat.translate(vert.position);
				mat.rotate(cameraQuat);

				// don't do perspective divide
				if (viewport.perspective)
					mat.scale(new vec3(-pos.z, -pos.z, 1));
				else
					mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1));

				mat.scale(new vec3(0.015, 0.015, 1));

				gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
				gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
			}
		}

		gl.enable(gl.DEPTH_TEST);

		gl.bindVertexArray(null);
		gl.useProgram(null);
	}

	getMeshUnderCursor(viewport: Viewport, generous: boolean = false): {
		mesh: EditorMesh | null,
		face: EditorFace | null,
		dist: number
	} {
		// drawLine(ray.origin, ray.origin.plus(ray.direction.times(100)), [1, 0, 0, 1], 0);

		// try a bunch of rays to make it easier to select stuff
		const baseRay = viewport.screenRay(viewport.getRelativeMousePos());
		let ray: Ray = { origin: baseRay.origin, direction: vec3.copy(baseRay.direction) };

		let results: {
			mesh: EditorMesh | null,
			face: EditorFace | null,
			dist: number
		}[] = [];

		const ignoreBackfaces = this.mode == SelectMode.Face || this.mode == SelectMode.Mesh;

		// center ray
		results.push(editor.castRay(baseRay, ignoreBackfaces));

		if (generous) {
			results[0].dist -= 2; // bias towards center

			const increment = 0.1;
			const size = 2;

			let xDir = new vec3(1, 0, 0).rotate(viewport.camera.rotation);
			let yDir = new vec3(0, 1, 0).rotate(viewport.camera.rotation);

			let xOffset = -increment / 2;
			for (let x = 0; x < size; ++x) {
				let yOffset = -increment / 2;

				for (let y = 0; y < size; ++y) {
					ray.direction = baseRay.direction.plus(xDir.times(xOffset)).plus(yDir.times(yOffset));

					ray.direction.normalise();

					results.push(editor.castRay(ray, ignoreBackfaces));

					yOffset += increment;
				}

				xOffset += increment;
			}
		}

		let closest: {
			mesh: EditorMesh | null,
			face: EditorFace | null,
			dist: number
		} = {
			mesh: null,
			face: null,
			dist: Infinity
		}
		for (let i = 0; i < results.length; ++i) {
			const result = results[i];
			if (result.dist < closest.dist) {
				closest = result;
			}
		}

		return { mesh: closest.mesh, face: closest.face, dist: closest.dist };
	}

	override mouse(button: number, pressed: boolean): boolean {
		const viewport = editor.windowManager.activeWindow as Viewport;

		if (button == 0) {
			if (pressed) {
				if (!this.startDrag(viewport)) {
					if (!viewport.perspective) {
						// create a select box
						this.selectBoxStart = viewport.getGlMousePos();
						this.selectBoxEnd = vec2.copy(this.selectBoxStart);
						this.creatingSelectBox = true;
						editor.windowManager.lockActive = true;
					}
				}
			} else {
				this.dragging = false;
				this.creatingSelectBox = false;

				editor.windowManager.lockActive = false;

				const hasntSelectBoxed = this.selectBoxStart.equals(this.selectBoxEnd);

				if (!this.hasDragged && hasntSelectBoxed) {
					this.select();
				} else if (!hasntSelectBoxed)
					this.getUnderSelectBox();

				this.hasDragged = false;

				this.startDragPos.x = 0;
				this.startDragPos.y = 0;
				this.startDragPos.z = 0;
				this.dragPos.x = 0;
				this.dragPos.y = 0;
				this.dragPos.z = 0;

				this.selectBoxStart.x = 0;
				this.selectBoxStart.y = 0;
				this.selectBoxEnd.x = 0;
				this.selectBoxEnd.y = 0;
			}

			return true;
		}

		return false;
	}

	getUnderSelectBox() {
		switch (this.mode) {
			case SelectMode.Vertex:
				const viewport = editor.windowManager.activeWindow as Viewport;

				const persp = viewport.camera.perspectiveMatrix.copy();
				const view = viewport.camera.viewMatrix.copy();

				// don't remap z
				persp.setValue(2, 2, 1);
				persp.setValue(3, 2, 0);

				const toScreen = persp.multiply(view);

				const min = vec2.min(this.selectBoxStart, this.selectBoxEnd);
				const max = vec2.max(this.selectBoxStart, this.selectBoxEnd);

				const inner = (vert: EditorVertex) => {
					const screenPoint = vert.position.multMat4(toScreen);

					const screen2D = new vec2(screenPoint.x, screenPoint.y);

					if (screen2D.x > min.x && screen2D.x < max.x && screen2D.y > min.y && screen2D.y < max.y) {
						// vert is in box
						this.selectedVertices.add(vert);
						// const edge: EditorHalfEdge = vert.edges.values().next().value;
						// if (edge && edge.face?.mesh)
						// 	this.selectedMeshes.add(edge.face.mesh);
						return true;
					}

					return false;
				}

				editor.meshes.forEach(mesh => {
					let addedMeshVert = false;

					mesh.verts.forEach(vert => {
						const b = inner(vert);

						if (b) addedMeshVert = true;
					});

					if (addedMeshVert)
						this.selectedMeshes.add(mesh);
				});
		}
	}

	hasDragged = false;
	startDrag(viewport: Viewport): boolean {
		// probably don't want to drag
		if (document.body.style.cursor != "move")
			return false;

		if (!this.vertexUnderCursor)
			return false;

		editor.gridRotation = gMath.getClosestCardinalRotation(viewport.camera.rotation);
		editor.moveGridToPoint(this.vertexUnderCursor.position);
		this.vertexUnderCursor = null;

		this.dragging = true;
		this.hasDragged = false;
		this.dragPos = viewport.getMouseWorldRounded();
		this.startDragPos = vec3.copy(this.dragPos);

		editor.windowManager.lockActive = true;

		return true;
	}

	select() {
		if (!editor.windowManager.activeWindow) return;

		const addThing = (remove: boolean = false) => {
			switch (this.mode) {
				case SelectMode.Vertex:
					if (this.vertexUnderCursor) {
						if (!remove) {
							const edge: EditorHalfEdge = this.vertexUnderCursor.edges.values().next().value;

							// also add mesh
							if (edge && edge.face?.mesh) {
								this.selectedVertices.add(this.vertexUnderCursor);
								this.selectedMeshes.add(edge.face.mesh);
							}
						}
						else
							this.selectedVertices.delete(this.vertexUnderCursor);
					}
					break;
				case SelectMode.Edge:
					if (this.edgeUnderCursor) {
						if (!remove) {
							const edge: EditorFullEdge = this.edgeUnderCursor;

							if (edge) {
								this.selectedEdges.add(edge);

								if (edge.halfA?.face?.mesh)
									this.selectedMeshes.add(edge.halfA.face.mesh);
								else if (edge.halfB?.face?.mesh)
									this.selectedMeshes.add(edge.halfB.face.mesh);
							}
						}
						else
							this.selectedEdges.delete(this.edgeUnderCursor);
					}
					break;
				case SelectMode.Face:
					if (this.faceUnderCursor) {
						if (!remove) {
							const mesh = this.faceUnderCursor.mesh;
							if (mesh) {
								this.selectedFaces.add(this.faceUnderCursor);
								this.selectedMeshes.add(mesh);
							}
						}
						else {
							this.selectedFaces.delete(this.faceUnderCursor);
						}
					}
					break;
				case SelectMode.Mesh:
					if (!this.entityUnderCursor) {
						const m = this.meshUnderCursor;
						if (m && !remove)
							this.selectedMeshes.add(m);
					} else {
						const e = this.entityUnderCursor;
						if (!remove)
							this.selectedEntities.add(e);
					}
					break;
				case SelectMode.Entity:
					if (this.entityUnderCursor) {
						const e = this.entityUnderCursor;
						if (!remove)
							this.selectedEntities.add(e);
					}
					break;
			}

			PropertiesPanel.updateProperties();
		}

		if (getSdkKeyDown("ShiftLeft")) {
			addThing();
		} else if (getSdkKeyDown("ControlLeft")) {
			if (this.mode != SelectMode.Mesh) {
				addThing(true);
				this.vertexUnderCursor = null;

				// make sure each mesh still has a selected thing
				this.selectedMeshes.forEach(mesh => {
					let it: any;
					switch (this.mode) {
						case SelectMode.Vertex:
							it = mesh.verts.values();
							break;
						case SelectMode.Edge:
							it = mesh.edges.values();
							break;
						case SelectMode.Face:
							it = mesh.faces.values();
							break;
					}

					if (!it) return;

					let i = it.next();
					while (!i.done) {
						const v: any = i.value;

						// we're good :)
						switch (this.mode) {
							case SelectMode.Vertex:
								if (this.selectedVertices.has(v))
									return;
								break;
							case SelectMode.Edge:
								if (this.selectedEdges.has(v))
									return;
								break;
							case SelectMode.Face:
								if (this.selectedFaces.has(v))
									return;
								break;
						}

						i = it.next();
					}

					// bad mesh >:(
					this.selectedMeshes.delete(mesh);
				});
			} else {
				if (!this.entityUnderCursor) {
					const m = this.meshUnderCursor;
					if (m)
						this.selectedMeshes.delete(m);
				} else {
					const e = this.entityUnderCursor;
					this.selectedEntities.delete(e);
				}
			}
		} else {
			this.clearSelected();
			addThing();
		}
	}

	clearSelected() {
		this.selectedVertices.clear();
		this.selectedEdges.clear();
		this.selectedFaces.clear();
		this.selectedMeshes.clear();
		this.selectedEntities.clear();

		PropertiesPanel.updateProperties();
	}

	clearSelectionState(dontRefresh = false) {
		this.faceUnderCursor = null;
		this.vertexUnderCursor = null;
		this.edgeUnderCursor = null;
		this.meshUnderCursor = null;
		this.entityUnderCursor = null;

		if (!dontRefresh)
			this.mouseMove(0, 0); // ux
	}

	getEntityUnderCursor(viewport: Viewport, maxDist: number): any {
		const ray = viewport.mouseRay();

		let bestDist = maxDist;
		let bestEntity: any = null;

		editor.entities.forEach(entity => {
			const min = new vec3(entity.min[0], entity.min[1], entity.min[2]);
			const max = new vec3(entity.max[0], entity.max[1], entity.max[2]);
			const origin = vec3.parse(entity.keyvalues.origin);
			const t = gMath.clipRayToAABB(ray, min, max, origin);

			if (t && t < bestDist) {
				bestDist = t;
				bestEntity = entity;
			}
		});

		return bestEntity;
	}

	getEdgeUnderCursor(viewport: Viewport): EditorFullEdge | null {
		if (!this.faceUnderCursor) return null;

		const persp = viewport.camera.perspectiveMatrix.copy();
		const view = viewport.camera.viewMatrix.copy();

		// don't remap z
		persp.setValue(2, 2, 1);
		persp.setValue(3, 2, 0);

		const toScreen = persp.multiply(view);

		const cursor = viewport.getGlMousePos();

		// get the closest edge on the face under the cursor
		let bestDist = 0.02;
		let bestEdge: EditorHalfEdge | null = null;

		const edgeToScreen = (edge: EditorHalfEdge) => {
			let start = edge.tail!.position.multMat4(toScreen);
			let end = edge.next!.tail!.position.multMat4(toScreen);

			// todo: clip

			if (viewport.perspective) {
				start.x /= -start.z;
				start.y /= -start.z;
				end.x /= -end.z;
				end.y /= -end.z;
			}

			const start2D = new vec2(start.x, start.y);
			const end2D = new vec2(end.x, end.y);

			return {
				a: start2D,
				b: end2D
			}
		}

		const start = this.faceUnderCursor.halfEdge!;
		let edge = start;
		do {
			// get distance to cursor
			const s = edgeToScreen(edge);

			const a = s.a;
			const b = s.b;

			// drawLineScreen(vec3.from2(a), vec3.from2(b), [1, 0, 0, 1]);

			const dist = gMath.sqrDistToLine(a, b, cursor);

			if (dist < bestDist) {
				bestDist = dist;
				bestEdge = edge;
			}

			edge = edge!.next!;
		} while (edge != start)

		if (bestEdge?.full) return bestEdge.full;

		return null;
	}

	getVertexUnderCursor(viewport: Viewport, selectedOnly: boolean = false): EditorVertex | null {
		const persp = viewport.camera.perspectiveMatrix.copy();
		const view = viewport.camera.viewMatrix.copy();

		// don't remap z
		persp.setValue(2, 2, 1);
		persp.setValue(3, 2, 0);

		const toScreen = persp.multiply(view);

		const cursor = viewport.getGlMousePos();

		let bestDist = 0.01;
		let bestVertex: EditorVertex | null = null;

		const inner = (vert: EditorVertex) => {
			const screenPoint = vert.position.multMat4(toScreen);

			if (viewport.perspective) {
				screenPoint.x /= -screenPoint.z;
				screenPoint.y /= -screenPoint.z;
			}

			const screen2D = new vec2(screenPoint.x, screenPoint.y);

			const d = vec2.sqrDist(cursor, screen2D) + -screenPoint.z * 0.000001; // bias to closer

			if (d < bestDist) {
				bestDist = d;
				bestVertex = vert;
			}
		}

		if (!selectedOnly) {
			if (viewport.perspective) {
				// only do face under cursor
				if (!this.faceUnderCursor)
					return null;

				const start = this.faceUnderCursor.halfEdge;
				let edge: EditorHalfEdge = this.faceUnderCursor.halfEdge!;
				do {
					inner(edge.tail!);

					if (edge.next)
						edge = edge.next;
					else
						break;
				} while (edge != start);
			} else {
				// do all vertices for 2d
				editor.meshes.forEach(mesh => {
					mesh.verts.forEach(vert => {
						inner(vert);
					});
				});
			}
		} else {
			const it = this.selectedVertices.values();
			let i = it.next();
			while (!i.done) {
				inner(i.value as EditorVertex);

				i = it.next();
			}
		}

		// console.log(bestDist);

		return bestVertex;
	}

	selectAll() {
		if (this.mode == SelectMode.Mesh) {
			editor.meshes.forEach(mesh => {
				this.selectedMeshes.add(mesh);
			})
			editor.entities.forEach(entity => {
				this.selectedEntities.add(entity);
			})
			PropertiesPanel.updateProperties();
			return;
		}

		const selectMesh = (mesh: EditorMesh) => {
			switch (this.mode) {
				case SelectMode.Vertex:
					mesh.verts.forEach(vert => {
						this.selectedVertices.add(vert);
					})
					break;
				case SelectMode.Edge:
					mesh.edges.forEach(edge => {
						this.selectedEdges.add(edge);
					})
					break;
				case SelectMode.Face:
					mesh.faces.forEach(face => {
						this.selectedFaces.add(face);
					})
					break;
			}
		}

		this.selectedMeshes.forEach(mesh => {
			selectMesh(mesh);
		});
		if (this.meshUnderCursor && this.selectedMeshes.size == 0) {
			selectMesh(this.meshUnderCursor);
			this.selectedMeshes.add(this.meshUnderCursor);
		}

		PropertiesPanel.updateProperties();
	}
}