export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

let keyDownFunc: Function = () => { };
export function setKeyDownFunc(func: Function) {
	keyDownFunc = func;
}
let keyUpFunc: Function = () => { };
export function setKeyUpFunc(func: Function) {
	keyUpFunc = func;
}

let mouseDownFunc: Function = () => { };
export function setMouseDownFunc(func: Function) {
	mouseDownFunc = func;
}
let mouseUpFunc: Function = () => { };
export function setMouseUpFunc(func: Function) {
	mouseUpFunc = func;
}
let mouseMoveFunc: Function = () => { };
export function setMouseMoveFunc(func: Function) {
	mouseMoveFunc = func;
}
let wheelFunc: Function = () => { };
export function setWheelFunc(func: Function) {
	wheelFunc = func;
}

let pointerLockFunc: Function = () => { };
export function setPointerLockFunc(func: Function) {
	pointerLockFunc = func;
}

export function initSdkInput() {
	document.addEventListener('keydown', event => {
		keys[event.code] = true;

		if (tryHighShortcuts(event.code)) { event.preventDefault(); return; };

		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		if (tryLowShortcuts(event.code)) return;

		keyDownFunc(event);
	});
	document.addEventListener('keyup', event => {
		keys[event.code] = false;

		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		keyUpFunc(event);
	});

	document.addEventListener("mousedown", event => {
		mouseDownFunc(event);
	});

	document.addEventListener("mouseup", event => {
		if (document.activeElement?.tagName != "BODY") return;

		event.preventDefault();

		mouseUpFunc(event);
	});

	document.addEventListener("mousemove", event => {
		// event.preventDefault();

		mousePosX = event.pageX;
		mousePosY = window.innerHeight - event.pageY; // match webgl

		mouseMoveFunc(event);
	});

	document.addEventListener("wheel", event => {
		wheelFunc(event);
	});

	document.oncontextmenu = event => {
		event.preventDefault();
	}

	document.onpointerlockchange = () => {
		pointerLockFunc();
	}
}

export function getKeyDown(code: string): boolean {
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