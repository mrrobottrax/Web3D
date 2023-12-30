import { loadPrimitiveTexture } from "../../../../src/client/mesh/textures.js";
import { SharedAttribs, gl, solidTex } from "../../../../src/client/render/gl.js";
import gMath from "../../../../src/common/math/gmath.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { Primitive } from "../../../../src/common/mesh/model.js";
import { editor } from "../main.js";

export interface EditorFace {
	halfEdge: EditorHalfEdge | null;
	texture: string;
	u: vec3;
	v: vec3;
	offset: vec2;
	rotation: number;
	scale: vec2;

	color: number[];

	mesh: EditorMesh | null;
	elementOffset: number;
	elementCount: number;
	primitive: Primitive | null;
}

export interface EditorHalfEdge {
	prev: EditorHalfEdge | null;
	next: EditorHalfEdge | null;
	twin: EditorHalfEdge | null;

	face: EditorFace | null;

	full: EditorFullEdge | null;

	tail: EditorVertex | null;
}

export interface EditorFullEdge {
	halfA: EditorHalfEdge | null;
	halfB: EditorHalfEdge | null;
}

export interface EditorVertex {
	position: vec3;
	edges: Set<EditorHalfEdge>; // todo: this can probably be done with
}

interface Submesh {
	faces: Set<EditorFace>;
	verts: Set<EditorVertex>;
	texture: string;
}

interface SubVertex {
	position: vec3;
	edge: EditorHalfEdge;
}

export interface CollisionTri {
	edge1: EditorHalfEdge;
	edge2: EditorHalfEdge;
	edge3: EditorHalfEdge;

	normal: vec3;
	dist: number;
}

export class EditorMesh {
	edges: Set<EditorFullEdge>;
	faces: Set<EditorFace>;
	halfEdges: Set<EditorHalfEdge>;
	verts: Set<EditorVertex>;
	collisionTris: CollisionTri[];
	primitives: Primitive[] = [];
	wireFrameData: {
		vao: WebGLVertexArrayObject | null
		vBuffer: WebGLBuffer | null
		eBuffer: WebGLBuffer | null
		elementCount: number
	}

	constructor(edges: Set<EditorFullEdge>, faces: Set<EditorFace>, halfEdges: Set<EditorHalfEdge>,
		verts: Set<EditorVertex>) {
		this.edges = edges;
		this.faces = faces;
		this.halfEdges = halfEdges;
		this.verts = verts;

		this.primitives = this.getPrimitives();
		this.wireFrameData = this.getWireframeData();
		this.collisionTris = this.getCollisionTris();
	}

	toJSON() {
		// assign index for each
		const edgeIndices = new Map<EditorFullEdge, number>();
		const faceIndices = new Map<EditorFace, number>();
		const halfEdgeIndices = new Map<EditorHalfEdge, number>();
		const vertIndices = new Map<EditorVertex, number>();

		{
			let counter: number;

			counter = 0;
			this.edges.forEach(value => {
				edgeIndices.set(value, counter++);
			});

			counter = 0;
			this.faces.forEach(value => {
				faceIndices.set(value, counter++);
			});

			counter = 0;
			this.halfEdges.forEach(value => {
				halfEdgeIndices.set(value, counter++);
			});

			counter = 0;
			this.verts.forEach(value => {
				vertIndices.set(value, counter++);
			});
		}

		// create arrays
		let edgeArray: any[] = [];
		this.edges.forEach(edge => {
			const a = edge.halfA ? halfEdgeIndices.get(edge.halfA) : -1;
			const b = edge.halfB ? halfEdgeIndices.get(edge.halfB) : -1;

			edgeArray.push({
				halfA: a,
				halfB: b,
			});
		});

		let faceArray: any[] = [];
		this.faces.forEach(face => {
			if (!(face.halfEdge))
				return;

			faceArray.push({
				halfEdge: halfEdgeIndices.get(face.halfEdge),
				texture: face.texture,
				u: [face.u.x, face.u.y, face.u.z],
				v: [face.v.x, face.v.y, face.v.z],
				color: face.color,
				scale: [face.scale.x, face.scale.y],
				offset: [face.offset.x, face.offset.y],
				rotation: face.rotation
			});
		});

		let halfEdgeArray: any[] = [];
		this.halfEdges.forEach(halfEdge => {
			if (!(halfEdge.face && halfEdge.full && halfEdge.next
				&& halfEdge.prev && halfEdge.tail))
				return;

			halfEdgeArray.push({
				face: faceIndices.get(halfEdge.face),
				full: edgeIndices.get(halfEdge.full),
				next: halfEdgeIndices.get(halfEdge.next),
				prev: halfEdgeIndices.get(halfEdge.prev),
				twin: halfEdge.twin ? halfEdgeIndices.get(halfEdge.twin) : -1,
				tail: vertIndices.get(halfEdge.tail)
			});
		});

		let vertArray: any[] = [];
		this.verts.forEach(vert => {
			if (!(vert.edges))
				return;

			const edgeIndexArray: number[] = [];

			vert.edges.forEach(edge => {
				const num = halfEdgeIndices.get(edge);
				if (num != undefined) edgeIndexArray.push(num); else console.error("PROBLEM?");
			})

			vertArray.push({
				edges: edgeIndexArray,
				position: [vert.position.x, vert.position.y, vert.position.z]
			});
		});

		return {
			edges: edgeArray,
			faces: faceArray,
			halfEdges: halfEdgeArray,
			verts: vertArray,
		}
	}

	static fromJson(json: any): EditorMesh | null {
		const edgesArray: any[] = json.edges;
		const facesArray: any[] = json.faces;
		const halfEdgesArray: any[] = json.halfEdges;
		const vertsArray: any[] = json.verts;

		let edges: EditorFullEdge[] = [];
		let faces: EditorFace[] = [];
		let halfEdges: EditorHalfEdge[] = [];
		let verts: EditorVertex[] = [];

		if (facesArray.length == 0) return null;

		// allocate memory
		edgesArray.forEach(() => {
			edges.push({
				halfA: null,
				halfB: null
			});
		});

		facesArray.forEach((face) => {
			faces.push({
				halfEdge: null,
				texture: face.texture,
				u: new vec3(face.u[0], face.u[1], face.u[2]),
				v: new vec3(face.v[0], face.v[1], face.v[2]),
				elementCount: 0,
				elementOffset: 0,
				primitive: null,
				color: face.color ? face.color : [1, 1, 1],
				mesh: null,
				offset: face.offset ? new vec2(face.offset[0], face.offset[1]) : vec2.origin(),
				rotation: face.rotation ? face.rotation : 0,
				scale: face.scale ? new vec2(face.scale[0], face.scale[1]) : vec2.one()
			});
		});

		halfEdgesArray.forEach(() => {
			halfEdges.push({
				prev: null,
				next: null,
				twin: null,
				face: null,
				full: null,
				tail: null
			});
		});

		vertsArray.forEach((vert) => {
			verts.push({
				position: new vec3(vert.position[0], vert.position[1], vert.position[2]),
				edges: new Set()
			});
		});

		// set up references
		edges.forEach((edge, index) => {
			let a = halfEdges[edgesArray[index].halfA];
			let b = halfEdges[edgesArray[index].halfB];

			edge.halfA = a ? a : null;
			edge.halfB = b ? b : null;
		});

		faces.forEach((face, index) => {
			face.halfEdge = halfEdges[facesArray[index].halfEdge];
		});

		halfEdges.forEach((half, index) => {
			const ref = halfEdgesArray[index];

			const twin = halfEdges[ref.twin];

			half.face = faces[ref.face];
			half.full = edges[ref.full];
			half.next = halfEdges[ref.next];
			half.prev = halfEdges[ref.prev];
			half.twin = twin ? twin : null;
			half.tail = verts[ref.tail];
		});

		verts.forEach((vert, index) => {
			const ref: number[] = vertsArray[index].edges;

			ref.forEach(num => {
				vert.edges.add(halfEdges[num]);
			});
		});

		// add to sets
		let edgeSet = new Set<EditorFullEdge>();
		let halfEdgeSet = new Set<EditorHalfEdge>();
		let faceSet = new Set<EditorFace>();
		let vertSet = new Set<EditorVertex>();

		edges.forEach(v => {
			edgeSet.add(v);
		});

		faces.forEach(v => {
			faceSet.add(v);
		});

		halfEdges.forEach(v => {
			halfEdgeSet.add(v);
		});

		verts.forEach(v => {
			vertSet.add(v);
		});

		const m = new EditorMesh(edgeSet, faceSet, halfEdgeSet, vertSet);

		faceSet.forEach(face => {
			face.mesh = m;
		});

		return m;
	}

	cleanUpGl() {
		gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		this.primitives.forEach((value) => {
			gl.deleteVertexArray(value.vao);
			gl.deleteBuffer(value.vBuffer);
			gl.deleteBuffer(value.eBuffer);
		});

		this.primitives = [];

		gl.deleteVertexArray(this.wireFrameData.vao);
		gl.deleteBuffer(this.wireFrameData.vBuffer);
		gl.deleteBuffer(this.wireFrameData.eBuffer);
	}

	updateShape() {
		this.cleanUpGl();

		this.primitives = this.getPrimitives();
		this.wireFrameData = this.getWireframeData();
		this.collisionTris = this.getCollisionTris();
	}

	getWireframeData(): {
		vao: WebGLVertexArrayObject | null
		vBuffer: WebGLBuffer | null
		eBuffer: WebGLBuffer | null
		elementCount: number
	} {
		const vao = gl.createVertexArray();

		const vBuffer: WebGLBuffer | null = gl.createBuffer();
		const eBuffer: WebGLBuffer | null = gl.createBuffer();

		if (!vBuffer || !eBuffer || !vao) {
			console.error("Error creating buffer");

			gl.deleteVertexArray(vao);
			gl.deleteBuffer(vBuffer);
			gl.deleteBuffer(eBuffer);

			return {
				vao: null,
				vBuffer: null,
				eBuffer: null,
				elementCount: 0
			};
		}

		// get all vertices in array
		let verts: number[] = [];
		let vertIndices: Map<EditorVertex, number> = new Map();
		{
			let index = 0;
			this.verts.forEach((value) => {
				verts.push(value.position.x);
				verts.push(value.position.y);
				verts.push(value.position.z);

				vertIndices.set(value, index++);
			});
		}

		// get lines
		let indices: number[] = [];
		this.edges.forEach((value) => {
			if (!(value.halfA?.next || value.halfB?.next)) {
				console.error("BAD EDGE!");
				return;
			}

			let half: EditorHalfEdge;
			let next: EditorHalfEdge;
			if (value.halfA?.next) {
				half = value.halfA;
				next = value.halfA.next;
			} else if (value.halfB?.next) {
				half = value.halfB;
				next = value.halfB.next;
			} else {
				console.error("SOMETHINGS WRONG!");
				return;
			}

			if (!(half.tail && next.tail)) {
				console.error("SOMETHINGS WRONG!");
				return;
			}

			const start = half.tail;
			const end = next.tail;

			const a = vertIndices.get(start);
			const b = vertIndices.get(end);

			if (!(a != undefined && b != undefined)) {
				console.error("SOMETHINGS WRONG!");
				return;
			}

			indices.push(a);
			indices.push(b);
		})

		gl.bindVertexArray(vao);

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(SharedAttribs.positionAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindVertexArray(null);

		return {
			vao: vao,
			vBuffer: vBuffer,
			eBuffer: eBuffer,
			elementCount: indices.length
		};
	}

	getCollisionTris(): CollisionTri[] {
		let tris: CollisionTri[] = []

		this.faces.forEach(face => {
			const edges = this.triangulateFaceFullVertex(face);

			for (let i = 0; i < edges.length; i += 3) {
				const dir1 = edges[i + 1].tail!.position.minus(edges[i].tail!.position);
				const dir2 = edges[i + 2].tail!.position.minus(edges[i].tail!.position);

				let normal = vec3.cross(dir1, dir2);
				normal.normalise();

				tris.push({
					edge1: edges[i],
					edge2: edges[i + 1],
					edge3: edges[i + 2],
					normal: normal,
					dist: vec3.dot(normal, edges[i].tail!.position)
				});
			}

			tris = tris.concat();
		})

		return tris;
	}

	getPrimitives(): Primitive[] {
		const submeshes = this.splitSubmeshes();

		let primitives: Primitive[] = [];
		for (let i = 0; i < submeshes.length; ++i) {
			const p = this.submeshToPrimitive(submeshes[i]);
			if (p) primitives.push(p);
		}

		return primitives;
	}

	// split into submeshes based on texture
	splitSubmeshes(): Submesh[] {
		// collect faces by texture
		let faceMap: Map<string, Set<EditorFace>> = new Map();
		{
			const it = this.faces.values();
			let i = it.next();
			while (!i.done) {
				const f = i.value;

				if (!faceMap.has(f.texture)) {
					faceMap.set(f.texture, new Set());
				}

				faceMap.get(f.texture)?.add(f);

				i = it.next();
			}
		}

		// add new submesh for each map entry
		let subMeshes: Submesh[] = [];
		{
			const it = faceMap.entries();
			let i = it.next();
			while (!i.done) {
				const faces = i.value[1];

				let verts: Set<EditorVertex> = new Set();
				// get all vertices attached to each face
				{
					const it2 = faces.values();
					let i2 = it2.next();
					while (!i2.done) {
						const face = i2.value;

						const startEdge = face.halfEdge;
						let edge = startEdge;
						do {
							if (edge?.tail)
								verts.add(edge.tail);

							if (edge?.next)
								edge = edge.next;
							else
								break;
						} while (edge != startEdge)

						i2 = it2.next();
					}
				}

				subMeshes.push({
					faces: faces,
					verts: verts,
					texture: i.value[0]
				});

				i = it.next();
			}
		}

		return subMeshes;
	}

	getVertData(submesh: Submesh): {
		verts: Float32Array,
		elements: Uint16Array
	} {
		// add extra vertices when connected faces don't share uvs
		// or are sharp
		// TODO: Currently just makes everything not share verts
		// should use same vert when smoothing
		let subVertMap: Map<EditorHalfEdge, SubVertex> = new Map();
		{
			const it = submesh.verts.values();
			let i = it.next();
			while (!i.done) {
				const v = i.value;

				const it2 = v.edges.values();
				let i2 = it2.next();
				while (!i2.done) {
					const e1 = i2.value;
					const f1 = e1.face;

					if (!e1.tail?.position) {
						console.error("VERT WITHOUT POSITION!");
						return {
							verts: new Float32Array(),
							elements: new Uint16Array()
						};
					}

					subVertMap.set(e1, {
						position: e1.tail?.position,
						edge: e1
					});

					i2 = it2.next();
				}

				// check that we share uvs

				// check that the angle is small

				i = it.next();
			}
		}

		// create tris
		let tris: SubVertex[] = [];
		{
			const it = submesh.faces.values();
			let i = it.next();
			while (!i.done) {
				const face = i.value;

				const triangulatedArray = this.triangulateFaceSubVertex(face, subVertMap);

				face.elementOffset = tris.length;
				face.elementCount = triangulatedArray.length;

				tris = tris.concat(triangulatedArray);

				i = it.next();
			}
		}

		// assign index to each subvert in submesh
		let vertIndices: Map<SubVertex, number> = new Map();
		let vertCount = 0;
		{
			let index = 0;
			const it = subVertMap.values();
			let i = it.next();
			while (!i.done) {
				vertIndices.set(i.value, index++);
				i = it.next();
			}
			vertCount = index;
		}

		// put data into array
		const vertSize = (3 + 2 + 3);
		let verts = new Float32Array(vertCount * vertSize);
		{
			let index = 0;
			const it = subVertMap.values();
			let i = it.next();
			while (!i.done) {
				const v = i.value;
				i = it.next();

				if (!(v.position)) {
					console.error("NO POSITION!");
					continue;
				}

				verts[index] = v.position.x;
				verts[index + 1] = v.position.y;
				verts[index + 2] = v.position.z;

				if (!(v.edge.face)) {
					console.error("NO FACE!");
					continue;
				}

				const f: EditorFace = v.edge.face;
				const uv = this.calcVertexUv(v.position, f);
				verts[index + 3] = uv.x;
				verts[index + 4] = uv.y;

				verts[index + 5] = f.color[0];
				verts[index + 6] = f.color[1];
				verts[index + 7] = f.color[2];

				index += vertSize;
			}
		}

		// get index array
		let elements = new Uint16Array(tris.length);
		for (let i = 0; i < tris.length; ++i) {
			const n = vertIndices.get(tris[i]);
			if (n) elements[i] = n;
		}

		return {
			verts: verts,
			elements: elements
		}
	}

	submeshToPrimitive(submesh: Submesh): Primitive | null {
		const vao = gl.createVertexArray();

		const vBuffer: WebGLBuffer | null = gl.createBuffer();
		const eBuffer: WebGLBuffer | null = gl.createBuffer();

		if (!vBuffer || !eBuffer || !vao) {
			console.error("Error creating buffer");

			gl.deleteVertexArray(vao);
			gl.deleteBuffer(vBuffer);
			gl.deleteBuffer(eBuffer);

			return null;
		}

		gl.bindVertexArray(vao);

		const data = this.getVertData(submesh);

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data?.verts, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data?.elements, gl.STATIC_DRAW);

		gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 32, 0);
		gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 32, 12);
		gl.vertexAttribPointer(SharedAttribs.colorAttrib, 3, gl.FLOAT, false, 32, 20);

		gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
		gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);
		gl.enableVertexAttribArray(SharedAttribs.colorAttrib);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindVertexArray(null);

		let p: Primitive = {
			vao: vao,
			texture: solidTex,
			elementCount: data.elements.length,
			color: [1, 1, 1, 1],
			vBuffer: vBuffer,
			eBuffer: eBuffer
		}
		loadPrimitiveTexture(submesh.texture, p);

		// add primitive to each face
		submesh.faces.forEach(face => {
			face.primitive = p;
		})

		return p;
	}

	triangulateFaceSubVertex(face: EditorFace, subVerts: Map<EditorHalfEdge, SubVertex>): SubVertex[] {
		if (!(face.halfEdge?.tail && face.halfEdge.next)) {
			console.error("BAD FACE!");
			return [];
		}

		// TODO: THIS IS BAD
		// only works with convex polygons

		let tris: SubVertex[] = [];
		const addTrisRecursive = (start: EditorHalfEdge, next: EditorHalfEdge) => {
			if (!(start.tail && next.tail && next.next?.tail)) {
				console.error("BAD FACE!");
				return;
			}

			const a = subVerts.get(start);
			const b = subVerts.get(next);
			const c = subVerts.get(next.next);

			if (!(a && b && c)) {
				console.error("COULD NOT TRIANGULATE FACE!");
				return;
			}

			tris.push(a);
			tris.push(b);
			tris.push(c);

			if (next.next.next != start)
				addTrisRecursive(start, next.next);
		}

		addTrisRecursive(face.halfEdge, face.halfEdge.next)

		return tris;
	}

	triangulateFaceFullVertex(face: EditorFace): EditorHalfEdge[] {
		if (!(face.halfEdge?.tail && face.halfEdge.next)) {
			console.error("BAD FACE!");
			return [];
		}

		// TODO: THIS IS BAD
		// only works with convex polygons

		let tris: EditorHalfEdge[] = [];
		const addTrisRecursive = (start: EditorHalfEdge, next: EditorHalfEdge) => {
			if (!(start.tail && next.tail && next.next?.tail)) {
				console.error("BAD FACE!");
				return;
			}

			const a = start;
			const b = next;
			const c = next.next;

			if (!(a && b && c)) {
				console.error("COULD NOT TRIANGULATE FACE!");
				return;
			}

			tris.push(a);
			tris.push(b);
			tris.push(c);

			if (next.next.next != start)
				addTrisRecursive(start, next.next);
		}

		addTrisRecursive(face.halfEdge, face.halfEdge.next)

		return tris;
	}

	calcVertexUv(position: vec3, face: EditorFace): vec2 {
		let p = new vec2(vec3.dot(position, face.u), vec3.dot(position, face.v));
		p.x *= face.scale.x;
		p.y *= face.scale.y;
		p = p.rotateYaw(gMath.deg2Rad(face.rotation));
		p.add(face.offset);
		return p;
	}

	static getBoxUvForFace(face: EditorFace): {
		u: vec3,
		v: vec3
	} {
		if (!(face.halfEdge?.tail?.position && face.halfEdge.next?.tail?.position && face.halfEdge.prev?.tail?.position)) {
			console.error("UNABLE TO CREATE UVS")
			return {
				u: new vec3(1, 0, 0),
				v: new vec3(0, 1, 0)
			}
		}

		const origin = face.halfEdge.tail.position;
		const a = face.halfEdge.next.tail.position.minus(origin);
		const b = face.halfEdge.prev.tail.position.minus(origin);

		const normal = vec3.cross(a, b);
		// normal.normalise();

		// snap normal to cardinal axis
		const x = Math.abs(normal.x);
		const y = Math.abs(normal.y);
		const z = Math.abs(normal.z);

		const max = Math.max(x, y, z);

		const scaleU = 1;
		const scaleV = 1;

		if (max == x) {
			return {
				u: new vec3(0, 0, -scaleU),
				v: new vec3(0, scaleV, 0)
			}
		} else if (max == y) {
			return {
				u: new vec3(scaleU, 0, 0),
				v: new vec3(0, 0, -scaleV)
			}
		} else {
			return {
				u: new vec3(scaleU, 0, 0),
				v: new vec3(0, scaleV, 0)
			}
		}
	}

	validate(): boolean {
		// validate half edges
		this.halfEdges.forEach(edge => {
			if (edge.twin) {
				const twin = edge.twin;
				if (twin.twin != edge) return false;
				if (!this.halfEdges.has(twin)) return false;
			}
		});

		let invalid = false;

		// remove extra verts
		this.verts.forEach(vert => {
			if (vert.edges.size == 0) {
				this.verts.delete(vert);
				invalid = true;
				return;
			}

			const it = vert.edges.values();
			let i = it.next();
			while (!i.done) {
				const edge: EditorHalfEdge = i.value;

				if (!this.halfEdges.has(edge) || edge.tail != vert) {
					vert.edges.delete(edge);
					invalid = true;
				}

				i = it.next();
			}
		});

		this.halfEdges.forEach(edge => {
			if (!edge.full || !this.faces.has(edge.face!)) {
				this.halfEdges.delete(edge);
				invalid = true;
				return;
			}
		});

		this.edges.forEach(edge => {
			if (!(edge.halfA && this.halfEdges.has(edge.halfA)) && !(edge.halfB && this.halfEdges.has(edge.halfB))) {
				this.edges.delete(edge);
				invalid = true;
				return;
			}
		});

		this.faces.forEach(face => {
			let loops = true;
			let allLeadBack = true;
			let allExist = true;
			let numEdge = 0;

			const start = face.halfEdge;
			let edge = start;
			do {
				if (edge?.face != face) {
					allLeadBack = false;
					break;
				}

				if (!this.halfEdges.has(edge)) {
					allExist = false;
					break;
				}

				if (edge?.next) {
					edge = edge.next;
				} else {
					loops = false;
					break;
				}
				++numEdge;
			} while (edge != start);

			if (!allLeadBack || !loops || !allExist) {
				this.faces.delete(face);
				invalid = true;
				return;
			}
		});

		return !invalid;
	}

	deleteFace(face: EditorFace) {
		this.faces.delete(face);

		// remove all connected half edges
		const startEdge = face.halfEdge!;
		let edge = startEdge;
		do {
			// remove half edges
			this.halfEdges.delete(edge);

			// remove half edges from vertices
			edge.tail?.edges.delete(edge);
			if (edge.tail?.edges.size == 0) this.verts.delete(edge.tail);

			// remove half edges from full edges
			if (edge.full?.halfA == edge) edge.full.halfA = null;
			if (edge.full?.halfB == edge) edge.full.halfB = null;
			if (!edge.full?.halfA && !edge.full?.halfB) this.edges.delete(edge.full!);

			// remove half edges from twins
			if (edge.twin) edge.twin.twin = null;

			if (edge?.next)
				edge = edge.next;
			else
				break;
		} while (edge != startEdge);

		// I'm useless now
		if (this.faces.size == 0) {
			editor.meshes.delete(this);
		}
	}

	deleteEdge(edge: EditorFullEdge) {
		if (edge.halfA?.face) {
			this.deleteFace(edge.halfA.face);
		}
		if (edge.halfB?.face) {
			this.deleteFace(edge.halfB.face);
		}
	}

	unsafeDeleteEdge(edge: EditorFullEdge) {
		if (edge.halfA) {
			this.unsafeDeleteHalfEdge(edge.halfA);
		}
		if (edge.halfB) {
			this.unsafeDeleteHalfEdge(edge.halfB);
		}
	}

	unsafeDeleteHalfEdge(edge: EditorHalfEdge) {
		this.halfEdges.delete(edge);
		edge.tail?.edges.delete(edge);
	}
}