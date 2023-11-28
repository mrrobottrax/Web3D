import { initGl } from "../../src/client/render/gl.js";
import { initRender } from "../../src/client/render/render.js";
import { initUi } from "../../src/client/render/ui.js";

let running: boolean = false;

async function init() {
	running = true;

	await initGl();
	initUi();
	initRender();
}

init();