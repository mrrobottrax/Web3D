import { canvas } from "../render/gl.js";

export function lockCursor() {
	canvas.requestPointerLock({
		unadjustedMovement: true
	});

	//canvas.requestPointerLock();
}

export function unlockCursor() {
	document.exitPointerLock();
}