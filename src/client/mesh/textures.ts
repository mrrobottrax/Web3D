import { Primitive } from "../../common/mesh/model.js";
import { gl } from "../render/gl.js";

export let solidTex: WebGLTexture;

export async function loadPrimitiveTexture(texture: string, primitive: Primitive) {
	if (texture) {
		const url = texture;

		const tex = (await loadTexture(url)).tex;
		if (tex) primitive.texture = tex;
		else primitive.texture = solidTex;

	} else {
		primitive.texture = solidTex;
	}
}

// ~~~~~~~~~~~~~ default solid texture ~~~~~~~~~~~~~~

export function createSolidTexture(): void {
	// create texture
	const t = gl.createTexture();
	if (!t) {
		console.error("Failed to create solid texture")
		return;
	}

	solidTex = t;

	// set texture properties
	gl.bindTexture(gl.TEXTURE_2D, solidTex);

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;

	// generate texture
	const pixel = new Uint8Array([255, 255, 255, 255]); // opaque blue
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		width,
		height,
		border,
		srcFormat,
		srcType,
		pixel,
	);

	gl.bindTexture(gl.TEXTURE_2D, null);
}

// ~~~~~~~~~~~~~ load a texture from url ~~~~~~~~~~~~~~

export async function loadTexture(url: string): Promise<{ tex: WebGLTexture | null, image: HTMLImageElement }> {
	// create texture
	const texture = gl.createTexture();
	if (!texture) {
		console.error("Failed to create texture: " + url);
		return { tex: null, image: new Image() };
	}

	// set to fallback texture
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([255, 0, 255, 255]);
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		1,
		1,
		border,
		srcFormat,
		srcType,
		pixel,
	);

	// replace when texture loads
	const image = new Image();
	image.onload = () => {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			srcFormat,
			srcType,
			image,
		);

		// power of 2 textures require special treatment
		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	image.src = url;

	return { tex: texture, image: image };
}

function isPowerOf2(value: number): boolean {
	return (value & (value - 1)) === 0;
}