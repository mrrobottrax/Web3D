import { Level, LevelFile } from "../src/level.js";
import { getGltfMeshData } from "../src/mesh/gltfloader.js";
import { HalfEdgeMesh } from "../src/mesh/halfedge.js";

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
		const heMesh = generateCollisionData(json, buffers);

		const fileName = gltfInput.files[0].name.split(".")[0];
		console.log(fileName);

		const level: LevelFile = {
			collision: heMesh,
			gltfName: gltfInput.files[0].name,
			binName: binInput.files[0].name,
		}
	
		const s = JSON.stringify(level);
		const blob = new Blob([s], { type: 'text/plain' });
		
		const link = document.createElement("a");
	
		link.href = URL.createObjectURL(blob);
	
		link.download = fileName + ".lvl"
	
		link.click();
		URL.revokeObjectURL(link.href);
	}
}

function generateCollisionData(json: any, buffers: Uint8Array[]): HalfEdgeMesh {
	const meshes = getGltfMeshData(json, buffers);
	const halfEdgeMesh = HalfEdgeMesh.fromMeshes(meshes);

	return halfEdgeMesh;
}