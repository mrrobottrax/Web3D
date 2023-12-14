import { glProperties } from "../../../../src/client/render/gl.js";
import { editor } from "../main.js";
import { ToolEnum, setTool } from "../tools/tool.js";

export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

export function initEditorInput() {
	document.addEventListener('keydown', event => {
		event.preventDefault();
		keys[event.code] = true;

		if (tryShortcut(event.code)) return;
		if (editor.activeTool.key(event.code, true)) return;
		editor.windowManager.activeWindow?.key(event.code, true);
	});
	document.addEventListener('keyup', event => {
		event.preventDefault();
		keys[event.code] = false;

		if (editor.activeTool.key(event.code, false)) return;
		editor.windowManager.activeWindow?.key(event.code, false);
	});

	document.addEventListener("mousedown", event => {
		event.preventDefault();
		editor.windowManager.setActiveWindowUnderMouse();

		if (editor.activeTool.mouse(event.button, true)) return;
		editor.windowManager.activeWindow?.mouse(event.button, true);
	});

	document.addEventListener("mouseup", event => {
		event.preventDefault();

		if (editor.activeTool.mouse(event.button, false)) return;
		editor.windowManager.activeWindow?.mouse(event.button, false);
	});

	document.addEventListener("mousemove", event => {
		event.preventDefault();
		mousePosX = event.pageX;
		mousePosY = window.innerHeight - event.pageY; // match webgl

		if (editor.activeTool.mouseMove(event.movementX, event.movementY)) return;
		editor.windowManager.activeWindow?.mouseMove(event.movementX, event.movementY);
	});

	document.addEventListener("wheel", event => {
		editor.windowManager.setActiveWindowUnderMouse();
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

	(window as any).selectTool = () => setTool(ToolEnum.Select);
	(window as any).blockTool = () => setTool(ToolEnum.Block);
}

export function getKeyDown(code: string): boolean {
	return keys[code];
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
		function: () => setTool(ToolEnum.Select)
	},
	{
		keyCode: "KeyB",
		function: () => setTool(ToolEnum.Block)
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