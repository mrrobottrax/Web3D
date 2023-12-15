import { HalfEdgeMesh } from "../../../../src/common/mesh/halfedge.js";
import { editor } from "../main.js";

export class FileManagement {
	static exportMap() {
		console.log("Exporting map...");

		const blobSettings = { type: 'application/text' };

		let textureTable: Map<string, number> = new Map();
		let textureIndex = 0;

		// visual meshes
		let glMeshBlob: Blob;
		{
			let glMeshBlobs: BlobPart[] = [];

			editor.meshes.forEach((value) => {
				const submeshes = value.splitSubmeshes();
				submeshes.forEach((sub) => {
					const data = value.getVertData(sub);

					if (!textureTable.has(sub.texture))
						textureTable.set(sub.texture, textureIndex++);

					const texId = textureTable.get(sub.texture);

					if (texId == undefined) {
						console.error("WHAT!?!?!");
						return;
					}

					// push gl mesh data
					{
						glMeshBlobs.push(new Uint16Array([texId]));
						glMeshBlobs.push(new Uint32Array([data.verts.length * 4]));
						glMeshBlobs.push(new Uint32Array([data.elements.length * 2]));
						glMeshBlobs.push(data.verts);
						glMeshBlobs.push(data.elements);
					}

					// push collision data
					{
						glMeshBlobs.push(new Uint16Array([texId]));
						glMeshBlobs.push(new Uint32Array([data.verts.length * 4]));
						glMeshBlobs.push(new Uint32Array([data.elements.length * 2]));
						glMeshBlobs.push(data.verts);
						glMeshBlobs.push(data.elements);
					}
				})
			})

			glMeshBlob = new Blob(glMeshBlobs, blobSettings);
		}

		// texture table blob
		let texTableObj: any = {};
		{
			const it = textureTable.entries();
			let i = it.next();
			let last = -1;
			while (!i.done) {
				// debug
				if (i.value[1] <= last) console.error("SOMETHING HAS HAPPENED!!!!");
				last = i.value[1];

				texTableObj[i.value[1]] = i.value[0];

				i = it.next();
			}
		}

		const encoder = new TextEncoder();
		let texTableBlob = new Blob([encoder.encode(JSON.stringify(texTableObj))], blobSettings);

		// collision data
		let collisionBlob: Blob;
		{
			const colMesh = HalfEdgeMesh.fromEditorMeshes(editor.meshes);
			let collisionBlobs: BlobPart[] = [];

			// edges
			collisionBlobs.push(new Uint32Array([colMesh.edges.length]));
			colMesh.edges.forEach(e => {
				collisionBlobs.push(new Uint32Array([e.halfEdge]));
			})

			// faces
			collisionBlobs.push(new Uint32Array([colMesh.faces.length]));
			colMesh.faces.forEach(f => {
				collisionBlobs.push(new Float32Array([f.distance]));
				collisionBlobs.push(new Uint32Array([f.halfEdge]));
				collisionBlobs.push(new Float32Array([f.normal.x, f.normal.y, f.normal.z]));
			})

			// half edges
			collisionBlobs.push(new Uint32Array([colMesh.halfEdges.length]));
			colMesh.halfEdges.forEach(h => {
				collisionBlobs.push(new Uint32Array([h.face]));
				collisionBlobs.push(new Uint32Array([h.next]));
				collisionBlobs.push(new Uint32Array([h.prev]));
				collisionBlobs.push(new Uint32Array([h.twin]));
				collisionBlobs.push(new Uint32Array([h.vert]));
			})

			// vertices
			collisionBlobs.push(new Uint32Array([colMesh.vertices.length]));
			colMesh.vertices.forEach(v => {
				collisionBlobs.push(new Uint32Array([v.halfEdge]));
				collisionBlobs.push(new Float32Array([v.position.x, v.position.y, v.position.z]));
			})

			collisionBlob = new Blob(collisionBlobs, blobSettings);
		}

		// offsets table
		let offsetsTable: any = {
			textureTable: 0,
			glMeshData: texTableBlob.size,
			collision: texTableBlob.size + glMeshBlob.size,
			lastIndex: texTableBlob.size + glMeshBlob.size + collisionBlob.size,
		};

		// download data
		const blob = new Blob([JSON.stringify(offsetsTable) as BlobPart, new Uint8Array([0]), texTableBlob, glMeshBlob, collisionBlob], blobSettings);
		const link = document.createElement("a");

		link.href = URL.createObjectURL(blob);

		link.download = "map" + ".glvl"

		link.click();
		URL.revokeObjectURL(link.href);
	}
}