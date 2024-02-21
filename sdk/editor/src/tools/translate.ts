import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { SharedAttribs, gl, solidShader } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import gMath from "../../../../src/common/math/gmath.js";
import { quaternion, vec2, vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";
import { editor } from "../main.js";
import { EditorFace, EditorFullEdge, EditorHalfEdge, EditorMesh, EditorVertex } from "../mesh/editormesh.js";
import { getSdkKeyDown } from "../../../common/sdkinput.js";
import { Viewport } from "../windows/viewport.js";
import { EntityTool } from "./entitytool.js";
import { GizmoPart, SelectExtension } from "./selectextension.js";
import { SelectMode } from "./selecttool.js";

const lineLength = 0.2;

export class TranslateTool extends SelectExtension {
	gizmoVao: WebGLVertexArrayObject | null = null;
	gizmoBuffer: WebGLBuffer | null = null;
	arrowHeadModel: Model = new Model();

	gizmoPartUnderMouse: GizmoPart = GizmoPart.None;

	dragging: boolean = false;
	extruding: boolean = false;
	dragPos: vec3 = vec3.origin();
	dragViewport!: Viewport;

	async init() {
		this.gizmoVao = gl.createVertexArray();
		gl.bindVertexArray(this.gizmoVao);

		this.gizmoBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gizmoBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, lineLength, 0, 0]), gl.STATIC_DRAW);

		gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindVertexArray(null);

		this.arrowHeadModel = await ClientGltfLoader.loadGltfFromWeb("./sdk/editor/data/models/arrow");
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
		this.extruding = false;
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

		if (!this.shouldDraw()) return;

		const startMat = viewport.camera.viewMatrix.copy();

		const cameraDir = viewport.cameraRay().direction;
		const dist = vec3.dot(this.center, cameraDir) - vec3.dot(viewport.camera.position, cameraDir);

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
			editor.snapToGrid(delta);

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

			if (delta.sqrMagnitude() == 0) {
				return false;
			}

			// extrude
			if (!this.extruding && getSdkKeyDown("ShiftLeft")) {
				this.extruding = true;

				switch (select.mode) {
					case SelectMode.Edge:
						this.extrudeEdges();
						break;
					case SelectMode.Mesh:
						this.duplicateMeshes();
						this.duplicateEntities();
						break;
					case SelectMode.Entity:
						this.duplicateEntities();
						break;
				}
			}

			this.center.add(delta);

			let affectedVerts = new Set<EditorVertex>();

			switch (select.mode) {
				case SelectMode.Vertex:
					select.selectedVertices.forEach(vert => {
						affectedVerts.add(vert);
					});
					break;
				case SelectMode.Edge:
					select.selectedEdges.forEach(edge => {
						if (edge.halfA) {
							const v = edge.halfA.tail!;
							affectedVerts.add(v);

							const w = edge.halfA.next!.tail!;
							affectedVerts.add(w);
						} else if (edge.halfB) {
							const v = edge.halfB.tail!;
							affectedVerts.add(v);

							const w = edge.halfB.next!.tail!;
							affectedVerts.add(w);
						}
					});
				case SelectMode.Face:
					select.selectedFaces.forEach(face => {
						const start = face.halfEdge;
						let edge = start!;
						do {
							const v = edge.tail!;
							affectedVerts.add(v);

							edge = edge.next!;
						} while (edge != start)
					});
					break;
				case SelectMode.Mesh:
					select.selectedMeshes.forEach(mesh => {
						mesh.verts.forEach(vert => {
							affectedVerts.add(vert);
						});
					});
					select.selectedEntities.forEach(entity => {
						const origin = vec3.parse(entity.keyvalues.origin)
						origin.add(delta);
						entity.keyvalues.origin = origin.toString();
					});
					break;
				case SelectMode.Entity:
					select.selectedEntities.forEach(entity => {
						const origin = vec3.parse(entity.keyvalues.origin)
						origin.add(delta);
						entity.keyvalues.origin = origin.toString();
					});
					break;
			}

			affectedVerts.forEach(vert => {
				vert.position.add(delta);
			});

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

	duplicateMeshes() {
		const select = editor.selectTool;
		const newMeshSelection = new Set<EditorMesh>();

		select.selectedMeshes.forEach(mesh => {
			const json = mesh.toJSON();
			const m = EditorMesh.fromJson(json);

			if (m != null) {
				newMeshSelection.add(m);
				editor.meshes.add(m);
			}
		});

		select.selectedMeshes = newMeshSelection;

	}

	duplicateEntities() {
		const select = editor.selectTool;
		const newEntitySelection = new Set<any>();

		select.selectedEntities.forEach(entity => {
			const newEntity = EntityTool.getNewEntity(entity.className);

			newEntity.keyvalues = JSON.parse(JSON.stringify(entity.keyvalues));

			newEntitySelection.add(newEntity);
			editor.entities.add(newEntity);
		});
		select.selectedEntities = newEntitySelection;
	}

	extrudeEdges() {
		const select = editor.selectTool;

		const newSelection = new Set<EditorFullEdge>();
		const extrudeEdge = (edge: EditorFullEdge) => {
			if (edge.halfA && edge.halfB) {
				// can't extrude full edges
				return;
			}

			let half: EditorHalfEdge;
			let isHalfA: boolean;
			if (edge.halfA) {
				half = edge.halfA;
				isHalfA = true;
			}
			else {
				half = edge.halfB!;
				isHalfA = false;
			}

			// new face
			const oldFace = half.face!;
			const mesh = oldFace.mesh!;
			const face: EditorFace = {
				halfEdge: null,
				texture: oldFace.texture,
				u: vec3.copy(oldFace.u),
				v: vec3.copy(oldFace.v),
				offset: vec2.copy(oldFace.offset),
				rotation: oldFace.rotation,
				scale: vec2.copy(oldFace.scale),
				color: oldFace.color.concat(),
				mesh: mesh,
				elementOffset: 0,
				elementCount: 0,
				primitive: null
			}

			// two new verts
			const vertA: EditorVertex = {
				position: vec3.copy(half.next!.tail!.position),
				edges: new Set()
			}
			const vertB: EditorVertex = {
				position: vec3.copy(half.tail!.position),
				edges: new Set()
			}

			// 3 new full edges
			const bFull: EditorFullEdge = {
				halfA: null,
				halfB: null
			}
			const cFull: EditorFullEdge = {
				halfA: null,
				halfB: null
			}
			const dFull: EditorFullEdge = {
				halfA: null,
				halfB: null
			}

			// 4 new edges
			const a: EditorHalfEdge = {
				prev: null,
				next: null,
				twin: half,
				face: face,
				full: half.full,
				tail: half.next!.tail
			}
			a.tail?.edges.add(a);
			face.halfEdge = a;
			half.twin = a;
			if (isHalfA) {
				edge.halfB = a;
			} else {
				edge.halfA = a;
			}

			const b: EditorHalfEdge = {
				prev: a,
				next: null,
				twin: null,
				face: face,
				full: bFull,
				tail: half.tail
			}
			b.tail?.edges.add(b);
			bFull.halfA = b;
			a.next = b;
			const c: EditorHalfEdge = {
				prev: b,
				next: null,
				twin: null,
				face: face,
				full: cFull,
				tail: vertB
			}
			c.tail?.edges.add(c);
			cFull.halfA = c;
			b.next = c;
			const d: EditorHalfEdge = {
				prev: c,
				next: a,
				twin: null,
				face: face,
				full: dFull,
				tail: vertA
			}
			d.tail?.edges.add(d);
			dFull.halfA = d;
			a.prev = d;
			c.next = d;

			mesh.halfEdges.add(a);
			mesh.halfEdges.add(b);
			mesh.halfEdges.add(c);
			mesh.halfEdges.add(d);
			mesh.edges.add(bFull);
			mesh.edges.add(cFull);
			mesh.edges.add(dFull);
			mesh.verts.add(vertA);
			mesh.verts.add(vertB);
			mesh.faces.add(face);

			newSelection.add(cFull);
		}

		const edgesShouldConnect = (edge1: EditorFullEdge, edge2: EditorFullEdge): boolean => {
			// check if they should be twins by checking if other verts are shared
			// there may be cases where this breaks down, check later
			if (edge1.halfA?.prev?.tail == edge2.halfA?.next?.next?.tail) {
				return true;
			}

			return false;
		}

		const connectEdges = (edge1: EditorFullEdge, edge2: EditorFullEdge) => {
			const a = edge1.halfA!.prev!;
			const b = edge2.halfA!.next!;

			const va = edge1.halfA!.tail!;
			const vb = b.tail!;

			a.twin = b;
			b.twin = a;

			const mesh = a.face!.mesh!;

			mesh.verts.delete(vb);

			b.tail = va;
			va.edges.add(b);

			a.full!.halfB = b;
			mesh.edges.delete(b.full!);
			b.full = a.full;
		}

		select.selectedEdges.forEach(extrudeEdge);
		select.selectedEdges = newSelection;

		select.selectedEdges.forEach(edge1 => {
			select.selectedEdges.forEach(edge2 => {
				if (edgesShouldConnect(edge1, edge2)) {
					connectEdges(edge1, edge2);
				}
			});
		});
	}
}