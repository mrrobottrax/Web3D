import { defaultShader, gl, solidShader } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorFace, EditorFullEdge, EditorHalfEdge, EditorMesh, EditorVertex } from "../mesh/editormesh.js";
import { getKeyDown } from "../system/input.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

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

	dragPos: vec3 = vec3.origin();
	dragging: boolean = false;

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
		this.meshUnderCursor = null;
		this.faceUnderCursor = null;
		this.vertexUnderCursor = null;

		this.selectedMeshes.clear();
		this.selectedVertices?.clear();
	}

	setSelectMode(selectMode: SelectMode) {
		this.mode = selectMode;
		this.selectedMeshes.clear();
		this.selectedVertices.clear();
		this.faceUnderCursor = null;
		this.meshUnderCursor = null;
		this.vertexUnderCursor = null;

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
							(thing as EditorVertex).position.add(delta);
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

						v.updateVisuals();

						i = it.next()
					}
				}
			}

			this.dragPos = end;
			return false;
		}


		const underCursor = this.getMeshUnderCursor(activeViewport);
		if (underCursor.mesh) {
			this.meshUnderCursor = underCursor.mesh;
			this.faceUnderCursor = underCursor.face;
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
				const it = this.selectedMeshes.values();
				let i = it.next();
				while (!i.done) {
					const mesh = i.value;

					mesh.cleanUpGl();
					editor.meshes.delete(mesh);

					i = it.next();
				}
				break;
		}

		this.selectedMeshes.clear();
		this.selectedVertices.clear();
		this.vertexUnderCursor = null;
		this.faceUnderCursor = null;
		this.meshUnderCursor = null;
	}

	drawGizmos(viewport: Viewport) {
		if (this.mode != SelectMode.Mesh) {
			// draw selected mesh outlines
			gl.useProgram(solidShader.program);
			const p = viewport.camera.perspectiveMatrix.copy();
			p.setValue(3, 2, p.getValue(3, 2) - 0.001); // fudge the numbers for visibility
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
			p.setValue(3, 2, p.getValue(3, 2) - 0.0005); // fudge the numbers for visibility
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

				gl.uniform4fv(defaultShader.colorUnif, [1, 1, 0.2, 1]);

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
		switch (this.mode) {
			case SelectMode.Vertex:
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
				break;
		}

		gl.enable(gl.DEPTH_TEST);

		gl.bindVertexArray(null);
		gl.useProgram(null);
	}

	getMeshUnderCursor(viewport: Viewport): {
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

					// ignore backfaces
					// if (vec3.dot(tri.normal, ray.direction) > 0)
					// 	continue;

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

		if (!viewport.perspective) {
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
				if (!this.startDrag(viewport))
					this.select();
			} else {
				this.dragging = false;
			}

			return true;
		}

		return false;
	}

	startDrag(viewport: Viewport): boolean {
		// probably don't want to drag
		if (document.body.style.cursor != "move")
			return false;

		this.dragging = true;
		this.dragPos = viewport.getMouseWorldRounded();

		return true;
	}

	select() {
		const m = this.meshUnderCursor;

		const addThing = (remove: boolean = false) => {
			switch (this.mode) {
				case SelectMode.Vertex:
					if (this.vertexUnderCursor) {
						if (!remove)
							this.selectedVertices.add(this.vertexUnderCursor);
						else
							this.selectedVertices.delete(this.vertexUnderCursor);
					}
					break;
				case SelectMode.Face:
					if (this.faceUnderCursor) {
						if (!remove)
							this.selectedFaces.add(this.faceUnderCursor);
						else
							this.selectedFaces.delete(this.faceUnderCursor);
					}
					break;
			}
		}

		if (getKeyDown("ShiftLeft") && m) {
			addThing();
			this.selectedMeshes.add(m);
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
				if (m)
					this.selectedMeshes.delete(m);
			}
		} else if (m) {
			this.selectedVertices.clear();
			this.selectedFaces.clear();
			this.selectedMeshes.clear();
			this.selectedMeshes.add(m);
			addThing();
		}
	}

	getVertexUnderCursor(viewport: Viewport, selectedOnly: boolean = false): EditorVertex | null {
		const persp = viewport.camera.perspectiveMatrix.copy();
		const view = viewport.camera.viewMatrix.copy();

		// don't remap z
		persp.setValue(2, 2, 1);
		persp.setValue(3, 2, 0);

		const toScreen = persp.multiply(view);

		const cursor = viewport.getRelativeMousePos().minus(viewport.size.times(0.5));
		cursor.x /= viewport.size.x * 0.5;
		cursor.y /= viewport.size.y * 0.5;

		let bestDist = 0.002;
		let bestVertex: EditorVertex | null = null;

		const inner = (vert: EditorVertex) => {
			const screenPoint = vert.position.multMat4(toScreen);

			if (viewport.perspective) {
				screenPoint.x /= -screenPoint.z;
				screenPoint.y /= -screenPoint.z;
			}

			const screen2D = new vec2(screenPoint.x, screenPoint.y);

			const d = vec2.sqrDist(cursor, screen2D);

			if (d < bestDist) {
				bestDist = d;
				bestVertex = vert;
			}
		}

		if (!selectedOnly) {
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
}