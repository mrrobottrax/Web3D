import { FileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";
import { SelectMode } from "../tools/selecttool.js";
import { ToolEnum } from "../tools/tool.js";

export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

export function initEditorInput() {
	document.addEventListener('keydown', event => {
		keys[event.code] = true;

		if (document.activeElement?.tagName != "BODY") return;
		
		if (tryLowShortcuts()) { event.preventDefault(); return; };

		event.preventDefault();

		if (editor.activeTool.key(event.code, true)) return;
		editor.windowManager.activeWindow?.key(event.code, true);
	});
	document.addEventListener('keyup', event => {
		keys[event.code] = false;

		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		if (editor.activeTool.key(event.code, false)) return;
		editor.windowManager.activeWindow?.key(event.code, false);
	});

	document.addEventListener("mousedown", event => {
		if (!editor.windowManager.activeWindow) return;

		event.preventDefault();

		(document.activeElement as HTMLElement).blur();

		if (editor.activeTool.mouse(event.button, true)) return;
		editor.windowManager.activeWindow?.mouse(event.button, true);
	});

	document.addEventListener("mouseup", event => {
		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		if (editor.activeTool.mouse(event.button, false)) return;
		editor.windowManager.activeWindow?.mouse(event.button, false);
	});

	document.addEventListener("mousemove", event => {
		// event.preventDefault();

		mousePosX = event.pageX;
		mousePosY = window.innerHeight - event.pageY; // match webgl

		editor.windowManager.setActiveWindowUnderMouse();
		if (editor.activeTool.mouseMove(event.movementX, event.movementY)) return;
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

	// buttons
	// windows menu
	(window as any).exportMap = () => FileManagement.exportMap();
	(window as any).saveMap = () => FileManagement.saveMap();
	(window as any).closeMap = () => FileManagement.closeMap();
	(window as any).loadMap = () => {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = ".level";

		fileInput.addEventListener("input", () => {
			if (fileInput && fileInput.files) {
				FileManagement.loadMap(fileInput.files[0]);
			}
		});

		fileInput.click();
		fileInput.remove();
	};
}

export function getKeyDown(code: string): boolean {
	return keys[code];
}

interface Shortcut {
	keyCodes: string[];
	function: Function;
}
let lowPriorityShortcuts: Shortcut[] = [
	{
		keyCodes: ["BracketLeft"],
		function: () => editor.gridSize /= 2
	},
	{
		keyCodes: ["BracketRight"],
		function: () => editor.gridSize *= 2
	},
	{
		keyCodes: ["KeyQ"],
		function: () => editor.setTool(ToolEnum.Select)
	},
	{
		keyCodes: ["KeyB"],
		function: () => editor.setTool(ToolEnum.Block)
	},
	{
		keyCodes: ["Digit1"],
		function: () => editor.selectTool.setSelectMode(SelectMode.Vertex)
	},
	{
		keyCodes: ["Digit2"],
		function: () => editor.selectTool.setSelectMode(SelectMode.Edge)
	},
	{
		keyCodes: ["Digit3"],
		function: () => editor.selectTool.setSelectMode(SelectMode.Face)
	},
	{
		keyCodes: ["Digit4"],
		function: () => editor.selectTool.setSelectMode(SelectMode.Mesh)
	},
];
function tryLowShortcuts(): boolean {
	for (let i = 0; i < lowPriorityShortcuts.length; ++i) {
		const shortcut = lowPriorityShortcuts[i];

		// check if all keys in shortcut are down
		let failedShortcut = false;
		for (let i = 0; i < shortcut.keyCodes.length; ++i) {
			const key = shortcut.keyCodes[i];

			if (!keys[key]) {
				failedShortcut = true;
				break;
			}
		}

		if (!failedShortcut) {
			shortcut.function();
		}
	}

	return false;
}