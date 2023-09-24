import { getGltfMeshes } from "../src/mesh/gltfloader.js";
import { HalfEdgeMesh } from "../src/mesh/halfedge.js";
import { PrimitiveData } from "../src/mesh/primitive.js";

const gltfInput: HTMLInputElement | null = document.getElementById("gltf-input") as HTMLInputElement | null;
const binInput: HTMLInputElement | null = document.getElementById("bin-input") as HTMLInputElement | null;
const submitInput = document.getElementById("submit-input");

if (submitInput && gltfInput && binInput) {
	submitInput.onclick = async () => {
		if (!gltfInput.files || !binInput.files || !gltfInput.files[0] || !binInput.files[0]) {
			alert("Please choose both the .gltf and .bin files");
			return;
		}

		const json = JSON.parse(await gltfInput.files[0].text());
		const buffers = [new Uint8Array(await binInput.files[0].arrayBuffer())];
		generateCollisionData(json, buffers);
	}
}

function generateCollisionData(json: any, buffers: Uint8Array[]) {
	const meshes = getGltfMeshes(json, buffers);
	const halfEdgeMesh = HalfEdgeMesh.fromMeshes(meshes);

	console.log(halfEdgeMesh);
}