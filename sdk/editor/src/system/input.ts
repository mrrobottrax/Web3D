import { editor } from "../main";

export let mousePosX: number;
export let mousePosY: number;

export function initEditorInput() {
	document.addEventListener('keydown', event => {
		editor.windowManager.activeWindow.key(event.code, true);
	});
	document.addEventListener('keyup', event => {
		editor.windowManager.activeWindow.key(event.code, false);
	});

	document.addEventListener("mousedown", event => {
		editor.windowManager.activeWindow.mouse(event.button, true);
	});
	
	document.addEventListener("mouseup", event => {
		editor.windowManager.activeWindow.mouse(event.button, false);
	});

	document.addEventListener("mousemove", event => {
		mousePosX = event.pageX;
		mousePosY = event.pageY;

		editor.windowManager.activeWindow.mouseMove(event.movementX, event.movementY);
	});
}