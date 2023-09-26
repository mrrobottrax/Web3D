import { config } from "./config.js";
import { player } from "./localplayer.js";
import { quaternion, vec3 } from "./math/vector.js";
import { lockCursor, unlockCursor } from "./pointerlock.js"
import { advanceGame, pauseGame } from "./time.js";

export let moveVector = vec3.origin();
export let pointerLocked: boolean = false;

export enum Buttons {
	forward,
	backward,
	moveleft,
	moveright,
	moveup,
	movedown,
	jump,

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

	document.onpointerlockchange = event => {
		if (document.pointerLockElement) {
			pointerLocked = true;
		} else {
			pointerLocked = false;
			clearButtons();
		}
	}
}

export function updateInput() {
	moveVector = vec3.origin();

	moveVector.z -= buttons[Buttons.forward] ? 1 : 0;
	moveVector.z += buttons[Buttons.backward] ? 1 : 0;
	moveVector.x -= buttons[Buttons.moveleft] ? 1 : 0;
	moveVector.x += buttons[Buttons.moveright] ? 1 : 0;
	moveVector.y += buttons[Buttons.moveup] ? 1 : 0;
	moveVector.y -= buttons[Buttons.movedown] ? 1 : 0;

	player.move({
		wishDir: moveVector.rotateYaw(player.yaw).normalised(),
		buttons: buttons
	});
}

function clearButtons() {
	for (let i = 0; i < buttons.length; ++i) {
		buttons[i] = false;
	}
}

const quakeSens = (1 / 16385) * 2 * Math.PI;
function mouseLook(x: number, y: number) {
	if (!pointerLocked)
		return;

	player.yaw -= x * quakeSens * config.sensitivity;
	player.pitch -= y * quakeSens * config.sensitivity;
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
			buttons[Buttons.jump] = true;
			break;
		case "ShiftLeft":
			buttons[Buttons.movedown] = true;
			break;
		case "KeyP":
			pauseGame();
			break;
		case "KeyO":
			advanceGame();
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
			buttons[Buttons.jump] = false;
			break;
		case "ShiftLeft":
			buttons[Buttons.movedown] = false;
			break;
		default:
			console.log(code);
			break;
	}
}