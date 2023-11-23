import { SkinnedShaderBase, UninstancedShaderBase, defaultShader, fallbackShader, gl, glProperties, lineBuffer, skinnedShader, solidShader } from "./gl.js";
import gMath from "../../common/math/gmath.js";
import { vec3 } from "../../common/math/vector.js";
import { mat4 } from "../../common/math/matrix.js";
import { HierarchyNode, Model, Primitive } from "../../common/mesh/model.js";
import { currentLevel } from "../entities/level.js";
import { Time } from "../../common/system/time.js";
import { drawUi } from "./ui.js";
import { SharedPlayer } from "../../common/player/sharedplayer.js";
import { Client } from "../system/client.js";
import { PlayerUtil } from "../../common/player/playerutil.js";
import { DynamicProp, PropBase } from "../mesh/prop.js";
import { entityList } from "../../common/entitysystem/entity.js";
import { Transform } from "../../common/entitysystem/transform.js";
import { ClientPlayer } from "../player/clientplayer.js";
import { ClientGltfLoader } from "../mesh/gltfloader.js";

const nearClip = 0.015;
const farClip = 1000;

let perspectiveMatrix: mat4;
let viewMatrix: mat4 = mat4.identity();
export let uiMatrix: mat4;

let debugModel: DynamicProp;
export async function initRender() {
	debugModel = new DynamicProp(await ClientGltfLoader.loadGltfFromWeb("./data/models/sci_player"));
	debugModel.transform.translation = new vec3(0, 0, -2);
	const length = debugModel.model.animations.length;
	const index = Math.floor(Math.random() * length);
	console.log(index);
	debugModel.controller.setAnimation(debugModel.model.animations[index]);
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

	if (currentLevel) {
		gl.useProgram(defaultShader.program);
		drawProp(currentLevel.prop, defaultShader);

		gl.useProgram(skinnedShader.program);
		drawPropSkinned(debugModel.nodeTransforms, debugModel.model, debugModel.transform.worldMatrix, skinnedShader);
		drawPlayersDebug(client.otherPlayers.values());

		gl.useProgram(null);
	}

	drawDebug(client.localPlayer);

	drawUi();
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

function drawPlayersDebug(otherPlayers: IterableIterator<ClientPlayer>) {
	for (let player of otherPlayers) {
		// const pos = PlayerUtil.getFeet(player);
		// drawLine(pos, pos.add(new vec3(0, 2, 0)), [1, 1, 0, 1], 0);

		drawPropSkinned(player.nodeTransforms, player.model, player.transform.worldMatrix, skinnedShader);
	}
}

function drawProp(prop: PropBase, shader: UninstancedShaderBase) {
	// apply hierarchy
	const hierarchyRecursive = (node: HierarchyNode, parentMat: mat4) => {
		const transform = prop.nodeTransforms[node.index];
		const worldMat = transform.worldMatrix;
		worldMat.set(parentMat);
		worldMat.translate(transform.translation);
		worldMat.rotate(transform.rotation);
		worldMat.scale(transform.scale);

		for (let i = 0; i < node.children.length; ++i) {
			hierarchyRecursive(node.children[i], worldMat);
		}
	}

	for (let i = 0; i < prop.model.hierarchy.length; ++i) {
		hierarchyRecursive(prop.model.hierarchy[i], prop.transform.worldMatrix);
	}

	for (let i = 0; i < prop.model.nodes.length; ++i) {
		const node = prop.model.nodes[i];
		const mat = viewMatrix.multiply(prop.nodeTransforms[i].worldMatrix);

		// bone
		if (node.primitives.length == 0) {
			drawLineScreen(vec3.origin().multMat4(mat), new vec3(0, 1, 0).multMat4(mat), [1, 0, 0, 1], 0);
			continue;
		}

		for (let j = 0; j < node.primitives.length; ++j) {
			drawPrimitive(node.primitives[j], mat, shader);
		}
	}
}

function drawPropSkinned(nodeTransforms: Transform[], model: Model, worldMatrix: mat4, shader: UninstancedShaderBase) {
	// apply hierarchy
	const hierarchyRecursive = (node: HierarchyNode, parentMat: mat4) => {
		const transform = nodeTransforms[node.index];
		const worldMat = transform.worldMatrix;
		worldMat.set(parentMat);
		worldMat.translate(transform.translation);
		worldMat.rotate(transform.rotation);
		worldMat.scale(transform.scale);

		for (let i = 0; i < node.children.length; ++i) {
			hierarchyRecursive(node.children[i], worldMat);
		}
	}

	for (let i = 0; i < model.hierarchy.length; ++i) {
		hierarchyRecursive(model.hierarchy[i], worldMatrix);
	}

	for (let i = 0; i < model.nodes.length; ++i) {
		const node = model.nodes[i];
		
		// bone
		if (node.primitives.length == 0) {
			const mat = nodeTransforms[i].worldMatrix;
			drawLine(vec3.origin().multMat4(mat), new vec3(0, 1, 0).multMat4(mat), [0, 1, 0, 1], 0);
			continue;
		}

		if (!node.joints || !node.inverseBindMatrices) {
			console.error("Missing properties");
			continue;
		}

		// create bone matrices
		let floatArray: Float32Array = new Float32Array(node.inverseBindMatrices.length * 16);
		for (let i = 0; i < node.inverseBindMatrices.length; ++i) {
			const arr2 = nodeTransforms[node.joints[i]].worldMatrix.multiply(node.inverseBindMatrices[i]).getData();

			for (let j = 0; j < 16; ++j) {
				floatArray[i * 16 + j] = arr2[j];
			}
		}

		gl.uniformMatrix4fv((shader as SkinnedShaderBase).boneMatricesUnif, false, floatArray);
		for (let j = 0; j < node.primitives.length; ++j) {
			drawPrimitive(node.primitives[j], viewMatrix, shader);
		}
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