import { gl, initGl } from "../../src/client/render/gl.js";

let running: boolean = false;

async function init() {
	running = true;

	await initGl();
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

init();