import { SharedAttribs, gl, solidTex } from "../../../../src/client/render/gl.js";
import { vec2, vec3 } from "../../../../src/common/math/vector.js";
import { Primitive } from "../../../../src/common/mesh/model.js";

export interface EditorFace {
	halfEdge: EditorHalfEdge | null;
	texture: string;
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
	uv: vec2;
	edge: EditorHalfEdge | null;
}

interface Submesh {
	faces: Set<EditorFace>;
	verts: Set<EditorVertex>;
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
	// TODO:
	splitSubmeshes(): Submesh[] {
		return [{
			faces: this.faces,
			verts: this.verts
		}];
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

		// create tris
		let tris: EditorVertex[] = [];
		{
			const it = submesh.faces.values();
			let i = it.next();
			while (!i.done) {
				tris = tris.concat(this.triangulateFace(i.value));
				i = it.next();
			}
		}

		// assign index to each vert in submesh
		let vertIndices: Map<EditorVertex, number> = new Map();
		let vertCount = 0;
		{
			let index = 0;
			const it = submesh.verts.values();
			let i = it.next();
			while (!i.done) {
				vertIndices.set(i.value, index);
				++index;
				i = it.next();
			}
			vertCount = index;
		}

		// put data into array
		const vertSize = (3 + 2);
		let verts = new Float32Array(vertCount * vertSize);
		{
			let index = 0;
			const it = submesh.verts.values();
			let i = it.next();
			while (!i.done) {
				const v = i.value;
				i = it.next();

				if (!(v.position))
					continue;

				verts[index] = v.position.x;
				verts[index + 1] = v.position.y;
				verts[index + 2] = v.position.z;

				// TODO: Generate UV data
				verts[index + 3] = 0;
				verts[index + 4] = 0;

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
		// TODO:
		// if (textureUris.length > 0) {
		// 	for (let j = 0; j < data[i].textureUris.length; ++j) {
		// 		const url = data[i].textureUris[0];

		// 		const textureLoaded = textures[url] !== undefined;

		// 		if (textureLoaded) {
		// 			t[j] = textures[url];
		// 		} else {
		// 			loadTexture(url).then((result) => {
		// 				textures[url] = result.tex;
		// 				if (!result.tex) {
		// 					return;
		// 				}
		// 				primitives[i].textures[j] = result.tex;
		// 			});
		// 		}
		// 	}
		// } else {
		// 	primitives[i].textures = [solidTex];
		// }

		return p;
	}

	triangulateFace(face: EditorFace): EditorVertex[] {
		if (!(face.halfEdge?.tail && face.halfEdge.next)) {
			console.error("BAD FACE!");
			return [];
		}

		// TODO: THIS IS BAD
		// only works with convex polygons

		let tris: EditorVertex[] = [];
		const addTrisRecursive = (start: EditorHalfEdge, next: EditorHalfEdge) => {
			if (!(start.tail && next.tail && next.next?.tail)) {
				console.log("BAD FACE!");
				return;
			}

			tris.push(start.tail);
			tris.push(next.tail);
			tris.push(next.next.tail);

			if (next.next.next != start)
				addTrisRecursive(start, next.next);
		}

		addTrisRecursive(face.halfEdge, face.halfEdge.next)

		return tris;
	}
}