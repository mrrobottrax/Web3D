import { loadGltf } from "../../common/mesh/gltfloader.js";
import { Model } from "../../common/mesh/model.js";

export async function loadGltfFromWeb(url: string): Promise<Model> {
	// send requests
	const req1 = new XMLHttpRequest();
	const req2 = new XMLHttpRequest();

	const promise1 = new Promise<XMLHttpRequest>((resolve) => {
		req1.addEventListener("load", function () { resolve(this); });
	});
	const promise2 = new Promise<XMLHttpRequest>((resolve) => {
		req2.addEventListener("load", function () { resolve(this); });
	});

	req1.open("GET", url + ".gltf");
	req1.send();
	req2.responseType = "arraybuffer";
	req2.open("GET", url + ".bin");
	req2.send();

	let model = new Model();

	// get model from requests
	await Promise.all([promise1, promise2]).then((results) => {
		if (results[0].status != 200 || results[1].status != 200) {
			return model;
		}

		model = loadGltf(JSON.parse(results[0].responseText), [new Uint8Array(results[1].response)], url.substring(0, url.lastIndexOf('/') + 1));
	});

	// todo: error model

	return model;
}

// export async function loadGlbFromWeb(url: string): Promise<Mesh | null> {
// 	// send requests
// 	const req1 = new XMLHttpRequest();

// 	const promise1 = new Promise<XMLHttpRequest>((resolve) => {
// 		req1.addEventListener("load", function () { resolve(this); });
// 	});

// 	req1.open("GET", url + ".glb");
// 	req1.send();

// 	let mesh: Mesh | null = null;

// 	// get shader from requests
// 	await promise1.then((result) => {
// 		if (result.status != 200 || result.status != 200) {
// 			return null;
// 		}

// 		mesh = loadGlb(new Uint8Array(result.response));
// 	});

// 	// fall back when request fails
// 	// todo: error model
// 	//if (!result) {
// 	//	console.error(`Failed to load shader ${vs}, ${fs}`);
// 	//	shader = initShaderProgram(fallbackVSource, fallbackFSource);
// 	//}

// 	return mesh;
// }