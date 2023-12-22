import { drawLine } from "../../../../src/client/render/render.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { EditorFace, EditorFullEdge, EditorHalfEdge, EditorMesh, EditorVertex } from "../mesh/editormesh.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

export interface Block {
	min: vec3;
	max: vec3;
}

export class BlockTool extends Tool {
	currentBlock: Block = {
		min: new vec3(-1, -1, -1),
		max: new vec3(1, 1, 1)
	};

	dragStart: vec3 = vec3.origin();
	dragEnd: vec3 = vec3.origin();

	dragging: boolean = false;

	drawnThisFrame: boolean = false;
	drawCurrentBlock() {
		if (this.drawnThisFrame) return;

		let a = new vec3(this.currentBlock.min.x, this.currentBlock.min.y, this.currentBlock.min.z);
		let b = new vec3(this.currentBlock.min.x, this.currentBlock.min.y, this.currentBlock.max.z);
		let c = new vec3(this.currentBlock.min.x, this.currentBlock.max.y, this.currentBlock.min.z);
		let d = new vec3(this.currentBlock.min.x, this.currentBlock.max.y, this.currentBlock.max.z);
		let e = new vec3(this.currentBlock.max.x, this.currentBlock.min.y, this.currentBlock.min.z);
		let f = new vec3(this.currentBlock.max.x, this.currentBlock.min.y, this.currentBlock.max.z);
		let g = new vec3(this.currentBlock.max.x, this.currentBlock.max.y, this.currentBlock.min.z);
		let h = new vec3(this.currentBlock.max.x, this.currentBlock.max.y, this.currentBlock.max.z);

		const color = [1, 1, 0, 1];
		const t = 0;

		drawLine(a, b, color, t);
		drawLine(a, c, color, t);
		drawLine(a, e, color, t);
		drawLine(b, d, color, t);
		drawLine(b, f, color, t);
		drawLine(c, d, color, t);
		drawLine(c, g, color, t);
		drawLine(d, h, color, t);
		drawLine(e, g, color, t);
		drawLine(e, f, color, t);
		drawLine(h, f, color, t);
		drawLine(h, g, color, t);

		this.drawnThisFrame = true;
	}

	resetDraw() {
		this.drawnThisFrame = false;
	}

	startDrag(position: vec3, mask: vec3) {
		this.dragStart = position;

		this.dragging = true;

		this.drag(position, mask);
	}

	stopDrag() {
		this.dragging = false;
	}

	drag(position: vec3, mask: vec3) {
		if (!this.dragging)
			return;

		this.dragEnd = position;

		this.currentBlock.min.x = (1 - mask.x) * Math.min(this.dragStart.x, this.dragEnd.x) + mask.x * this.currentBlock.min.x;
		this.currentBlock.min.y = (1 - mask.y) * Math.min(this.dragStart.y, this.dragEnd.y) + mask.y * this.currentBlock.min.y;
		this.currentBlock.min.z = (1 - mask.z) * Math.min(this.dragStart.z, this.dragEnd.z) + mask.z * this.currentBlock.min.z;
		this.currentBlock.max.x = (1 - mask.x) * Math.max(this.dragStart.x, this.dragEnd.x) + mask.x * this.currentBlock.max.x;
		this.currentBlock.max.y = (1 - mask.y) * Math.max(this.dragStart.y, this.dragEnd.y) + mask.y * this.currentBlock.max.y;
		this.currentBlock.max.z = (1 - mask.z) * Math.max(this.dragStart.z, this.dragEnd.z) + mask.z * this.currentBlock.max.z;
	}

	override mouse(button: number, pressed: boolean): boolean {
		const active = editor.windowManager.activeWindow as Viewport;

		if (active && button == 0) {
			if (pressed) {
				this.startDrag(active.getMouseWorldRounded(), active.getMask());
			} else {
				this.stopDrag();
			}

			return true;
		}

		return false;
	}

	override mouseMove(dx: number, dy: number): boolean {
		if (!this.dragging)
			return false;

		const active = editor.windowManager.activeWindow as Viewport;

		if (active) {
			this.drag(active.getMouseWorldRounded(), active.getMask());

			return true;
		}

		return false;
	}

	override key(code: string, pressed: boolean): boolean {
		if (code != "Enter" || pressed != true) return false;

		console.log("Complete block");

		const min = this.currentBlock.min;
		const max = this.currentBlock.max;

		let vertsSet: Set<EditorVertex> = new Set();

		let a: EditorVertex = {
			position: new vec3(min.x, min.y, min.z),
			edges: new Set()
		}
		vertsSet.add(a);
		let b: EditorVertex = {
			position: new vec3(max.x, min.y, min.z),
			edges: new Set()
		}
		vertsSet.add(b);
		let c: EditorVertex = {
			position: new vec3(max.x, min.y, max.z),
			edges: new Set()
		}
		vertsSet.add(c);
		let d: EditorVertex = {
			position: new vec3(min.x, min.y, max.z),
			edges: new Set()
		}
		vertsSet.add(d);
		let e: EditorVertex = {
			position: new vec3(min.x, max.y, min.z),
			edges: new Set()
		}
		vertsSet.add(e);
		let f: EditorVertex = {
			position: new vec3(max.x, max.y, min.z),
			edges: new Set()
		}
		vertsSet.add(f);
		let g: EditorVertex = {
			position: new vec3(max.x, max.y, max.z),
			edges: new Set()
		}
		vertsSet.add(g);
		let h: EditorVertex = {
			position: new vec3(min.x, max.y, max.z),
			edges: new Set()
		}
		vertsSet.add(h);

		let halfEdgesSet: Set<EditorHalfEdge> = new Set();

		let createFace = (a: EditorVertex, b: EditorVertex, c: EditorVertex, d: EditorVertex): EditorFace => {
			let face: EditorFace = {
				halfEdge: null,
				texture: "./data/levels/textures/brick.png",
				u: new vec3(1, 0, 0),
				v: new vec3(0, 1, 0),
				elementCount: 0,
				elementOffset: 0,
				primitive: null,
				color: [1, 1, 1, 1]
			}

			let ab: EditorHalfEdge = {
				prev: null,
				next: null,
				twin: null,
				face: face,
				tail: a,
				full: null
			}
			halfEdgesSet.add(ab);
			a.edges.add(ab);
			let bc: EditorHalfEdge = {
				prev: ab,
				next: null,
				twin: null,
				face: face,
				tail: b,
				full: null
			}
			halfEdgesSet.add(bc);
			ab.next = bc;
			b.edges.add(bc);
			let cd: EditorHalfEdge = {
				prev: bc,
				next: null,
				twin: null,
				face: face,
				tail: c,
				full: null
			}
			halfEdgesSet.add(cd);
			bc.next = cd;
			c.edges.add(cd);
			let da: EditorHalfEdge = {
				prev: cd,
				next: ab,
				twin: null,
				face: face,
				tail: d,
				full: null
			}
			halfEdgesSet.add(da);
			cd.next = da;
			ab.prev = da;
			d.edges.add(da);

			face.halfEdge = ab;

			const uv = EditorMesh.getBoxUvForFace(face);
			face.u = uv.u;
			face.v = uv.v;

			return face;
		};

		let facesSet: Set<EditorFace> = new Set();

		const nz = createFace(e, f, b, a); // -z face
		const pz = createFace(g, h, d, c); // +z face
		const nx = createFace(a, d, h, e); // -x face
		const px = createFace(c, b, f, g); // +x face
		const ny = createFace(a, b, c, d); // -y face
		const py = createFace(e, h, g, f); // +y face
		facesSet.add(nz);
		facesSet.add(pz);
		facesSet.add(nx);
		facesSet.add(px);
		facesSet.add(ny);
		facesSet.add(py);

		// connect edges
		let edgesSet: Set<EditorFullEdge> = new Set(); // full edges
		const connectEdges = (faceA: EditorFace, indexA: number, faceB: EditorFace, indexB: number) => {
			if (!(faceA.halfEdge && faceB.halfEdge)) {
				console.error("PROBLEM IN BLOCK TOOL!");
				return;
			}

			let edgeA: EditorHalfEdge = faceA.halfEdge;
			for (let i = 1; i < indexA; ++i) {
				if (edgeA?.next)
					edgeA = edgeA.next;
			}

			let edgeB: EditorHalfEdge = faceB.halfEdge;
			for (let i = 1; i < indexB; ++i) {
				if (edgeB?.next)
					edgeB = edgeB.next;
			}

			edgeA.twin = edgeB;
			edgeB.twin = edgeA;

			edgeA.full = {
				halfA: edgeA,
				halfB: edgeB
			}
			edgeB.full = edgeA.full;

			edgesSet.add(edgeA.full);
		}

		// py
		connectEdges(py, 1, nx, 3);
		connectEdges(py, 2, pz, 1);
		connectEdges(py, 3, px, 3);
		connectEdges(py, 4, nz, 1);

		// ny
		connectEdges(ny, 1, nz, 3);
		connectEdges(ny, 2, px, 1);
		connectEdges(ny, 3, pz, 3);
		connectEdges(ny, 4, nx, 1);

		// vertical edges
		connectEdges(pz, 2, nx, 2);
		connectEdges(pz, 4, px, 4);
		connectEdges(nz, 2, px, 2);
		connectEdges(nz, 4, nx, 4);

		// dont need to others since they are implicitly connected

		const mesh = new EditorMesh(edgesSet, facesSet, halfEdgesSet, vertsSet);

		// if (!this.verifyMesh(mesh)) {
		// 	console.error("BLOCK MESH ERROR");
		// }

		editor.meshes.add(mesh);

		return true;
	}

	verifyMesh(mesh: EditorMesh): boolean {
		const verifyHalfEdgeRecursive = (start: EditorHalfEdge, next: EditorHalfEdge): boolean => {
			// check that next leads back to me
			if (next.next?.prev != next) {
				console.error("NEXT DOES NOT LEAD BACK");
				if (next.tail?.position && next.next?.tail?.position && next.next.next?.tail?.position) {
					drawLine(next.tail.position, next.next.tail.position, [1, 0, 0, 1], 10000);
					drawLine(next.tail.position, next.next.next?.tail?.position, [0, 1, 0, 1], 10);
				}
				return false;
			}

			// check that my twin leads back to me
			if (next.twin?.twin != next) {
				console.error("TWIN DOES NOT LEAD BACK");
				if (next.tail?.position && next.next?.tail?.position)
					drawLine(next.tail.position, next.next.tail.position, [1, 0, 0, 1], 10000);
				return false;
			}

			// check that I have a face
			if (!next.face) return false;

			if (next.next) {
				if (next.next != start)
					return verifyHalfEdgeRecursive(start, next.next);
				else
					return true;
			}
			else
				return false;
		}

		// faces
		{
			const it = mesh.faces.values();
			let i = it.next();
			while (!i.done) {
				const f = i.value;

				if (f.halfEdge?.face != f) return false;

				if (!verifyHalfEdgeRecursive(f.halfEdge, f.halfEdge)) return false;

				i = it.next();
			}
		}

		// edges
		{
			const it = mesh.edges.values();
			let i = it.next();
			while (!i.done) {
				const e = i.value;

				if (e.halfA?.full != e) return false;
				if (e.halfB?.full != e) return false;

				i = it.next();
			}
		}

		return true;
	}
}