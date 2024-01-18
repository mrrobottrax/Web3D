import { updateTime } from "../../../src/common/system/time.js";
import { ModelViewer } from "./system/modelviewer.js";

export const modelViewer = new ModelViewer();

init()
async function init() {
	await modelViewer.init();

	window.requestAnimationFrame(modelViewerLoop);
}

function modelViewerLoop(): void {
	window.requestAnimationFrame(modelViewerLoop);
	updateTime();

	modelViewer.frame();
}