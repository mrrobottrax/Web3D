import { EditorWindow } from "../windows/window";

let windows: EditorWindow[] = [];

export function addWindow(window: EditorWindow) {
	windows.push(window);
}

export function renderFrameEditor() {
	windows.forEach(window => {
		window.draw();
	});
}