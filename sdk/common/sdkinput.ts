import { SdkWindowManager } from "./sdkwindowmanager";

export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

export function initSdkInput(windowManager: SdkWindowManager) {
	document.addEventListener('keydown', event => {
		keys[event.code] = true;

		if (tryHighShortcuts(event.code)) { event.preventDefault(); return; };

		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		if (tryLowShortcuts(event.code)) return;

		windowManager.activeWindow?.key(event.code, true);
	});
	document.addEventListener('keyup', event => {
		keys[event.code] = false;

		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		windowManager.activeWindow?.key(event.code, false);
	});

	document.addEventListener("mousedown", event => {
		if (!windowManager.activeWindow) return;

		event.preventDefault();

		(document.activeElement as HTMLElement).blur();

		windowManager.activeWindow?.mouse(event.button, true);
	});

	document.addEventListener("mouseup", event => {
		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		windowManager.activeWindow?.mouse(event.button, false);
	});

	document.addEventListener("mousemove", event => {
		// event.preventDefault();

		mousePosX = event.pageX;
		mousePosY = window.innerHeight - event.pageY; // match webgl

		windowManager.setActiveWindowUnderMouse();

		windowManager.activeWindow?.mouseMove(event.movementX, event.movementY);
	});

	document.addEventListener("wheel", event => {
		windowManager.activeWindow?.wheel(event.deltaY);
	});

	document.oncontextmenu = event => {
		event.preventDefault();
	}

	document.onpointerlockchange = () => {
		windowManager.activeWindow?.mouseUnlock();
	}
}

export function getSdkKeyDown(code: string): boolean {
	return keys[code];
}

interface Shortcut {
	keyCodes: string[];
	function: Function;
}
let lowPriorityShortcuts: Shortcut[] = [];
export function addLowPriorityShortcuts(shortcuts: Shortcut[]) {
	lowPriorityShortcuts = lowPriorityShortcuts.concat(shortcuts);
}

let highPriorityShortcuts: Shortcut[] = [];
export function addHighPriorityShortcuts(shortcuts: Shortcut[]) {
	highPriorityShortcuts = highPriorityShortcuts.concat(shortcuts);
}

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