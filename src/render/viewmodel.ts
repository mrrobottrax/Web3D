import { player } from "../localplayer.js";
import { mat4 } from "../math/matrix.js";
import { vec3 } from "../math/vector.js";
import { Time } from "../time.js";
import { gl, loadTexture, uiShader } from "./gl.js";

let viewModelLocation = new vec3(0.8, -0.65, 0);
let viewModelScale = new vec3(0.75, 0.75, 1);

let gunTex: WebGLTexture;
let gunFire: WebGLTexture[] = [];

let cycle = 0;
let blend = 0;

let lastBobOffset = new vec3(0, 0, 0);
let nextBobOffset = new vec3(0, 0, 0);

const bobAmt = 0.05;
const bobSpeed = 0.5;
const maxBobSpeed = 30;
const blendUp = 3;

export function initViewmodel() {
	loadTexture("data/textures/fire0.png").then(
		(value) => {
			if (value.tex) {
				gunTex = value.tex;
			}
		}
	);
	loadTexture("data/textures/fire2.png").then(
		(value) => {
			if (value.tex) {
				gunFire.push(value.tex);
			}
		}
	);
}

export function tickViewmodel() {
	lastBobOffset.copy(nextBobOffset);

	let playerSpeed = player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z;
	playerSpeed = Math.sqrt(playerSpeed);

	if (playerSpeed > maxBobSpeed) {
		playerSpeed = maxBobSpeed;
	}

	const blendGoal = playerSpeed / 9;

	if (blend < blendGoal)
	{
		blend += Time.fixedDeltaTime * blendUp;
	}
	else if (blend > blendGoal)
	{
		blend = blendGoal;
	}

	if (blend > 1) {
		blend = 1;
	} else {
		if (blend < 0) {
			blend = 0;
			cycle = 0;
		}
	}

	cycle += playerSpeed * bobSpeed * Time.fixedDeltaTime;
	cycle %= Math.PI * 2;

	nextBobOffset.y = -(Math.cos(cycle * 2) + 1) * bobAmt * blend;
	nextBobOffset.x = Math.sin(cycle) * bobAmt * 2 * blend;
}

export function drawViewmodel() {
	const bobOffset = vec3.lerp(lastBobOffset, nextBobOffset, Time.fract);

	let mat;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, gunTex);

	mat = mat4.identity();

	mat.translate(viewModelLocation);
	mat.translate(bobOffset);

	mat.scale(viewModelScale);

	gl.uniformMatrix4fv(uiShader.modelViewMatrixUnif, false, mat.getData());
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

	gl.bindTexture(gl.TEXTURE_2D, null);
}