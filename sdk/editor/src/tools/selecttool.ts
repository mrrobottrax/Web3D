import { gl, solidShader } from "../../../../src/client/render/gl.js";
import { drawLine, drawLineScreen } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorFace, EditorHalfEdge, EditorMesh, EditorVertex } from "../mesh/editormesh.js";
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

	meshUnderCursor: EditorMesh | null = null;
	faceUnderCursor: EditorFace | null = null;
	vertexUnderCursor: EditorVertex | null = null;

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

	override close(): void {
		this.meshUnderCursor = null;
		this.faceUnderCursor = null;
		this.vertexUnderCursor = null;

		this.selectedMeshes.clear();
		this.selectedVertices.clear();
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

	override mouseMove(dx: number, dy: number): boolean {
		if (!editor.windowManager.activeWindow) return false;

		const activeViewport = editor.windowManager.activeWindow as Viewport;

		if (activeViewport.looking || !activeViewport.threeD) return false;

		const underCursor = this.getMeshUnderCursor(activeViewport);
		if (underCursor.mesh) {
			this.meshUnderCursor = underCursor.mesh;
			this.faceUnderCursor = underCursor.face;
		}

		this.vertexUnderCursor = this.getVertexUnderCursor(activeViewport);

		return false;
	}

	drawGizmos(viewport: Viewport) {
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

		// mesh under cursor
		if (viewport.threeD) {
			if (this.meshUnderCursor && !this.selectedMeshes.has(this.meshUnderCursor)) {
				gl.bindVertexArray(this.meshUnderCursor.wireFrameData.vao);

				gl.uniform4fv(solidShader.colorUnif, [0.5, 0.8, 1, 1]);
				gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

				gl.drawElements(gl.LINES, this.meshUnderCursor.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);
			}
		}

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

				gl.uniform4fv(solidShader.colorUnif, viewport.threeD ? [0.5, 0.8, 1, 1] : [1, 1, 1, 1]);

				const cameraQuat = viewport.camera.rotation;

				const meshSet = viewport.threeD ? this.selectedMeshes : editor.meshes;

				// vert gizmos
				meshSet.forEach(mesh => {
					mesh.verts.forEach((vert) => {
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

				if (this.meshUnderCursor && !this.selectedMeshes.has(this.meshUnderCursor)) {
					this.meshUnderCursor.verts.forEach((vert) => {
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
				}

				gl.uniform4fv(solidShader.colorUnif, [1, 1, 0, 1]);

				gl.disable(gl.DEPTH_TEST);

				// selected vert gizmos
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

				if (this.vertexUnderCursor && !this.selectedVertices.has(this.vertexUnderCursor)) {
					let mat = viewport.camera.viewMatrix.copy();

					const pos = this.vertexUnderCursor.position.multMat4(mat);

					mat.translate(this.vertexUnderCursor.position);
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
			const m = this.meshUnderCursor;

			if (v && m) {
				if (getKeyDown("ShiftLeft")) {
					this.selectedVertices.add(v);
					this.selectedMeshes.add(m);
				} else if (getKeyDown("ControlLeft")) {
					this.selectedVertices.delete(v);

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
					this.selectedVertices.add(v);
					this.selectedMeshes.add(m);
				}
			}
		} else {

		}
	}

	getVertexUnderCursor(viewport: Viewport): EditorVertex | null {
		if (!this.faceUnderCursor)
			return null;

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

		const start = this.faceUnderCursor.halfEdge;
		let edge: EditorHalfEdge = this.faceUnderCursor.halfEdge!;
		do {
			const screenPoint = edge.tail!.position.multMat4(toScreen);

			screenPoint.x /= -screenPoint.z;
			screenPoint.y /= -screenPoint.z;

			const screen2D = new vec2(screenPoint.x, screenPoint.y);

			const d = vec2.sqrDist(cursor, screen2D);

			if (d < bestDist) {
				bestDist = d;
				bestVertex = edge.tail;
			}

			if (edge.next)
				edge = edge.next;
			else
				break;
		} while (edge != start);

		// console.log(bestDist);

		return bestVertex;
	}
}