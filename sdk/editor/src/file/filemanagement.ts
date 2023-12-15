import { HalfEdgeMesh } from "../../../../src/common/mesh/halfedge.js";
import { editor } from "../main.js";

export class FileManagement {
	static exportMap() {
		console.log("Exporting map...");

		let textureTable: Map<string, number> = new Map();
		let textureIndex = 0;

		let glMeshBlobs: BlobPart[] = [];
		let glMeshBytes = 0;
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

					glMeshBytes += 2 + 4 + 4 + data.verts.length * 4 + data.elements.length * 2;
				}

				// push collision data
				{
					glMeshBlobs.push(new Uint16Array([texId]));
					glMeshBlobs.push(new Uint32Array([data.verts.length * 4]));
					glMeshBlobs.push(new Uint32Array([data.elements.length * 2]));
					glMeshBlobs.push(data.verts);
					glMeshBlobs.push(data.elements);

					glMeshBytes += 2 + 4 + 4 + data.verts.length * 4 + data.elements.length * 2;
				}
			})
		})

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
		let texTableBytes = encoder.encode(JSON.stringify(texTableObj));

		// collision data
		const colMesh = HalfEdgeMesh.fromEditorMeshes(editor.meshes);
		let collisionBytes = encoder.encode(JSON.stringify(colMesh));

		// offsets table
		let offsetsTable: any = {
			textureTable: 0,
			glMeshData: texTableBytes.length,
			collision: texTableBytes.length + glMeshBytes,
			lastIndex: texTableBytes.length + glMeshBytes + collisionBytes.length,
		};

		let blobParts: BlobPart[] = [];
		blobParts = [JSON.stringify(offsetsTable) as BlobPart].concat(new Uint8Array([0]))
			.concat(texTableBytes).concat(glMeshBlobs).concat(collisionBytes);

		// download data
		const blob = new Blob(blobParts, { type: 'application/text' });
		const link = document.createElement("a");

		link.href = URL.createObjectURL(blob);

		link.download = "map" + ".glvl"

		link.click();
		URL.revokeObjectURL(link.href);
	}
}