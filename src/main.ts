import { Client } from "./client/client.js";
import { initInput, updateInput } from "./client/input.js";
import { setLevel } from "./client/level.js";
import { player } from "./sharedplayer.js";
import { initGl, resizeCanvas } from "./client/render/gl.js";
import { drawFrame, lastCamPos, updateInterp } from "./client/render/render.js";
import { initUi } from "./client/render/ui.js";
import { tickViewmodel } from "./client/render/viewmodel.js";
import { Time, startTicking, updateTime } from "./time.js";

let running: boolean = false;
let client: Client;

main();

function exit(): void {
	running = false;
}

async function main(): Promise<void> {
	await init();

	await setLevel("./data/levels/_testlvl");
	running = true;
	window.requestAnimationFrame(gameLoop);
}

async function init(): Promise<void> {
	client = new Client();
	await initGl();
	initInput();
	initUi();

	startTicking();
}

function gameLoop(): void {
	if (!running)
		return;

	window.requestAnimationFrame(gameLoop);
	updateTime();
	
	if (Time.canTick) {
		lastCamPos.copy(player.camPosition);
		tick();
	}
	updateInterp();
	
	resizeCanvas();
	drawFrame();
}

function tick(): void {
	updateInput();
	tickViewmodel();
}