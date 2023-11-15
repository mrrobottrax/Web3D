import { Client } from "./client.js";
import { setLevelClient } from "./level.js";
import { Time, startTicking, updateTime } from "../time.js";
import { setPlayerModel } from "../sharedplayer.js";
import { loadGltfFromWeb } from "./mesh/gltfloader.js";

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
	setPlayerModel(await loadGltfFromWeb("./data/models/sci_player"));

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