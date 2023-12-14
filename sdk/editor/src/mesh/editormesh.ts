import { textures } from "../../../../src/client/mesh/textures.js";
import { SharedAttribs, gl, loadTexture, solidTex } from "../../../../src/client/render/gl.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { Primitive } from "../../../../src/common/mesh/model.js";

export interface EditorFace {
	halfEdge: EditorHalfEdge | null;
	texture: string;
	u: vec3;
	v: vec3;
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
	edges: Set<EditorHalfEdge>;
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

export class EditorMesh {
	edges: Set<EditorFullEdge>;
	faces: Set<EditorFace>;
	halfEdges: Set<EditorHalfEdge>;
	verts: Set<EditorVertex>;
	primitives: Primitive[] = [];
	color: number[] = [1, 1, 1, 1];

	constructor(edges: Set<EditorFullEdge>, faces: Set<EditorFace>, halfEdges: Set<EditorHalfEdge>,
		verts: Set<EditorVertex>) {
		this.edges = edges;
		this.faces = faces;
		this.halfEdges = halfEdges;
		this.verts = verts;

		this.primitives = this.getPrimitives();
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

	submeshToPrimitive(submesh: Submesh): Primitive | null {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);

		const vBuffer: WebGLBuffer | null = gl.createBuffer();
		const eBuffer: WebGLBuffer | null = gl.createBuffer();

		if (!vBuffer || !eBuffer || !vao) {
			console.error("Error creating buffer")
			return null;
		}

		// add extra vertices when connected faces don't share uvs
		// or are sharp
		// TODO: Currently just makes everything not share verts
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
						return null;
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
				tris = tris.concat(this.triangulateFace(i.value, subVertMap));
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
		const vertSize = (3 + 2);
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

				// TODO: Generate UV data

				if (!(v.edge.face)) {
					console.error("NO FACE!");
					continue;
				}

				const f: EditorFace = v.edge.face;
				const uv = this.calcVertexUv(v.position, f.u, f.v);
				verts[index + 3] = uv.x;
				verts[index + 4] = uv.y;

				index += vertSize;
			}
		}

		// get index array
		let elements = new Uint16Array(tris.length);
		for (let i = 0; i < tris.length; ++i) {
			const n = vertIndices.get(tris[i]);
			if (n) elements[i] = n;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);

		gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 20, 0);
		gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 20, 12);

		gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
		gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);

		gl.bindVertexArray(null);

		let p: Primitive = {
			vao: vao,
			texture: solidTex,
			elementCount: elements.length,
			color: [1, 1, 1, 1]
		}
		if (submesh.texture) {
			const url = submesh.texture;

			const textureLoaded = textures[url] !== undefined;

			if (textureLoaded) {
				p.texture = textures[url];
			} else {
				loadTexture(url).then((result) => {
					textures[url] = result.tex;
					if (!result.tex) {
						return;
					}
					p.texture = result.tex;
				});
			}
		} else {
			p.texture = solidTex;
		}

		return p;
	}

	triangulateFace(face: EditorFace, subVerts: Map<EditorHalfEdge, SubVertex>): SubVertex[] {
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

	calcVertexUv(position: vec3, u: vec3, v: vec3): vec2 {
		return new vec2(vec3.dot(position, u), vec3.dot(position, v));
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

		if (max == x) {
			return {
				u: new vec3(0, 0, -1),
				v: new vec3(0, 1, 0)
			}
		} else if (max == y) {
			return {
				u: new vec3(1, 0, 0),
				v: new vec3(0, 0, -1)
			}
		} else {
			return {
				u: new vec3(1, 0, 0),
				v: new vec3(0, 1, 0)
			}
		}
	}
}