import { initInput, updateInput } from "./input.js";
import { setLevel } from "./level.js";
import { initGl, resizeCanvas } from "./render/gl.js";
import { drawFrame, drawInit } from "./render/render.js";
import { updateTime } from "./time.js";

let running: boolean = false;

main();

function exit(): void {
	running = false;
}

async function main(): Promise<void> {
	await init();
	await drawInit();

	await setLevel("./data/levels/_wedge");
	running = true;
	window.requestAnimationFrame(gameLoop);
}

async function init(): Promise<void> {
	await initGl();
	initInput();
}

function gameLoop(): void {
	if (!running)
		return;

	window.requestAnimationFrame(gameLoop);
	updateTime();

	// todo: draw last
	resizeCanvas();
	drawFrame();

	updateInput();
}