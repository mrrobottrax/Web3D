import { gl, loadTexture, solidTex, SharedAttribs } from "../../render/gl.js";
import { Primitive, PrimitiveData } from "./primitive.js";
import { textures } from "./textures.js";

export class Mesh {
	primitives: Primitive[] = [];

	genBuffers(data: PrimitiveData[]) {

		this.primitives = [];

		for (let i = 0; i < data.length; ++i) {
			const vao = gl.createVertexArray();
			gl.bindVertexArray(vao);

			const vBuffer: WebGLBuffer | null = gl.createBuffer();
			const eBuffer: WebGLBuffer | null = gl.createBuffer();

			if (!vBuffer || !eBuffer || !vao) {
				console.error("Error creating buffer")
				return;
			}

			// get textures
			let t: WebGLTexture[] = [];
			this.primitives.push(new Primitive(
				vao,
				t,
				data[i].elements.length,
				data[i].color
			));
			if (data[i].textureUris.length > 0) {
				for (let j = 0; j < data[i].textureUris.length; ++j) {
					const url = data[i].textureUris[0];

					const textureLoaded = textures[url] !== undefined;

					if (textureLoaded) {
						t[j] = textures[url];
					} else {
						loadTexture(url).then((result) => {
							textures[url] = result.tex;
							if (!result.tex) {
								return;
							}
							this.primitives[i].textures[j] = result.tex;
						});
					}
				}
			} else {
				this.primitives[i].textures = [solidTex];
			}

			const length = data[i].positions.length + data[i].texCoords.length;
			let verts = new Float32Array(length);

			// merge into one array
			const vertCount = data[i].positions.length / 3;
			for (let j = 0; j < vertCount; ++j) {
				const index = j * 5;
				const posIndex = j * 3;
				const texIndex = j * 2;

				verts[index] = data[i].positions[posIndex];
				verts[index + 1] = data[i].positions[posIndex + 1];
				verts[index + 2] = data[i].positions[posIndex + 2];
				verts[index + 3] = data[i].texCoords[texIndex];
				verts[index + 4] = data[i].texCoords[texIndex + 1];
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data[i].elements, gl.STATIC_DRAW);

			gl.vertexAttribPointer(SharedAttribs.positionAttrib, 3, gl.FLOAT, false, 20, 0);
			gl.vertexAttribPointer(SharedAttribs.texCoordAttrib, 2, gl.FLOAT, false, 20, 12);

			gl.enableVertexAttribArray(SharedAttribs.positionAttrib);
			gl.enableVertexAttribArray(SharedAttribs.texCoordAttrib);

			gl.bindVertexArray(null);
		}
	}
}