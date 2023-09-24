import { HalfEdgeMesh } from "./mesh/halfedge.js";
import { Model } from "./mesh/model.js";

export interface LevelFile {
	collision: HalfEdgeMesh;
	gltfName: string,
	binName: string
}

export class Level {
	collision: HalfEdgeMesh = new HalfEdgeMesh();
	models: Model[] = [];
}

export async function setLevel(url: string): Promise<void> {
	// // create texture
	// const texture = gl.createTexture();
	// if (!texture) {
	// 	console.error("Failed to create texture: " + url);
	// 	return null
	// }

	// // set to fallback texture
	// gl.bindTexture(gl.TEXTURE_2D, texture);

	// const level = 0;
	// const internalFormat = gl.RGBA;
	// const border = 0;
	// const srcFormat = gl.RGBA;
	// const srcType = gl.UNSIGNED_BYTE;
	// const pixel = new Uint8Array([255, 0, 255, 255]);
	// gl.texImage2D(
	// 	gl.TEXTURE_2D,
	// 	level,
	// 	internalFormat,
	// 	1,
	// 	1,
	// 	border,
	// 	srcFormat,
	// 	srcType,
	// 	pixel,
	// );

	// // replace when texture loads
	// const image = new Image();
	// image.onload = () => {
	// 	gl.bindTexture(gl.TEXTURE_2D, texture);
	// 	gl.texImage2D(
	// 		gl.TEXTURE_2D,
	// 		level,
	// 		internalFormat,
	// 		srcFormat,
	// 		srcType,
	// 		image,
	// 	);

	// 	// power of 2 textures require special treatment
	// 	if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
	// 		//gl.generateMipmap(gl.TEXTURE_2D);
	// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	// 	} else {
	// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	// 	}

	// 	gl.bindTexture(gl.TEXTURE_2D, null);
	// };
	// image.src = url;

	// return texture;

	console.log("TEST");
}