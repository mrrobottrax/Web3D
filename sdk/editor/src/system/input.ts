import { EditorFileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";
import { SelectMode } from "../tools/selecttool.js";
import { ToolEnum } from "../tools/tool.js";

export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

export function initEditorInput() {
	document.addEventListener('keydown', event => {
		keys[event.code] = true;

		if (tryHighShortcuts(event.code)) { event.preventDefault(); return; };

		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		if (tryLowShortcuts(event.code)) return;

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
	(window as any).exportMap = () => EditorFileManagement.exportMap();
	(window as any).saveMap = () => EditorFileManagement.saveMap();
	(window as any).closeMap = () => EditorFileManagement.closeMap();
	(window as any).loadMap = () => {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = ".level";

		fileInput.addEventListener("input", () => {
			if (fileInput && fileInput.files) {
				EditorFileManagement.loadMap(fileInput.files[0]);
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
		function: () => editor.decreaseGrid()
	},
	{
		keyCodes: ["BracketRight"],
		function: () => editor.increaseGrid()
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
	{
		keyCodes: ["KeyQ"],
		function: () => editor.setTool(ToolEnum.Select)
	},
	{
		keyCodes: ["KeyB"],
		function: () => editor.setTool(ToolEnum.Block)
	},
	{
		keyCodes: ["KeyC"],
		function: () => editor.setTool(ToolEnum.Cut)
	},
	{
		keyCodes: ["KeyE"],
		function: () => editor.setTool(ToolEnum.Scale)
	},
	{
		keyCodes: ["KeyR"],
		function: () => editor.setTool(ToolEnum.Rotate)
	},
	{
		keyCodes: ["KeyT"],
		function: () => editor.setTool(ToolEnum.Translate)
	},
	{
		keyCodes: ["ControlLeft", "KeyA"],
		function: () => { if (editor.activeToolEnum == ToolEnum.Select) editor.selectTool.selectAll() }
	},
];

let highPriorityShortcuts: Shortcut[] = [
	{
		keyCodes: ["ShiftLeft", "KeyE"],
		function: () => editor.setTool(ToolEnum.Entity)
	},
]

function tryShortCut(shortcut: Shortcut, code: string) {
	// check if all keys in shortcut are down
	let failedShortcut = false;
	let firstFrame = false; // only do it once
	for (let i = 0; i < shortcut.keyCodes.length; ++i) {
		const key = shortcut.keyCodes[i];
		firstFrame ||= key == code;

		if (!keys[key]) {
			failedShortcut = true;
			break;
		}
	}

	if (!failedShortcut && firstFrame) {
		shortcut.function();
		return true;
	}

	return false;
}

function tryLowShortcuts(code: string): boolean {
	for (let i = 0; i < lowPriorityShortcuts.length; ++i) {
		const shortcut = lowPriorityShortcuts[i];

		if (tryShortCut(shortcut, code)) {
			return true;
		}
	}

	return false;
}

function tryHighShortcuts(code: string): boolean {
	for (let i = 0; i < highPriorityShortcuts.length; ++i) {
		const shortcut = highPriorityShortcuts[i];

		if (tryShortCut(shortcut, code)) {
			return true;
		}
	}

	return false;
}