import { AudioSource } from "./audiosource.js";

export let audioContext: AudioContext;

const loadedAudioBuffers = new Map<string, AudioBuffer>();
export let gunAudioSource = new AudioSource();

async function initAudio() {
	audioContext = new AudioContext();
	const buffer = await loadAudioFromWeb("./data/sounds/pistol.wav");
	gunAudioSource.setBuffer(buffer);
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