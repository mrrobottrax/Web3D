import { defaultShader, gl, glProperties, loadTexture } from "./gl.js";
import gMath from "./gmath.js";
import { quaternion, vec3 } from "./vector.js";
import { Model } from "./mesh/model.js";
import { mat4 } from "./matrix.js";
import { Time } from "./time.js";
import { Primitive } from "./mesh/primitive.js";
import { loadGlTFFromWeb } from "./mesh/gltfloader.js";

const nearClip = 0.3;
const farClip = 1000;

let webModel: Model = new Model();

export async function drawInit(): Promise<void> {
	gl.useProgram(defaultShader.program);

	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false,
		calcPerspectiveMatrix(80, glProperties.width, glProperties.height).getData());

	gl.useProgram(null);

	webModel.position = new vec3(0, -2, -10);
	const m = await loadGlTFFromWeb("./data/models/texCube");
	if (m)
		webModel.mesh = m;
}

let r1 = 0;
let r2 = 0;
let r3 = 0;
export function drawFrame(): void {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(defaultShader.program);

	drawPrimitive(webModel.mesh.primitives[0], webModel.position, webModel.rotation, webModel.scale);

	gl.useProgram(null);

	webModel.rotation = quaternion.euler(r1, r2, r3);
	r1 += Time.deltaTime * 20;
	r2 += Time.deltaTime * 15;
	r3 += Time.deltaTime * 10;
}

function drawPrimitive(primitive: Primitive, position: vec3, rotation: quaternion, scale: vec3) {
	gl.bindVertexArray(primitive.vao);

	let mat = new mat4;
	mat.translate(position);
	mat.rotate(rotation);
	mat.scale(scale);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, primitive.textures[0]);

	gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, mat.getData());
	gl.uniform1i(defaultShader.samplerUnif, 0);

	gl.drawElements(gl.TRIANGLES, primitive.elementCount, gl.UNSIGNED_SHORT, 0);

	gl.bindTexture(gl.TEXTURE_2D, null);

	gl.bindVertexArray(null);
}

function calcPerspectiveMatrix(fov: number, width: number, height: number): mat4 {
	const scale = getFrustumScale(fov);

	let matrix = new mat4;
	matrix.setValue(0, 0, scale * (height / width));
	matrix.setValue(1, 1, scale);
	matrix.setValue(2, 2, (farClip + nearClip) / (nearClip - farClip));
	matrix.setValue(3, 2, (2 * farClip * nearClip) / (nearClip - farClip));
	matrix.setValue(2, 3, -1);

	return matrix;
}

function getFrustumScale(fov: number): number {
	return 1 / Math.tan(gMath.deg2Rad(fov) / 2);
}