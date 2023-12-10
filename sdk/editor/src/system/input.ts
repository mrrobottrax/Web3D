import { glProperties } from "../../../../src/client/render/gl.js";
import { editor } from "../main.js";

export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

export function initEditorInput() {
	document.addEventListener('keydown', event => {
		event.preventDefault();
		keys[event.code] = true;

		if (!tryShortcut(event.code))
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
		mousePosY = window.innerHeight - event.pageY; // match webgl

		editor.windowManager.activeWindow?.mouseMove(event.movementX, event.movementY);
	});

	document.addEventListener("wheel", event => {
		editor.windowManager.findWindowUnderMouse();
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

	(window as any).selectTool = selectTool;
	(window as any).blockTool = blockTool;
}

export function getKeyDown(code: string): boolean {
	return keys[code];
}

function selectTool() {
	console.log("Select")
}

function blockTool() {
	console.log("Block")
}

interface Shortcut {
	keyCode: string;
	function: Function;
}
let shortcuts: Shortcut[] = [
	{
		keyCode: "BracketLeft",
		function: () => editor.gridSize /= 2
	},
	{
		keyCode: "BracketRight",
		function: () => editor.gridSize *= 2
	},
	{
		keyCode: "KeyQ",
		function: selectTool
	},
	{
		keyCode: "KeyB",
		function: blockTool
	}
];
function tryShortcut(code: string): boolean {
	shortcuts.forEach(shortcut => {
		if (code == shortcut.keyCode) {
			shortcut.function();
		}
	});

	return false;
}