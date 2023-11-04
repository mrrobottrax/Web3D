import { config } from "./config.js";
import { quaternion, vec3 } from "../math/vector.js";
import { castRay } from "../physics.js";
import { lockCursor, unlockCursor } from "./pointerlock.js"
import { drawLine, toggleDraw } from "./render/render.js";
import { advanceGame, pauseGame } from "../time.js";
import { Buttons } from "../buttons.js";
import { SharedPlayer } from "../sharedplayer.js";
import { UserCmd } from "../usercmd.js";

export let moveVector = vec3.origin();
export let pointerLocked: boolean = false;

let lastButtons = new Array<boolean>(Buttons.MAX_BUTTONS);
let buttons = new Array<boolean>(Buttons.MAX_BUTTONS);

export function initInput(player: SharedPlayer) {
	document.addEventListener('keydown', event => {
		key(event.code, true);
	});
	document.addEventListener('keyup', event => {
		key(event.code, false);
	});

	document.addEventListener("mousedown", event => {
		lockCursor();
		mouse(event.button, true);
	});

	document.addEventListener("mouseup", event => {
		mouse(event.button, false);
	});

	document.addEventListener("mousemove", event => {
		mouseLook(event.movementX, event.movementY, player)
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

export function createUserCMD(player: SharedPlayer): UserCmd {
	moveVector = vec3.origin();

	moveVector.z -= buttons[Buttons.forward] ? 1 : 0;
	moveVector.z += buttons[Buttons.backward] ? 1 : 0;
	moveVector.x -= buttons[Buttons.moveleft] ? 1 : 0;
	moveVector.x += buttons[Buttons.moveright] ? 1 : 0;
	moveVector.y += buttons[Buttons.moveup] ? 1 : 0;
	moveVector.y -= buttons[Buttons.movedown] ? 1 : 0;

	if (buttons[Buttons.fire1]) {
		if (!lastButtons[Buttons.fire1]) {
			// fire tracer from player face
			const start = player.camPosition;
			const result = castRay(start, new vec3(0, 0, -1).rotatePitch(player.pitch).rotateYaw(player.yaw).mult(1000));
			drawLine(start, start.add(result.dir.mult(result.dist)), [0, 0, 1, 1], 8);
		}
	}

	const cmd: UserCmd = {
		wishDir: moveVector.rotateYaw(player.yaw).normalised(),
		buttons: buttons,
		pitch: player.pitch,
		yaw: player.yaw
	}
	tickButtons();

	return cmd;
}

function tickButtons() {
	for (let i = 0; i < buttons.length; ++i) {
		lastButtons[i] = buttons[i];
	}
}

function clearButtons() {
	for (let i = 0; i < buttons.length; ++i) {
		buttons[i] = false;
	}
}

function mouse(button: number, down: boolean) {
	switch (button) {
		case 0:
			buttons[Buttons.fire1] = down;
			break;
	}
}

const quakeSens = (1 / 16385) * 2 * Math.PI;
function mouseLook(x: number, y: number, player: SharedPlayer) {
	if (!pointerLocked)
		return;

	player.yaw -= x * quakeSens * config.sensitivity;
	player.pitch -= y * quakeSens * config.sensitivity;
	player.camRotation = quaternion.eulerRad(player.pitch, player.yaw, 0);
}

function key(code: string, down: boolean) {
	switch (code) {
		case "Escape":
			if (down)
				unlockCursor();
			break;
		case "KeyW":
			buttons[Buttons.forward] = down;
			break;
		case "KeyA":
			buttons[Buttons.moveleft] = down;
			break;
		case "KeyS":
			buttons[Buttons.backward] = down;
			break;
		case "KeyD":
			buttons[Buttons.moveright] = down;
			break;
		case "Space":
			buttons[Buttons.jump] = down;
			break;
		case "ShiftLeft":
			buttons[Buttons.duck] = down;
			break;
		case "KeyP":
			if (down)
				pauseGame();
			break;
		case "KeyO":
			if (down)
				advanceGame();
			break;
		case "KeyR":
			if (down)
				toggleDraw();
			break;
		default:
			console.log(code);
			break;
	}
}