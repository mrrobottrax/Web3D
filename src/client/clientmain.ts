import { Client } from "./system/client.js";
import { setLevelClient } from "./entities/level.js";
import { Time, startTicking, updateTime } from "../common/system/time.js";
import { setPlayerModel } from "../common/player/sharedplayer.js";
import { ClientGltfLoader } from "./mesh/gltfloader.js";
import { updateAudio } from "./audio/audio.js";

export let client: Client;

let running: boolean = false;

main();

async function main(): Promise<void> {
	await init();

	await setLevelClient("./data/levels/bigmap");
	running = true;
	window.requestAnimationFrame(gameLoop);
}

async function init(): Promise<void> {
	client = new Client();
	await client.init();
	setPlayerModel(await ClientGltfLoader.loadGltfFromWeb("./data/models/sci_player"));

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

	// if (currentLevel)
	// 	drawHalfEdgeMesh(currentLevel.collision, [1, 0, 0, 1]);
	client.frame();
}