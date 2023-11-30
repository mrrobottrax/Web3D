import { updateTime } from "../../../src/common/system/time.js";
import { Editor } from "./system/editor.js";
let running: boolean = false;
export const editor = new Editor();

init();
async function init() {
	running = true;

	await editor.init();

	window.requestAnimationFrame(editorLoop);
}

function editorLoop(): void {
	if (!running)
		return;

	window.requestAnimationFrame(editorLoop);
	updateTime();

	editor.frame();
}