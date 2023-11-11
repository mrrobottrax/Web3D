import { UninstancedShaderBase, defaultShader, fallbackShader, gl, glProperties, lineBuffer, skinnedShader, solidShader } from "./gl.js";
import gMath from "../../common/math/gmath.js";
import { vec3 } from "../../common/math/vector.js";
import { Mesh } from "../mesh/mesh.js";
import { mat4 } from "../../common/math/matrix.js";
import { Primitive } from "../mesh/primitive.js";
import { currentLevel, gameobjectsList } from "../level.js";
import { Time } from "../../time.js";
import { drawUi } from "./ui.js";
import { SharedPlayer } from "../../sharedplayer.js";
import { Client } from "../client.js";
import { loadGltfFromWeb } from "../mesh/gltfloader.js";
import { AnimatedGameObject, SkinnedProp, StaticProp } from "../mesh/prop.js";
import { Transform } from "../../componentsystem/transform.js";
import { GameObject } from "../../componentsystem/gameobject.js";

const nearClip = 0.015;
const farClip = 1000;

let perspectiveMatrix: mat4;
let viewMatrix: mat4 = mat4.identity();
export let uiMatrix: mat4;

let debugModel: GameObject;
export async function initRender() {
	debugModel = await loadGltfFromWeb("./data/models/sci_player");
	debugModel.transform.position = new vec3(0, 2, 0);
	(debugModel as AnimatedGameObject).controller.currentAnimation = (debugModel as AnimatedGameObject).animations[0];
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
	viewMatrix.rotate(client.localPlayer.camRotation.inverse());
	viewMatrix.translate(camPos.inverse());

	if (currentLevel != undefined) {
		for (let i = 0; i < gameobjectsList.length; ++i) {
			// animations
			if (gameobjectsList[i] instanceof AnimatedGameObject) {
				(gameobjectsList[i] as AnimatedGameObject).controller.frame();
			}

			// update positions
			updateWorldMatrix(gameobjectsList[i].transform);
		}

		gl.useProgram(defaultShader.program);
		for (let i = 0; i < gameobjectsList.length; ++i) {
			// draw regular shaded stuff
			if (gameobjectsList[i] instanceof StaticProp)
				drawModelStatic(gameobjectsList[i] as StaticProp, viewMatrix, defaultShader);
		}

		gl.useProgram(skinnedShader.program);
		for (let i = 0; i < gameobjectsList.length; ++i) {
			// draw skinned meshes
			if (gameobjectsList[i] instanceof SkinnedProp)
				drawModelSkinned(gameobjectsList[i] as SkinnedProp, viewMatrix, skinnedShader);
		}

		gl.useProgram(null);
	}

	drawPlayersDebug(client.localPlayer, client.otherPlayers.values());
	drawDebug(client.localPlayer);

	drawUi();
}

function updateWorldMatrix(transform: Transform, baseMat: mat4 = mat4.identity()) {
	transform.worldMatrix.set(baseMat);
	transform.worldMatrix.translate(transform.position);
	transform.worldMatrix.rotate(transform.rotation);
	transform.worldMatrix.scale(transform.scale);

	for (let i = 0; i < transform.children.length; ++i) {
		updateWorldMatrix(transform.children[i], transform.worldMatrix);
	}
}

function drawDebug(player: SharedPlayer) {
	// draw lines
	gl.useProgram(solidShader.program);

	let mat = mat4.identity();
	mat.rotate(player.camRotation.inverse());
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

function drawPlayersDebug(localPlayer: SharedPlayer, otherPlayers: IterableIterator<SharedPlayer>) {
	for (let player of otherPlayers) {
		drawLine(player.position, player.position.add(new vec3(0, 2, 0)), [1, 1, 0, 1], 0);
	}
}

function drawModelStatic(model: StaticProp, mat: mat4, shader: UninstancedShaderBase) {
	drawMesh(model.meshRenderer.mesh, mat.multiply(model.transform.worldMatrix), shader);
}

function drawModelSkinned(model: SkinnedProp, mat: mat4, shader: UninstancedShaderBase) {
	let _mat = mat.multiply(model.transform.worldMatrix);
	const skinnedModel = model.meshRenderer;

	// create bone matrices
	let floatArray: Float32Array = new Float32Array(skinnedModel.inverseBindMatrices.length * 16);
	for (let i = 0; i < skinnedModel.inverseBindMatrices.length; ++i) {
		let mat = skinnedModel.inverseBindMatrices[i];
		const arr2 = skinnedModel.joints[i].worldMatrix.multiply(mat).getData();

		for (let j = 0; j < 16; ++j) {
			floatArray[i * 16 + j] = arr2[j];
		}
	}

	// draw lines
	for (let i = 0; i < skinnedModel.joints.length; ++i) {
		const joint = skinnedModel.joints[i];
		const start = vec3.origin().multMat4(joint.worldMatrix);
		const end = new vec3(0, 0.5, 0).multMat4(joint.worldMatrix);
		drawLine(start, end, [0, 1, 1, 1], 0);
	}

	gl.uniformMatrix4fv(skinnedShader.boneMatricesUnif, false, floatArray);
	drawMeshSkinned(skinnedModel.mesh, _mat, shader);
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