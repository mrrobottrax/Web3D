import { defaultShader, gl, solidShader } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorFace, EditorFullEdge, EditorHalfEdge, EditorMesh, EditorVertex } from "../mesh/editormesh.js";
import { getKeyDown } from "../system/input.js";
import { PropertiesPanel } from "../system/propertiespanel.js";
import { Viewport } from "../windows/viewport.js";
import { Tool, ToolEnum } from "./tool.js";

export enum SelectMode {
	Vertex,
	Edge,
	Face,
	Mesh
}

export class SelectTool extends Tool {
	mode: SelectMode = SelectMode.Mesh;

	vertexButton: HTMLElement | null;
	edgeButton: HTMLElement | null;
	faceButton: HTMLElement | null;
	meshButton: HTMLElement | null;

	meshUnderCursor: EditorMesh | null = null;
	faceUnderCursor: EditorFace | null = null;
	vertexUnderCursor: EditorVertex | null = null;

	selectedMeshes: Set<EditorMesh> = new Set();
	selectedVertices = new Set<EditorVertex>();
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

		if (!(this.vertexButton && this.edgeButton && this.faceButton
			&& this.meshButton)) {
			console.error("MISSING BUTTONS!");
			return;
		}

		this.vertexButton.onclick = () => this.setSelectMode(SelectMode.Vertex);
		this.edgeButton.onclick = () => this.setSelectMode(SelectMode.Edge);
		this.faceButton.onclick = () => this.setSelectMode(SelectMode.Face);
		this.meshButton.onclick = () => this.setSelectMode(SelectMode.Mesh);

		this.updateModeGraphics();
	}

	override close(): void {
		this.clearSelected();
		this.clearSelectionState();
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
		}
	}

	override mouseMove(dx: number, dy: number): boolean {
		if (!editor.windowManager.activeWindow) return false;

		const activeViewport = editor.windowManager.activeWindow as Viewport;

		if (activeViewport.looking) return false;

		if (this.dragging) {
			const start = this.dragPos;
			const end = activeViewport.getMouseWorldRounded();

			if (!start.equals(end)) {
				const delta = end.minus(start);

				const move = (thing: EditorVertex | EditorFullEdge | EditorFace | EditorMesh,
					delta: vec3) => {
					switch (this.mode) {
						case SelectMode.Vertex:
							const v = thing as EditorVertex;
							v.position.add(delta);
							v.position.x = Math.round(v.position.x / editor.gridSize) * editor.gridSize;
							v.position.y = Math.round(v.position.y / editor.gridSize) * editor.gridSize;
							v.position.z = Math.round(v.position.z / editor.gridSize) * editor.gridSize;
							break;
					}
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

		if (activeViewport.perspective
			|| (!activeViewport.perspective && this.mode == SelectMode.Mesh || this.mode == SelectMode.Face)) {
			const underCursor = this.getMeshUnderCursor(activeViewport, activeViewport.perspective && this.mode == SelectMode.Vertex);
			if (underCursor.mesh) {
				this.meshUnderCursor = underCursor.mesh;
				this.faceUnderCursor = underCursor.face;
			} else {
				this.faceUnderCursor = null;
			}
		}

		switch (this.mode) {
			case SelectMode.Vertex:
				// check if there is a selected vertex under the cursor
				this.vertexUnderCursor = this.getVertexUnderCursor(activeViewport, true);
				this.cursorMove = this.vertexUnderCursor != null;

				this.vertexUnderCursor = this.getVertexUnderCursor(activeViewport);
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
		this.cursorCopy = getKeyDown("ShiftLeft") || getKeyDown("ControlLeft");

		if (pressed) {
			switch (code) {
				case "Delete":
					this.deleteSelected();
					break;
			}
		}

		return false;
	}

	deleteSelected() {
		switch (this.mode) {
			case SelectMode.Mesh:
				{
					this.selectedMeshes.forEach(mesh => {
						mesh.cleanUpGl();
						editor.meshes.delete(mesh);
					});
				}
				break;
			case SelectMode.Face:
				{
					this.selectedFaces.forEach(face => {
						face.mesh?.faces.delete(face);

						// remove all connected half edges
						const startEdge = face.halfEdge!;
						let edge = startEdge;
						do {
							const mesh = face.mesh!;

							// remove half edges
							mesh.halfEdges.delete(edge);

							// remove half edges from vertices
							edge.tail?.edges.delete(edge);
							if (edge.tail?.edges.size == 0) mesh.verts.delete(edge.tail);

							// remove half edges from full edges
							if (edge.full?.halfA == edge) edge.full.halfA = null;
							if (edge.full?.halfB == edge) edge.full.halfB = null;
							if (!edge.full?.halfA && !edge.full?.halfB) mesh.edges.delete(edge.full!);

							// remove half edges from twins
							if (edge.twin) edge.twin.twin = null;

							if (edge?.next)
								edge = edge.next;
							else
								break;
						} while (edge != startEdge);
					});

					this.selectedMeshes.forEach(mesh => {
						mesh.updateShape();
					});
				}
				break;
		}

		this.clearSelected();
		this.clearSelectionState();
	}

	outlineFudge = 0.0002;
	drawGizmos(viewport: Viewport) {
		if (this.mode != SelectMode.Mesh) {
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
			})
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

	drawFaceHandles(viewport: Viewport) {
		gl.useProgram(defaultShader.program);

		gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, viewport.camera.perspectiveMatrix.getData());
		gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(defaultShader.samplerUnif, 0);

		if (viewport.perspective) {
			const face = this.faceUnderCursor;
			if (face?.primitive) {
				gl.bindVertexArray(face.primitive.vao);
				gl.bindTexture(gl.TEXTURE_2D, face.primitive.texture);

				gl.uniform4fv(defaultShader.colorUnif, [0.5, 0.8, 1, 1]);

				gl.drawElements(gl.TRIANGLES, face.elementCount, gl.UNSIGNED_SHORT, face.elementOffset * 2);

				gl.bindTexture(gl.TEXTURE_2D, null);
				gl.bindVertexArray(null);
			}
		}

		this.selectedFaces.forEach(face => {
			if (face.primitive) {
				gl.bindVertexArray(face.primitive.vao);
				gl.bindTexture(gl.TEXTURE_2D, face.primitive.texture);

				gl.uniform4fv(defaultShader.colorUnif, [1, 1, 0.8, 1]);

				gl.drawElements(gl.TRIANGLES, face.elementCount, gl.UNSIGNED_SHORT, face.elementOffset * 2);

				gl.bindTexture(gl.TEXTURE_2D, null);
				gl.bindVertexArray(null);
			}
		})

		gl.useProgram(null);
	}

	drawVertexHandles(viewport: Viewport) {
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
			gl.uniform4fv(solidShader.colorUnif, [1, 1, 1, 1]);

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
	} {
		// drawLine(ray.origin, ray.origin.plus(ray.direction.times(100)), [1, 0, 0, 1], 0);
		const castRay = (ray: Ray) => {
			let bestMesh: EditorMesh | null = null;
			let bestFace: EditorFace | null = null;
			let bestDist = Infinity;

			const it = editor.meshes.values();
			let i = it.next();
			while (!i.done) {
				const mesh = i.value;

				for (let i = 0; i < mesh.collisionTris.length; ++i) {
					const tri = mesh.collisionTris[i];

					if (this.mode == SelectMode.Face)
						// ignore backfaces
						if (vec3.dot(tri.normal, ray.direction) > 0)
							continue;

					let positions = [
						tri.edge1.tail!.position,
						tri.edge2.tail!.position,
						tri.edge3.tail!.position,
					]

					// find where ray and plane intersect
					const denom = vec3.dot(tri.normal, ray.direction);

					if (Math.abs(denom) == 0)
						continue;

					let t = (-vec3.dot(tri.normal, ray.origin) + tri.dist) / denom;
					if (t < 0)
						continue;

					// get plane axis
					const x = positions[1].minus(positions[0]).normalised();
					const y = vec3.cross(tri.normal, x).normalised();

					const point = ray.origin.plus(ray.direction.times(t));
					const pointTrans = new vec3(vec3.dot(x, point), vec3.dot(y, point), 0);

					let insideTri = true;

					// for each edge
					for (let i = 0; i < 3; ++i) {
						// check if point is inside
						const nextPoint = positions[(i + 1) % 3];
						const edgeDir = nextPoint.minus(positions[i]);

						const vertTrans = new vec3(vec3.dot(x, positions[i]), vec3.dot(y, positions[i]), 0);
						const edgeDirTrans = new vec3(vec3.dot(edgeDir, x), vec3.dot(edgeDir, y), 0);

						const edgeLeftTrans = new vec3(-edgeDirTrans.y, edgeDirTrans.x, 0);

						const isInside = vec3.dot(edgeLeftTrans, pointTrans) >= vec3.dot(edgeLeftTrans, vertTrans);
						if (!isInside) {
							insideTri = false;
							break;
						}
					}

					if (insideTri && t < bestDist) {
						bestDist = t;
						bestMesh = mesh;
						bestFace = tri.edge1.face;
					}
				}

				i = it.next();
			};

			return { mesh: bestMesh, face: bestFace, dist: bestDist };
		};

		// try a bunch of rays to make it easier to select stuff
		const baseRay = viewport.mouseRay();
		let ray: Ray = { origin: baseRay.origin, direction: vec3.copy(baseRay.direction) };

		let results: {
			mesh: EditorMesh | null,
			face: EditorFace | null,
			dist: number
		}[] = [];

		// center ray
		results.push(castRay(baseRay));

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

					results.push(castRay(ray));

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

		return { mesh: closest.mesh, face: closest.face };
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

				// hasn't dragged
				const hasntDragged = this.dragPos.equals(this.startDragPos);
				const hasntSelectBoxed = this.selectBoxStart.equals(this.selectBoxEnd);

				if (hasntDragged && hasntSelectBoxed) {
					this.select();
				} else if (!hasntSelectBoxed)
					this.getUnderSelectBox();

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

	startDrag(viewport: Viewport): boolean {
		// probably don't want to drag
		if (document.body.style.cursor != "move")
			return false;

		this.dragging = true;
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

							if (edge && edge.face?.mesh) {
								this.selectedVertices.add(this.vertexUnderCursor);
								this.selectedMeshes.add(edge.face.mesh);
							}
						}
						else
							this.selectedVertices.delete(this.vertexUnderCursor);
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
					const m = this.meshUnderCursor;
					if (m && !remove)
						this.selectedMeshes.add(m);
					break;
			}

			PropertiesPanel.updateProperties();
		}

		if (getKeyDown("ShiftLeft")) {
			addThing();
		} else if (getKeyDown("ControlLeft")) {
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
						case SelectMode.Face:
							it = mesh.faces.values();
							break;
					}

					let i = it.next();
					while (!i.done) {
						const v: any = i.value;

						// we're good :)
						switch (this.mode) {
							case SelectMode.Vertex:
								if (this.selectedVertices.has(v))
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
				const m = this.meshUnderCursor;
				if (m)
					this.selectedMeshes.delete(m);
			}
		} else {
			this.clearSelected();
			addThing();
		}
	}

	clearSelected() {
		this.selectedVertices.clear();
		this.selectedFaces.clear();
		this.selectedMeshes.clear();

		PropertiesPanel.updateProperties();
	}

	clearSelectionState() {
		this.faceUnderCursor = null;
		this.meshUnderCursor = null;
		this.vertexUnderCursor = null;
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
		if (this.meshUnderCursor) {
			selectMesh(this.meshUnderCursor);
			this.selectedMeshes.add(this.meshUnderCursor);
		}

		PropertiesPanel.updateProperties();
	}
}