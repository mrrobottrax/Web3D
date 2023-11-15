import { Model } from "../../client/mesh/model.js";
import { loadGltf } from "../../mesh/gltfloader.js";
import { Server } from "../server.js";

export async function loadGltfFromDisk(url: string): Promise<Model> {
	let model = new Model();

	const text = Server.readFileUtf8(url + ".gltf");
	const data = Server.readFile(url + ".bin");

	model = loadGltf(JSON.parse(text), [new Uint8Array(data)], url.substring(0, url.lastIndexOf('/') + 1));

	// todo: error model

	return model;
}