import { initInput, updateInput } from "./input.js";
import { setLevel } from "./level.js";
import { initGl, resizeCanvas } from "./render/gl.js";
import { drawFrame, drawInit, updateInterp } from "./render/render.js";
import { Time, startTicking, updateTime } from "./time.js";

let running: boolean = false;

main();

function exit(): void {
	running = false;
}

async function main(): Promise<void> {
	await init();
	await drawInit();

	await setLevel("./data/levels/_testlvl");
	running = true;
	window.requestAnimationFrame(gameLoop);
}

async function init(): Promise<void> {
	await initGl();
	initInput();

	startTicking();
}

export let pause: boolean = false;
export let advance: boolean = false;

export function pauseGame() {
	pause = !pause;
}

export function advanceGame() {
	advance = true;
}

function gameLoop(): void {
	if (!running)
		return;

	window.requestAnimationFrame(gameLoop);
	updateTime();

	if (!pause || advance) {
		if (Time.canTick) {
			tick();
			advance = false;
		}
	}

	updateInterp();

	// todo: draw last
	resizeCanvas();
	drawFrame();
}

function tick(): void {
	updateInput();
}