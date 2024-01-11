import { mat4 } from "../../common/math/matrix.js";
import { vec3 } from "../../common/math/vector.js";
import { SharedPlayer } from "../../common/player/sharedplayer.js";
import { Time } from "../../common/system/time.js";
import { gunAudioSource } from "../audio/audio.js";
import { loadTexture } from "../mesh/texture.js";
import { gl, uiShader } from "./gl.js";

let viewModelLocation = new vec3(0.8, -0.5, 0);
let viewModelScale = new vec3(0.5, 0.5, 1);

let gunIdle: WebGLTexture[] = [];
let gunFire: WebGLTexture[] = [];

let cycle = 0;
let blend = 0;

let lastBobOffset = new vec3(0, 0, 0);
let nextBobOffset = new vec3(0, 0, 0);

const bobAmt = 0.05;
const bobSpeed = 0.5;
const maxBobSpeed = 30;
const blendUp = 3;

enum AnimationEnum {
	idle,
	fire
}
let currentAnimation: AnimationEnum = AnimationEnum.idle;
let currentFrame: number = 0;
const frameRate = 30;
let frameTimer: number = 0;

export async function initViewmodel() {
	// keep aspect ratio
	viewModelScale.x = 89 / 99 * viewModelScale.y;

	gunIdle.push((await loadTexture("data/textures/fire0.png")).tex);
	gunFire.push((await loadTexture("data/textures/fire1.png")).tex);
	gunFire.push((await loadTexture("data/textures/fire2.png")).tex);
}

export function tickViewmodel(player: SharedPlayer) {
	lastBobOffset.copy(nextBobOffset);

	let playerSpeed = player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z;
	playerSpeed = Math.sqrt(playerSpeed);

	if (playerSpeed > maxBobSpeed) {
		playerSpeed = maxBobSpeed;
	}

	const blendGoal = playerSpeed / 9;

	if (blend < blendGoal) {
		blend += Time.fixedDeltaTime * blendUp;

		if (blend > blendGoal)
			blend = blendGoal
	}
	else if (blend > blendGoal) {
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

	if (frameTimer < 0) {
		frameTimer = 1 / frameRate;
		currentFrame = (currentFrame + 1) % getCurrentAnimation().length;

		// go back to idle
		if (currentAnimation == AnimationEnum.fire && currentFrame == 0) {
			setAnimation(AnimationEnum.idle);
		}
	} else {
		frameTimer -= Time.fixedDeltaTime;
	}
}

export function drawViewmodel() {
	const bobOffset = vec3.lerp(lastBobOffset, nextBobOffset, Time.fract);

	let mat;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, getCurrentFrame());

	mat = mat4.identity();

	mat.translate(viewModelLocation);
	mat.translate(bobOffset);

	mat.scale(viewModelScale);

	gl.uniformMatrix4fv(uiShader.modelViewMatrixUnif, false, mat.getData());
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

	gl.bindTexture(gl.TEXTURE_2D, null);
}

export function fireViewmodel() {
	setAnimation(AnimationEnum.fire);
	gunAudioSource.play();
}

function setAnimation(animation: AnimationEnum) {
	currentAnimation = animation;
	currentFrame = 0;
	frameTimer = 1 / frameRate;
}

function getCurrentAnimation(): WebGLTexture[] {
	switch (currentAnimation) {
		case AnimationEnum.idle:
			return gunIdle;
		case AnimationEnum.fire:
			return gunFire;
	}
}

function getCurrentFrame(): WebGLTexture {
	return getCurrentAnimation()[currentFrame];
}