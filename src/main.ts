import { initInput, updateInput } from "./input.js";
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

	updateInput();

	resizeCanvas();
	drawFrame();
}