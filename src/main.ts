import { Client } from "./client/client.js";
import { initInput } from "./client/input.js";
import { setLevelClient } from "./client/level.js";
import { initGl } from "./client/render/gl.js";
import { initUi } from "./client/render/ui.js";
import { Time, startTicking, updateTime } from "./time.js";

let running: boolean = false;
let client: Client;

main();

async function main(): Promise<void> {
	await init();

	await setLevelClient("./data/levels/_testlvl");
	running = true;
	window.requestAnimationFrame(gameLoop);
}

async function init(): Promise<void> {
	client = new Client();
	client.init();

	startTicking();
}

function gameLoop(): void {
	if (!running)
		return;

	window.requestAnimationFrame(gameLoop);
	updateTime();
	
	if (Time.canTick) {
		client.tick();
	}
	
	client.frame();
}