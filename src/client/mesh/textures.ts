import { Primitive } from "../../common/mesh/model.js";
import { loadTexture, solidTex } from "../render/gl.js";

export let textures: any = {

}

export function loadPrimitiveTexture(texture: string, primitive: Primitive) {
	if (texture) {
		const url = texture;

		const textureLoaded = textures[url] !== undefined;

		if (textureLoaded) {
			primitive.texture = textures[url];
		} else {
			loadTexture(url).then((result) => {
				textures[url] = result.tex;
				if (!result.tex) {
					return;
				}
				primitive.texture = result.tex;
			});
		}
	} else {
		primitive.texture = solidTex;
	}
}