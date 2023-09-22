import { player } from "./localplayer.js";
import { quaternion, vec3 } from "./math/vector.js";
import { canvas } from "./render/gl.js";

export let moveVector = vec3.origin();

enum Buttons {
	forward,
	backward,
	moveleft,
	moveright,
	moveup,
	movedown,

	MAX_BUTTONS
}

let buttons = new Array<boolean>(Buttons.MAX_BUTTONS);

export function initInput() {
	document.addEventListener('keydown', event => {
		keyDown(event.key, event.code);
	});
	document.addEventListener('keyup', event => {
		keyUp(event.key, event.code);
	});

	document.addEventListener("click", event => {
		lockCursor();
	});

	document.addEventListener("mousemove", event => {
		mouseLook(event.movementX, event.movementY)
	});
}

export function updateInput() {
	moveVector = vec3.origin();

	moveVector.z -= buttons[Buttons.forward] ? 1 : 0;
	moveVector.z += buttons[Buttons.backward] ? 1 : 0;
	moveVector.x -= buttons[Buttons.moveleft] ? 1 : 0;
	moveVector.x += buttons[Buttons.moveright] ? 1 : 0;
	moveVector.y += buttons[Buttons.moveup] ? 1 : 0;
	moveVector.y -= buttons[Buttons.movedown] ? 1 : 0;

	player.move(moveVector);
}

const sens = 0.002;
function mouseLook(x: number, y: number) {
	player.yaw -= x * sens;
	player.pitch -= y * sens;
	player.camRotation = quaternion.eulerRad(player.pitch, player.yaw, 0);
}

function keyDown(name: string, code: string) {
	switch (code) {
		case "Escape":
			unlockCursor();
			break;
		case "KeyW":
			buttons[Buttons.forward] = true;
			break;
		case "KeyA":
			buttons[Buttons.moveleft] = true;
			break;
		case "KeyS":
			buttons[Buttons.backward] = true;
			break;
		case "KeyD":
			buttons[Buttons.moveright] = true;
			break;
		case "Space":
			buttons[Buttons.moveup] = true;
			break;
		case "ShiftLeft":
			buttons[Buttons.movedown] = true;
			break;
		default:
			console.log(code);
			break;
	}
}

function keyUp(name: string, code: string) {
	switch (code) {
		case "KeyW":
			buttons[Buttons.forward] = false;
			break;
		case "KeyA":
			buttons[Buttons.moveleft] = false;
			break;
		case "KeyS":
			buttons[Buttons.backward] = false;
			break;
		case "KeyD":
			buttons[Buttons.moveright] = false;
			break;
		case "Space":
			buttons[Buttons.moveup] = false;
			break;
		case "ShiftLeft":
			buttons[Buttons.movedown] = false;
			break;
		default:
			console.log(code);
			break;
	}
}

export function lockCursor() {
	/*canvas.requestPointerLock({
		unadjustedMovement: true
	});*/

	canvas.requestPointerLock();
}

export function unlockCursor() {
	document.exitPointerLock();
}