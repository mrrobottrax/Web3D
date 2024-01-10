import { vec3 } from "../../common/math/vector.js";
import { Client } from "../system/client.js";
import { AudioSource } from "./audiosource.js";

export let audioContext: AudioContext;

const loadedAudioBuffers = new Map<string, AudioBuffer>();
export let gunAudioSource = new AudioSource();
export let hurtSound: AudioBuffer;

async function initAudio() {
	audioContext = new AudioContext();

	const buffer = await loadAudioFromWeb("./data/sounds/pistol.wav");
	gunAudioSource.setBuffer(buffer);
	gunAudioSource.is3D = false;

	hurtSound = await loadAudioFromWeb("./data/sounds/hurt.wav");
}

export function startAudio() {
	if (!audioContext) {
		initAudio();
	}

	if (audioContext.state == "suspended") {
		audioContext.resume()
	}
}

export function stopAudio() {
	audioContext.suspend();
}

export async function loadAudioFromWeb(url: string): Promise<AudioBuffer> {
	if (loadedAudioBuffers.has(url)) {
		return loadedAudioBuffers.get(url)!;
	}

	// send requests
	const req = new XMLHttpRequest();

	const promise = new Promise<XMLHttpRequest>((resolve) => {
		req.addEventListener("load", function () { resolve(this); });
	});

	req.responseType = "arraybuffer";
	req.open("GET", url);
	req.send();

	await promise;

	if (audioContext) {
		const buffer = await audioContext.decodeAudioData(req.response);
		loadedAudioBuffers.set(url, buffer);
		return buffer;
	}

	return new AudioBuffer({
		length: 0,
		sampleRate: 0
	});
}

// pass client because using client.ts causing everything to explode
export function updateAudio(client: Client) {
	if (!audioContext) return;

	audioContext.listener.positionX.value = client.localPlayer.camPosition.x;
	audioContext.listener.positionY.value = client.localPlayer.camPosition.y;
	audioContext.listener.positionZ.value = client.localPlayer.camPosition.z;

	const forward = new vec3(0, 0, -1).rotate(client.localPlayer.camRotation);
	audioContext.listener.forwardX.value = forward.x;
	audioContext.listener.forwardY.value = forward.y;
	audioContext.listener.forwardZ.value = forward.z;

	const up = new vec3(0, 1, 0).rotate(client.localPlayer.camRotation);
	audioContext.listener.upX.value = up.x;
	audioContext.listener.upY.value = up.y;
	audioContext.listener.upZ.value = up.z;
}