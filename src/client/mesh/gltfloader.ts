import { GameContext, gameContext } from "../../common/system/context.js";
import { GltfLoader } from "../../common/mesh/gltfloader.js";
import { Model, Primitive, PrimitiveData } from "../../common/mesh/model.js";
import { SharedAttribs, gl, solidTex } from "../render/gl.js";
import { loadPrimitiveTexture } from "./textures.js";

export class ClientGltfLoader extends GltfLoader {
	static async loadGltfFromWeb(url: string): Promise<Model> {
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

			model = this.loadGltf(JSON.parse(results[0].responseText), [new Uint8Array(results[1].response)], url.substring(0, url.lastIndexOf('/') + 1));
		});

		// todo: error model

		return model;
	}

	static override genBuffers(data: PrimitiveData[]): Primitive[] {
		let primitives: Primitive[] = [];

		if (gameContext == GameContext.server) {
			return primitives;
		}

		primitives.length = data.length;

		for (let i = 0; i < data.length; ++i) {
			const vao = gl.createVertexArray();

			const vBuffer: WebGLBuffer | null = gl.createBuffer();
			const eBuffer: WebGLBuffer | null = gl.createBuffer();

			if (!vBuffer || !eBuffer || !vao) {
				console.error("Error creating buffer");

				gl.deleteVertexArray(vao);
				gl.deleteBuffer(vBuffer);
				gl.deleteBuffer(eBuffer);

				return [];
			}

			gl.bindVertexArray(vao);

			// get textures
			primitives[i] = new Primitive(
				vao,
				vBuffer,
				eBuffer,
				solidTex,
				data[i].elements.length,
				data[i].color
			);
			loadPrimitiveTexture(data[i].textureUri, primitives[i]);

			let length = data[i].positions.length + data[i].texCoords.length;

			if (data[i].skinned) {
				length += data[i].boneIds.length + data[i].weights.length;
			}

			let vertData = new Uint8Array(length);

			// merge into one array
			const vertCount = data[i].positions.length / (3 * 4);
			for (let j = 0; j < vertCount; ++j) {
				const index = j * (data[i].skinned ? 40 : 20);
				const posIndex = j * 12;
				const texIndex = j * 8;
				const boneIdIndex = j * 4;
				const weightIndex = j * 16;

				let offset = 0;
				for (let k = 0; k < 12; ++k) {
					vertData[index + offset] = data[i].positions[posIndex + k];
					++offset;
				}

				for (let k = 0; k < 8; ++k) {
					vertData[index + offset] = data[i].texCoords[texIndex + k];
					++offset
				}

				if (data[i].skinned) {
					for (let k = 0; k < 4; ++k) {
						vertData[index + offset] = data[i].boneIds[boneIdIndex + k];
						++offset
					}

					for (let k = 0; k < 16; ++k) {
						vertData[index + offset] = data[i].weights[weightIndex + k];
						++offset
					}
				}
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.STATIC_DRAW);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data[i].elements, gl.STATIC_DRAW);

			if (data[i].skinned) {
				gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 40, 0);
				gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 40, 12);
				gl.vertexAttribPointer(SharedAttribs.boneIdsAttrib, 4, gl.UNSIGNED_BYTE, false, 40, 20);
				gl.vertexAttribPointer(SharedAttribs.boneWeightsAttrib, 4, gl.FLOAT, false, 40, 24);

				gl.enableVertexAttribArray(SharedAttribs.boneIdsAttrib);
				gl.enableVertexAttribArray(SharedAttribs.boneWeightsAttrib);
			} else {
				gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 20, 0);
				gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 20, 12);
			}

			gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
			gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindVertexArray(null);
		}

		return primitives;
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
}