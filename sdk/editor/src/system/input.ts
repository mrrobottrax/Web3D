import { glProperties } from "../../../../src/client/render/gl.js";
import { editor } from "../main.js";

export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

export function initEditorInput() {
	document.addEventListener('keydown', event => {
		event.preventDefault();
		keys[event.code] = true;
		editor.windowManager.activeWindow?.key(event.code, true);
	});
	document.addEventListener('keyup', event => {
		event.preventDefault();
		keys[event.code] = false;
		editor.windowManager.activeWindow?.key(event.code, false);
	});

	document.addEventListener("mousedown", event => {
		event.preventDefault();
		editor.windowManager.findWindowUnderMouse();
		editor.windowManager.activeWindow?.mouse(event.button, true);
	});

	document.addEventListener("mouseup", event => {
		event.preventDefault();
		editor.windowManager.activeWindow?.mouse(event.button, false);
	});

	document.addEventListener("mousemove", event => {
		event.preventDefault();
		mousePosX = event.pageX;
		mousePosY = glProperties.height - event.pageY; // match webgl

		editor.windowManager.activeWindow?.mouseMove(event.movementX, event.movementY);
	});

	document.addEventListener("wheel", event => {
		editor.windowManager.activeWindow?.wheel(event.deltaY);
	});

	document.oncontextmenu = event => {
		event.preventDefault();
	}

	document.onpointerlockchange = event => {
		if (document.pointerLockElement) {

		} else {
			editor.windowManager.activeWindow?.mouseUnlock();
		}
	}
}

export function getKeyDown(code: string): boolean {
	return keys[code];
}