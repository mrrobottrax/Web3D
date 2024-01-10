import { HalfEdgeMesh } from "../../../../src/common/mesh/halfedge.js";
import { editor } from "../main.js";

const blobSettings = { type: 'application/text' };

export class FileManagement {
	static filename: string = "untitled";

	static texturesList: string[] = [];
	static baseClasses: Map<string, any> = new Map();
	static engineEntities: Map<string, any> = new Map();

	static exportMap() {
		console.log("Exporting map...");

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

		// entities
		let entityBlob: Blob;
		{
			let s = JSON.stringify(Array.from(editor.entities));
			entityBlob = new Blob([encoder.encode(s)], blobSettings);
		}

		// offsets table
		let offsetsTable: any = {
			textureTable: 0,
			textureTableSize: texTableBlob.size,

			glMeshData: texTableBlob.size,
			glMeshDataSize: glMeshBlob.size,

			collision: texTableBlob.size + glMeshBlob.size,
			collisionSize: collisionBlob.size,

			entities: texTableBlob.size + glMeshBlob.size + collisionBlob.size,
			entitiesSize: entityBlob.size,
			
			lastIndex: texTableBlob.size + glMeshBlob.size + collisionBlob.size + entityBlob.size,
		};

		// download data
		const blob = new Blob([JSON.stringify(offsetsTable) as BlobPart, new Uint8Array([0]), texTableBlob, glMeshBlob, collisionBlob, entityBlob], blobSettings);
		const link = document.createElement("a");

		link.href = URL.createObjectURL(blob);

		link.download = this.filename + ".glvl"

		link.click();
		URL.revokeObjectURL(link.href);
	}

	static saveMap() {
		console.log("Saving map...");

		// download data
		const blob = new Blob([JSON.stringify(editor) as BlobPart], blobSettings);
		const link = document.createElement("a");

		link.href = URL.createObjectURL(blob);

		link.download = this.filename + ".level"

		link.click();
		URL.revokeObjectURL(link.href);
	}

	static async loadMap(file: File) {
		console.log("Opening map...");

		const name = file.name.substring(0, file.name.lastIndexOf("."));
		this.filename = name;

		const json = JSON.parse(await file.text());
		
		editor.close();
		editor.loadMeshesFromJson(json.meshes);
		await editor.loadEntitiesFromJson(json.entities);
	}

	static closeMap() {
		console.log("Closing map...");

		editor.close();
	}

	static getAssetList() {
		const assetListPath = "sdk/editor/data/_assetlist.json";

		const req = new XMLHttpRequest();
		req.open("GET", assetListPath);

		req.onloadend = () => {
			if (req.status != 200) {
				console.error("ERROR GETTING ASSET LIST!");
				return;
			}

			const json = JSON.parse(req.response);
			this.texturesList = json.textures;
		}

		req.send();
	}

	static getEntityList() {
		const entityListPath = "sdk/editor/data/_entitylist.json";

		const req = new XMLHttpRequest();
		req.open("GET", entityListPath);

		req.onloadend = () => {
			if (req.status != 200) {
				console.error("ERROR GETTING ENTITY LIST!");
				return;
			}

			const json = JSON.parse(req.response);
			for (const c in json.classes) {
				this.baseClasses.set(c, json.classes[c]);
			}
			for (const c in json.engine) {
				this.engineEntities.set(c, json.engine[c]);
			}
		}

		req.send();
	}
}