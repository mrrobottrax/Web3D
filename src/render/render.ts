import { defaultShader, fallbackShader, gl, glProperties, lineBuffer, solidShader } from "./gl.js";
import gMath from "../math/gmath.js";
import { quaternion, vec3 } from "../math/vector.js";
import { Mesh } from "../mesh/mesh.js";
import { Model } from "../mesh/model.js";
import { mat4 } from "../math/matrix.js";
import { Time } from "../time.js";
import { Primitive } from "../mesh/primitive.js";
import { loadGlTFFromWeb } from "../mesh/gltfloader.js";
import { player } from "../localplayer.js";
import { currentLevel } from "../level.js";

const nearClip = 0.3;
const farClip = 1000;

let webModel: Model;

export async function drawInit(): Promise<void> {
	webModel = (await loadGlTFFromWeb("./data/models/texCube"))[0];
	webModel.position = new vec3(0, -2, -5);
}

export function initProjection() {
	let proj = calcPerspectiveMatrix(90, glProperties.width, glProperties.height).getData()

	gl.useProgram(fallbackShader.program);
	gl.uniformMatrix4fv(fallbackShader.projectionMatrixUnif, false, proj);

	gl.useProgram(defaultShader.program);
	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, proj);

	gl.useProgram(solidShader.program);
	gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, proj);

	gl.useProgram(null);
}

let r1 = 0;
let r2 = 0;
let r3 = 0;
export function drawFrame(): void {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(defaultShader.program);

	let mat = mat4.identity();
	mat.rotate(player.camRotation);
	mat.translate(player.camPosition.inverse());

	drawModel(webModel, mat);

	for (let i = 0; i < currentLevel.models.length; ++i) {
		drawModel(currentLevel.models[i], mat);
	}

	drawLine(new vec3(-1, -1, -1), new vec3(1, 1, 1), [1, 1, 1, 1]);

	gl.useProgram(null);

	webModel.rotation = quaternion.euler(r1, r2, r3);
	r1 += Time.deltaTime * 0;
	r2 += Time.deltaTime * 0;
	r3 += Time.deltaTime * 0;
}

function drawModel(model: Model, mat: mat4) {
	drawMesh(model.mesh, model.position, model.rotation, model.scale, mat);
}

function drawMesh(mesh: Mesh, position: vec3, rotation: quaternion, scale: vec3, mat: mat4) {
	for (let i = 0; i < mesh.primitives.length; ++i) {
		drawPrimitive(mesh.primitives[i], position, rotation, scale, mat);
	}
}

export function drawLine(start: vec3, end: vec3, color: number[]) {
	gl.useProgram(solidShader.program);

	let mat = mat4.identity();
	mat.rotate(player.camRotation);
	mat.translate(player.camPosition.inverse());

	gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());
	gl.uniform4fv(solidShader.colorUnif, color);

	gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([
		start.x, start.y, start.z, end.x, end.y, end.z]));

	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

	gl.enableVertexAttribArray(0);

	gl.drawArrays(gl.LINES, 0, 2);

	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	gl.useProgram(null);
}

function drawPrimitive(primitive: Primitive, position: vec3, rotation: quaternion, scale: vec3, mat: mat4) {
	gl.bindVertexArray(primitive.vao);

	let _mat = mat.copy();
	_mat.translate(position);
	_mat.rotate(rotation);
	_mat.scale(scale);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, primitive.textures[0]);

	gl.uniform4fv(defaultShader.colorUnif, primitive.color);
	gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, _mat.getData());
	gl.uniform1i(defaultShader.samplerUnif, 0);

	gl.drawElements(gl.TRIANGLES, primitive.elementCount, gl.UNSIGNED_SHORT, 0);

	gl.bindTexture(gl.TEXTURE_2D, null);

	gl.bindVertexArray(null);
}

function calcPerspectiveMatrix(fov: number, width: number, height: number): mat4 {
	const scale = getFrustumScale(fov);

	let matrix = mat4.empty();
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