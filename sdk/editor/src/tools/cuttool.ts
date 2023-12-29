import { SharedAttribs, gl, lineBuffer, solidShader } from "../../../../src/client/render/gl.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorFace, EditorFullEdge, EditorHalfEdge, EditorVertex } from "../mesh/editormesh.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

enum PointType {
	edge,
	vertex,
	face
}

interface Point {
	position: vec3;
	type: PointType;

	edge?: EditorHalfEdge;

	vertex?: EditorVertex
}

export class CutTool extends Tool {
	allPoints: Set<Point> = new Set();
	closestPoint: Point | null = null;

	cutting: boolean = false;
	cuttingFace!: EditorFace;

	points: Point[] = [];

	override mouse(button: number, pressed: boolean): boolean {
		if (button == 0 && pressed) {
			if (this.cutting) this.addPoint();
			else this.startCutting();
		}

		return false;
	}

	override key(code: string, pressed: boolean): boolean {
		if (pressed) {
			if (code == "Enter") {
				this.finishCut();
			} else if (code == "Escape") {
				this.cancelCut();
			}
		}

		return false;
	}

	startCutting() {
		this.cutting = true;
		console.log("START");

		if (!editor.selectTool.faceUnderCursor) { console.error("PROBLEM!??"); return; };

		this.cuttingFace = editor.selectTool.faceUnderCursor;
		this.points = [];

		this.addPoint();
	}

	addPoint() {
		console.log("Add point");
		if (this.closestPoint)
			this.points.push(this.closestPoint);
	}

	finishCut() {
		console.log("DONE");

		// for each line
		this.points.forEach((point, index) => {
			if (this.points.length <= index + 1) return;

			const next = this.points[index + 1];

			// todo: allow other types of points

			// add vertex in the middle of the first edge
			const full = point.edge!.full;
			const mesh = point.edge!.face!.mesh!;

			const newFull: EditorFullEdge = {
				halfA: null,
				halfB: null
			}

			const newVert: EditorVertex = {
				position: point.position,
				edges: new Set()
			}

			// mesh.edges.add(newFull);
			// mesh.verts.add(newVert);

			let c: EditorHalfEdge | null = null;
			let d: EditorHalfEdge | null = null;

			if (full?.halfA) {
				console.log("A");

				// const a = full.halfA;

				// c = {
				// 	prev: a,
				// 	next: a.next,
				// 	twin: null,
				// 	face: a.face,
				// 	full: newFull,
				// 	tail: newVert
				// }

				// newFull.halfA = c;
				// a.next!.prev = c;
				// a.next = c;

				// mesh.halfEdges.add(c);
			}

			if (full?.halfB) {
				console.log("B");

				// const b = full.halfB;

				// d = {
				// 	prev: b.prev,
				// 	next: b,
				// 	twin: null,
				// 	face: b.face,
				// 	full: newFull,
				// 	tail: b.tail
				// }

				// b.tail = newVert;

				// newFull.halfB = d;
				// b.prev!.next = d;
				// b.prev = d;

				// mesh.halfEdges.add(d);
			}
			
			// if (c && d) {
			// 	c.twin = d;
			// 	d.twin = c;
			// }
		});

		this.cutting = false;
		this.points = [];
	}

	cancelCut() {
		console.log("CANCEL");
		this.cutting = false;
		this.points = [];
	}

	draw(viewport: Viewport) {
		const select = editor.selectTool;

		{
			// draw selected mesh outlines
			gl.useProgram(solidShader.program);
			const p = viewport.camera.perspectiveMatrix.copy();
			p.setValue(3, 2, p.getValue(3, 2) - select.outlineFudge); // fudge the numbers for visibility
			gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, p.getData());
			gl.uniform4fv(solidShader.colorUnif, [0.5, 0.8, 1, 1]);
			gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

			// mesh under cursor
			if (viewport.perspective) {
				if (select.meshUnderCursor) {
					gl.bindVertexArray(select.meshUnderCursor.wireFrameData.vao);

					gl.drawElements(gl.LINES, select.meshUnderCursor.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);
				}
			}
		}

		// make em slightly more visible than they should be
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, viewport.camera.perspectiveMatrix.getData());
		gl.bindVertexArray(rectVao);

		gl.uniform4fv(solidShader.colorUnif, viewport.perspective ? [0.5, 0.8, 1, 1] : [1, 1, 1, 1]);

		const cameraQuat = viewport.camera.rotation;

		gl.uniform4fv(solidShader.colorUnif, [1, 1, 0, 1]);

		gl.disable(gl.DEPTH_TEST);

		const drawPoint = (point: Point) => {
			let mat = viewport.camera.viewMatrix.copy();

			const pos = point.position.multMat4(mat);

			mat.translate(point.position);
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

		const drawLine = (point: Point, nextPoint: Point) => {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([
				point.position.x, point.position.y, point.position.z,
				nextPoint.position.x, nextPoint.position.y, nextPoint.position.z]));

			gl.drawArrays(gl.LINES, 0, 2);
		}

		// draw all points for debug
		// this.allPoints.forEach(point => {
		// 	drawPoint(point);
		// });

		if (this.closestPoint)
			drawPoint(this.closestPoint);

		this.points.forEach(point => {
			drawPoint(point);
		});

		gl.bindVertexArray(null);
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, viewport.camera.perspectiveMatrix.getData());
		gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());
		gl.uniform4fv(solidShader.colorUnif, [1, 0, 1, 1]);
		gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);

		this.points.forEach((point, index) => {
			let nextPoint: Point | null = this.points[index + 1];
			if (!nextPoint) nextPoint = this.closestPoint;
			if (nextPoint)
				drawLine(point, nextPoint);
		});

		gl.enable(gl.DEPTH_TEST);

		gl.bindVertexArray(null);
		gl.useProgram(null);
	}

	lastGridSize = 0;
	forceChange = false;
	override mouseMove(dx: number, dy: number): boolean {
		if (!editor.windowManager.activeWindow) return false;

		const viewport = editor.windowManager.activeWindow as Viewport;

		if (viewport.looking) return false;

		const select = editor.selectTool;

		if (!this.cutting) {
			const underCursor = select.getMeshUnderCursor(viewport);

			if (this.forceChange || (underCursor.face != select.faceUnderCursor || editor.gridSize != this.lastGridSize)) {
				this.lastGridSize = editor.gridSize;
				this.forceChange = false;

				// face has changed, recaulculate points
				if (underCursor.face) this.getPointsForFace(underCursor.face);
				else this.allPoints.clear();
			}

			select.meshUnderCursor = underCursor.mesh;
			select.faceUnderCursor = underCursor.face;
		}

		this.closestPoint = this.getClosestPoint(viewport);

		return false;
	}

	getClosestPoint(viewport: Viewport): Point | null {
		const persp = viewport.camera.perspectiveMatrix.copy();
		const view = viewport.camera.viewMatrix.copy();

		// don't remap z
		persp.setValue(2, 2, 1);
		persp.setValue(3, 2, 0);

		const toScreen = persp.multiply(view);

		const cursor = viewport.getGlMousePos();

		let bestDist = Infinity;
		let bestPoint: Point | null = null;

		const inner = (point: Point) => {
			const screenPoint = point.position.multMat4(toScreen);

			if (viewport.perspective) {
				screenPoint.x /= -screenPoint.z;
				screenPoint.y /= -screenPoint.z;
			}

			const screen2D = new vec2(screenPoint.x, screenPoint.y);

			const d = vec2.sqrDist(cursor, screen2D) + -screenPoint.z * 0.000001; // bias to closer

			if (d < bestDist) {
				bestDist = d;
				bestPoint = point;
			}
		}

		this.allPoints.forEach(point => {
			inner(point);
		});

		// todo: allow mid-face points

		return bestPoint;
	}

	getPointsForFace(face: EditorFace) {
		this.allPoints.clear();

		const start = face.halfEdge;
		let edge = start;
		do {
			if (edge?.tail?.position) {
				// add vertex points
				this.allPoints.add({
					position: edge.tail.position,
					type: PointType.vertex,
					vertex: edge.tail
				});

				// add edge grid points
				if (edge?.next?.tail?.position) {
					const start = edge.tail.position;
					const end = edge.next.tail.position;
					const dir = end.minus(start);
					const maxT = dir.magnitide();
					dir.normalise();

					const signX = Math.sign(dir.x);
					const signY = Math.sign(dir.y);
					const signZ = Math.sign(dir.z);

					// get distance along direction to grid
					const slopeX = Math.abs(dir.x);
					const slopeY = Math.abs(dir.y);
					const slopeZ = Math.abs(dir.z);

					let iX = 0;
					let iY = 0;
					let iZ = 0;

					for (let i = 0; i < 1000; ++i) {
						const nextX = signX * Math.floor(signX * start.x / editor.gridSize + iX + 1) * editor.gridSize;
						const nextY = signY * Math.floor(signY * start.y / editor.gridSize + iY + 1) * editor.gridSize;
						const nextZ = signZ * Math.floor(signZ * start.z / editor.gridSize + iZ + 1) * editor.gridSize;

						let tX = Math.abs(nextX - start.x) / slopeX;
						let tY = Math.abs(nextY - start.y) / slopeY;
						let tZ = Math.abs(nextZ - start.z) / slopeZ;

						if (Number.isNaN(tX)) tX = Infinity;
						if (Number.isNaN(tY)) tY = Infinity;
						if (Number.isNaN(tZ)) tZ = Infinity;

						// get smallest t
						if (tX < tY && tX < tZ) {
							// smallest x
							if (tX < maxT) {
								this.allPoints.add({
									position: start.plus(dir.times(tX)),
									type: PointType.edge,
									edge: edge
								});
								++iX;
							}
							else break;
						} else if (tY < tX && tY < tZ) {
							// smallest y
							if (tY < maxT) {
								this.allPoints.add({
									position: start.plus(dir.times(tY)),
									type: PointType.edge,
									edge: edge
								});
								++iY;
							}
							else break;
						} else {
							// smallest z
							if (tZ < maxT) {
								this.allPoints.add({
									position: start.plus(dir.times(tZ)),
									type: PointType.edge,
									edge: edge
								});
								++iZ;
							}
							else break;
						}
					}
				}
			}

			if (edge?.next) edge = edge.next;
			else break;
		} while (edge != start)
	}

	override onSwitch(): void {
		this.forceChange = true;
		this.allPoints.clear();
		this.points = [];
	}
}