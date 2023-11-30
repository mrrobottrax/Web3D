import { gl, resizeCanvas } from "../../../../src/client/render/gl.js";
import { EditorWindow } from "../windows/window.js";

let windows: EditorWindow[] = [];

export function addWindow(window: EditorWindow) {
	windows.push(window);
}

export function renderFrameEditor() {
	resizeCanvas();
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	windows.forEach(window => {
		window.draw();
	});
}