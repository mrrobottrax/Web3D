import { player } from "../localplayer.js";
import gMath from "../math/gmath.js";
import { mat4 } from "../math/matrix.js";
import { vec3 } from "../math/vector.js";
import { Time } from "../time.js";
import { gl, loadTexture, uiShader } from "./gl.js";

let viewModelLocation = new vec3(0.8, -0.65, 0);
let viewModelScale = new vec3(0.75, 0.75, 0.75);

let gunTex: WebGLTexture;

let cycle = 0;

let bobOffset = new vec3(0, 0, 0);

const bobAmt = 0.05;
const bobSpeed = 1;

export function initViewmodel() {
	loadTexture("data/textures/fire0.png").then(
		(value) => {
			if (value) {
				gunTex = value;
			}
		}
	);
}

let lastSpeed = 0;
let playerSpeed = 0;
let speed = 0;
export function tickViewmodel() {
	lastSpeed = playerSpeed;
	playerSpeed = player.velocity.magnitide();
}

export function drawViewmodel() {
	speed = gMath.lerp(lastSpeed, playerSpeed, Time.fract);

	if (player.positionData.groundEnt != -1) {
		// loop
		cycle += (speed * bobSpeed * Time.deltaTime);
		cycle = cycle % (Math.PI * 2);
		bobOffset.y = -(Math.cos(cycle) + 1) * bobAmt;
	}
	
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