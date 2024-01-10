import { Entity } from "../../common/entitysystem/entity.js";
import { audioContext } from "./audio.js";

// can only play 1 sound at once
// sort of faster and is useful when we don't want overlapping sounds
export class AudioSource extends Entity {
	private buffer!: AudioBuffer;
	private source!: AudioBufferSourceNode;

	constructor() {
		super();
	}

	setBuffer(buffer: AudioBuffer) {
		this.buffer = buffer;
	}

	play(interrupt: boolean = false) {
		if (!audioContext) return;
		if (!this.buffer) return;

		if (interrupt) this.stop();

		this.source = audioContext.createBufferSource();
		this.source.buffer = this.buffer;
		this.source.connect(audioContext.destination);
		this.source.start();

		const source = this.source;
		source.onended = () => {
			source.stop();
			source.disconnect();
		}
	}

	stop() {
		if (this.source) {
			this.source.stop();
			this.source.disconnect();
		}
	}

	override onDestroy(): void {
		this.source.disconnect(audioContext.destination);
	}
}