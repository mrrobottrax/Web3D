let audioContext: AudioContext;

export function startAudio() {
	if (!audioContext) {
		audioContext = new AudioContext();
		loadAudioFromWeb("./data/sounds/_celerydemo.wav");
	}

	if (audioContext.state === "suspended") {
		audioContext.resume()
	}
}

export function stopAudio() {
	audioContext.suspend();
}

export async function loadAudioFromWeb(url: string) {
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
		const source = audioContext.createBufferSource();
		source.buffer = buffer;
		source.connect(audioContext.destination);
		source.start();
	}
}