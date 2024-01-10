import { config } from "../system/config.js";
import { quaternion, vec3 } from "../../common/math/vector.js";
import { lockCursor, unlockCursor } from "../system/pointerlock.js"
import { toggleDraw } from "../render/render.js";
import { advanceGame, pauseGame } from "../../common/system/time.js";
import { Buttons } from "../../common/input/buttons.js";
import { SharedPlayer } from "../../common/player/sharedplayer.js";
import { UserCmd } from "../../common/input/usercmd.js";
import { startAudio } from "../audio/audio.js";
import { client } from "../clientmain.js";

export const quakeSens = (1 / 16384) * 2 * Math.PI;
export class Input {
	moveVector = vec3.origin();
	pointerLocked: boolean = false;

	initInput(player: SharedPlayer) {
		document.addEventListener('keydown', event => {
			event.preventDefault();
			this.key(event.code, true);
		});
		document.addEventListener('keyup', event => {
			event.preventDefault();
			this.key(event.code, false);
		});

		document.addEventListener("mousedown", event => {
			event.preventDefault();
			lockCursor();
			this.mouse(event.button, true);
		});

		document.addEventListener("mouseup", event => {
			event.preventDefault();
			this.mouse(event.button, false);
		});

		document.addEventListener("mousemove", event => {
			this.mouseLook(event.movementX, event.movementY, player)

			startAudio();
		});

		document.onpointerlockchange = event => {
			if (document.pointerLockElement) {
				this.pointerLocked = true;
			} else {
				this.pointerLocked = false;
				this.clearButtons();
			}
		}
	}

	createUserCMD(player: SharedPlayer): UserCmd {
		this.moveVector = vec3.origin();

		this.moveVector.z -= client.buttons[Buttons.forward] ? 1 : 0;
		this.moveVector.z += client.buttons[Buttons.backward] ? 1 : 0;
		this.moveVector.x -= client.buttons[Buttons.moveleft] ? 1 : 0;
		this.moveVector.x += client.buttons[Buttons.moveright] ? 1 : 0;
		this.moveVector.y += client.buttons[Buttons.moveup] ? 1 : 0;
		this.moveVector.y -= client.buttons[Buttons.movedown] ? 1 : 0;

		const cmd: UserCmd = {
			wishDir: this.moveVector.rotateYaw(player.yaw).normalised(),
			buttons: client.buttons.concat(), // copy
			pitch: player.pitch,
			yaw: player.yaw
		}

		return cmd;
	}

	tickButtons() {
		for (let i = 0; i < client.buttons.length; ++i) {
			client.lastButtons[i] = client.buttons[i];
		}
	}

	clearButtons() {
		for (let i = 0; i < client.buttons.length; ++i) {
			client.buttons[i] = false;
		}
	}

	mouse(button: number, down: boolean) {
		switch (button) {
			case 0:
				client.buttons[Buttons.fire1] = down;
				break;
		}
	}

	mouseLook(x: number, y: number, player: SharedPlayer) {
		if (!this.pointerLocked)
			return;

		player.yaw -= x * quakeSens * config.sensitivity;
		player.pitch -= y * quakeSens * config.sensitivity;

		player.yaw %= 2 * Math.PI;
		player.pitch %= 2 * Math.PI;

		player.camRotation = quaternion.eulerRad(player.pitch, player.yaw, 0);
	}

	key(code: string, down: boolean) {
		switch (code) {
			case "Escape":
				if (down)
					unlockCursor();
				break;
			case "KeyW":
				client.buttons[Buttons.forward] = down;
				break;
			case "KeyA":
				client.buttons[Buttons.moveleft] = down;
				break;
			case "KeyS":
				client.buttons[Buttons.backward] = down;
				break;
			case "KeyD":
				client.buttons[Buttons.moveright] = down;
				break;
			case "Space":
				client.buttons[Buttons.jump] = down;
				break;
			case "ShiftLeft":
				client.buttons[Buttons.duck] = down;
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
}
export const input = new Input();