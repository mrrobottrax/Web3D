import { UninstancedShaderBase, defaultShader, fallbackShader, gl, glProperties, lineBuffer, skinnedShader, solidShader } from "./gl.js";
import gMath from "../../common/math/gmath.js";
import { vec3 } from "../../common/math/vector.js";
import { Mesh } from "../mesh/mesh.js";
import { StaticModel, ModelBase, SkinnedModel } from "../mesh/model.js";
import { mat4 } from "../../common/math/matrix.js";
import { Primitive } from "../mesh/primitive.js";
import { currentLevel } from "../level.js";
import { Time } from "../../time.js";
import { drawUi } from "./ui.js";
import { SharedPlayer } from "../../sharedplayer.js";
import { Client } from "../client.js";
import { loadGltfFromWeb } from "../mesh/gltfloader.js";

const nearClip = 0.015;
const farClip = 1000;

let perspectiveMatrix: mat4;
let viewMatrix: mat4 = mat4.identity();
export let uiMatrix: mat4;

let debugModel: StaticModel | SkinnedModel;
export async function initRender() {
	debugModel = await loadGltfFromWeb("./data/models/skintest");
	debugModel.transform.position = new vec3(0, 2, 0);
}

export function initProjection() {
	perspectiveMatrix = calcPerspectiveMatrix(90, glProperties.width, glProperties.height);
	uiMatrix = calcUiMatrix(glProperties.width, glProperties.height);

	gl.useProgram(fallbackShader.program);
	gl.uniformMatrix4fv(fallbackShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

	gl.useProgram(defaultShader.program);
	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

	gl.useProgram(skinnedShader.program);
	gl.uniformMatrix4fv(skinnedShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

	gl.useProgram(solidShader.program);
	gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

	gl.useProgram(null);
}

export let lastCamPos: vec3 = vec3.origin();
export let camPos: vec3;
export function updateInterp(client: Client) {
	camPos = vec3.lerp(lastCamPos, client.localPlayer.camPosition, Time.fract);
}

let shouldDrawLevel = true;
export function toggleDraw() {
	shouldDrawLevel = !shouldDrawLevel;
}

export function drawFrame(client: Client): void {
	if (!shouldDrawLevel)
		return;

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	viewMatrix.setIdentity();
	viewMatrix.rotate(client.localPlayer.camRotation);
	viewMatrix.translate(camPos.inverse());

	drawLevel(client.localPlayer);
	drawPlayers(client.localPlayer, client.otherPlayers.values());
	drawDebug(client.localPlayer);

	drawUi();
}

function updateWorldMatrix(model: ModelBase, baseMat: mat4 = mat4.identity()) {
	model.transform.worldMatrix.set(baseMat);
	model.transform.worldMatrix.translate(model.transform.position);
	model.transform.worldMatrix.rotate(model.transform.rotation);
	model.transform.worldMatrix.scale(model.transform.scale);

	for (let i = 0; i < model.children.length; ++i) {
		updateWorldMatrix(model.children[i], model.transform.worldMatrix);
	}
}

function drawDebug(player: SharedPlayer) {
	// draw lines
	gl.useProgram(solidShader.program);

	let mat = mat4.identity();
	mat.rotate(player.camRotation);
	mat.translate(camPos.inverse());

	gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat.getData());

	gl.disable(gl.DEPTH_TEST);

	for (let i = 0; i < lines.length; ++i) {
		const line = lines[i];

		gl.uniform4fv(solidShader.colorUnif, line.color);

		gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([
			line.start.x, line.start.y, line.start.z, line.end.x, line.end.y, line.end.z]));

		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(0);

		gl.drawArrays(gl.LINES, 0, 2);

		line.time -= Time.deltaTime;

		if (line.time < 0) {
			lines.splice(i, 1);
			--i;
		}
	}

	gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, mat4.identity().getData());

	for (let i = 0; i < screenLines.length; ++i) {
		const line = screenLines[i];

		gl.uniform4fv(solidShader.colorUnif, line.color);

		gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([
			line.start.x, line.start.y, line.start.z, line.end.x, line.end.y, line.end.z]));

		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(0);

		gl.drawArrays(gl.LINES, 0, 2);

		line.time -= Time.deltaTime;

		if (line.time < 0) {
			screenLines.splice(i, 1);
			--i;
		}
	}

	gl.enable(gl.DEPTH_TEST);

	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	gl.useProgram(null);
}

function drawPlayers(localPlayer: SharedPlayer, otherPlayers: IterableIterator<SharedPlayer>) {
	for (let player of otherPlayers) {
		drawLine(player.position, player.position.add(new vec3(0, 2, 0)), [1, 1, 0, 1], 0);
	}

	gl.useProgram(skinnedShader.program);

	// debug model!
	if (debugModel) {
		updateWorldMatrix(debugModel);
		drawModelSkinned(debugModel, viewMatrix, skinnedShader);
	}

	gl.useProgram(null);
}

function drawLevel(player: SharedPlayer) {
	// update world matrices
	if (currentLevel != undefined) {
		updateWorldMatrix(currentLevel.model);
	}

	gl.useProgram(defaultShader.program);

	if (currentLevel != undefined) {
		drawModel(currentLevel.model, viewMatrix, defaultShader);
	}

	gl.useProgram(null);
}

function drawModel(model: ModelBase, mat: mat4, shader: UninstancedShaderBase) {
	let _mat = mat.multiply(model.transform.worldMatrix);
	if (!model.skinned)
		drawMesh((model as StaticModel).mesh, _mat, shader);

	for (let i = 0; i < model.children.length; ++i) {
		drawModel(model.children[i], mat, shader);
	}
}

function drawModelSkinned(model: ModelBase, mat: mat4, shader: UninstancedShaderBase) {
	let _mat = mat.multiply(model.transform.worldMatrix);
	if (model.skinned) {
		const skinnedModel = model as SkinnedModel;

		// create bone matrices
		let floatArray: Float32Array = new Float32Array(skinnedModel.inverseBindMatrices.length * 16);
		for (let i = 0; i < skinnedModel.inverseBindMatrices.length; ++i) {
			let mat = skinnedModel.inverseBindMatrices[i];
			const arr2 = mat.multiply(skinnedModel.joints[i].transform.worldMatrix).getData();

			for (let j = 0; j < 16; ++j) {
				floatArray[i * 16 + j] = arr2[j];
			}
		}

		skinnedModel.joints[2].transform.position.x += Time.deltaTime * 0.1;

		gl.uniformMatrix4fv(skinnedShader.boneMatricesUnif, false, floatArray);
		drawMeshSkinned(skinnedModel.mesh, _mat, shader);
	} else {
		const start = vec3.origin().multMat4(_mat);
		const end = new vec3(0, 0.5, 0).multMat4(_mat);
		drawLineScreen(start, end, [0, 1, 1, 1], 0);
	}


	for (let i = 0; i < model.children.length; ++i) {
		drawModelSkinned(model.children[i], mat, shader);
	}
}

function drawMesh(mesh: Mesh, mat: mat4, shader: UninstancedShaderBase) {
	for (let i = 0; i < mesh.primitives.length; ++i) {
		drawPrimitive(mesh.primitives[i], mat, shader);
	}
}

function drawMeshSkinned(mesh: Mesh, mat: mat4, shader: UninstancedShaderBase) {
	for (let i = 0; i < mesh.primitives.length; ++i) {
		drawPrimitive(mesh.primitives[i], mat, shader);
	}
}

interface Line {
	start: vec3,
	end: vec3,
	color: number[],
	time: number
}
let lines: Line[] = [];
export function drawLine(start: vec3, end: vec3, color: number[], time: number = Time.fixedDeltaTime) {
	lines.push({ start: vec3.copy(start), end: vec3.copy(end), color: color, time: time });
}

let screenLines: Line[] = [];
export function drawLineScreen(start: vec3, end: vec3, color: number[], time: number = Time.fixedDeltaTime) {
	screenLines.push({ start: vec3.copy(start), end: vec3.copy(end), color: color, time: time });
}

function drawPrimitive(primitive: Primitive, mat: mat4, shader: UninstancedShaderBase) {
	gl.bindVertexArray(primitive.vao);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, primitive.textures[0]);

	gl.uniform4fv(shader.colorUnif, primitive.color);
	gl.uniformMatrix4fv(shader.modelViewMatrixUnif, false, mat.getData());
	gl.uniform1i(shader.samplerUnif, 0);

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

function calcUiMatrix(width: number, height: number): mat4 {
	let matrix = mat4.identity();

	matrix.setValue(0, 0, height / width);

	return matrix;
}

function getFrustumScale(fov: number): number {
	return 1 / Math.tan(gMath.deg2Rad(fov) / 2);
}