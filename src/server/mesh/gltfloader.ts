import { Model } from "../../common/mesh/model.js";
import { GltfLoader, loadedModels } from "../../common/mesh/gltfloader.js";
import { Server } from "../system/server.js";

export class ServerGltfLoader extends GltfLoader {
	static async loadGltfFromDisk(url: string): Promise<Model> {
		if (loadedModels.has(url)) {
			return loadedModels.get(url)!;
		}

		let model = new Model();

		const text = Server.readFileUtf8(url + ".gltf");
		const data = Server.readFile(url + ".bin");

		model = await this.loadGltf(JSON.parse(text), [new Uint8Array(data)], url.substring(0, url.lastIndexOf('/') + 1));
		loadedModels.set(url, model);

		// todo: error model

		return model;
	}
}