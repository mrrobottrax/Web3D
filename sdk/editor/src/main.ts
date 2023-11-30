import { gl } from "../../../src/client/render/gl.js";
import { updateTime } from "../../../src/common/system/time.js";
import { Editor } from "./system/editor.js";
import { initEditorGl } from "./render/gl.js";

let running: boolean = false;
const editor = new Editor();

init();
async function init() {
	running = true;

	await initEditorGl();
	editor.init();

	window.requestAnimationFrame(editorLoop);
}

function editorLoop(): void {
	if (!running)
		return;

	window.requestAnimationFrame(editorLoop);
	updateTime();

	editor.frame();
}