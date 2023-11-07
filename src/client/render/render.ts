import { defaultShader, fallbackShader, gl, glProperties, lineBuffer, solidShader } from "./gl.js";
import gMath from "../../common/math/gmath.js";
import { vec3 } from "../../common/math/vector.js";
import { Mesh } from "../mesh/mesh.js";
import { Model } from "../mesh/model.js";
import { mat4 } from "../../common/math/matrix.js";
import { Primitive } from "../mesh/primitive.js";
import { currentLevel } from "../level.js";
import { Time } from "../../time.js";
import { drawUi } from "./ui.js";
import { SharedPlayer } from "../../sharedplayer.js";
import { Client } from "../client.js";
import { loadGlTFFromWeb } from "../mesh/gltfloader.js";

const nearClip = 0.015;
const farClip = 1000;

let perspectiveMatrix: mat4;
export let uiMatrix: mat4;

let debugModel: Model;
export async function initRender() {
	debugModel = (await loadGlTFFromWeb("./data/models/skintest"))[0];
	debugModel.position = new vec3(0, 3, 0);
}

export function initProjection() {
	perspectiveMatrix = calcPerspectiveMatrix(90, glProperties.width, glProperties.height);
	uiMatrix = calcUiMatrix(glProperties.width, glProperties.height);

	gl.useProgram(fallbackShader.program);
	gl.uniformMatrix4fv(fallbackShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

	gl.useProgram(defaultShader.program);
	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, perspectiveMatrix.getData());

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

	drawLevel(client.localPlayer);
	drawPlayers(client.localPlayer, client.otherPlayers.values());
	drawDebug(client.localPlayer);

	drawUi();
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

	gl.enable(gl.DEPTH_TEST);

	gl.bindBuffer(gl.ARRAY_BUFFER, null)

	gl.useProgram(null);
}

function drawPlayers(localPlayer: SharedPlayer, otherPlayers: IterableIterator<SharedPlayer>) {
	for (let player of otherPlayers) {
		drawLine(player.position, player.position.add(new vec3(0, 2, 0)), [1, 1, 0, 1], 0);
	}
}

function drawLevel(player: SharedPlayer) {
	gl.useProgram(defaultShader.program);

	let mat = mat4.identity();
	mat.rotate(player.camRotation);
	mat.translate(camPos.inverse());

	if (currentLevel != undefined) {
		for (let i = 0; i < currentLevel.models.length; ++i) {
			drawModel(currentLevel.models[i], mat);
		}

		// debug model!
		if (debugModel)
			drawModel(debugModel, mat);
	}

	gl.useProgram(null);
}

function drawModel(model: Model, mat: mat4) {
	let _mat = mat.copy();
	_mat.translate(model.position);
	_mat.rotate(model.rotation);
	_mat.scale(model.scale);

	drawMesh(model.mesh, _mat);

	for (let i = 0; i < model.children.length; ++i) {
		drawModel(model.children[i], _mat);
	}
}

function drawMesh(mesh: Mesh, mat: mat4) {
	for (let i = 0; i < mesh.primitives.length; ++i) {
		drawPrimitive(mesh.primitives[i], mat);
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

function drawPrimitive(primitive: Primitive, mat: mat4) {
	gl.bindVertexArray(primitive.vao);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, primitive.textures[0]);

	gl.uniform4fv(defaultShader.colorUnif, primitive.color);
	gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, mat.getData());
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

function calcUiMatrix(width: number, height: number): mat4 {
	let matrix = mat4.identity();

	matrix.setValue(0, 0, height / width);

	return matrix;
}

function getFrustumScale(fov: number): number {
	return 1 / Math.tan(gMath.deg2Rad(fov) / 2);
}