import { initGl } from "./gl.js";
import { loadModelFromWeb } from "./gltfloader.js";
import { drawFrame, drawInit } from "./render.js";
import { updateTime } from "./time.js";

let running: boolean = false;

main();

function exit(): void {
	running = false;
}

async function main(): Promise<void> {
	await init();
	drawInit();

	running = true;
	window.requestAnimationFrame(gameLoop);

	loadModelFromWeb("./data/models/cube.glb");
}

async function init(): Promise<void> {
	await initGl();
}

function gameLoop(): void {
	if (!running)
		return;

	window.requestAnimationFrame(gameLoop);

	updateTime();
	drawFrame();
}