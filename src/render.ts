import { gl } from "./gl.js";

export function drawFrame(): void {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}