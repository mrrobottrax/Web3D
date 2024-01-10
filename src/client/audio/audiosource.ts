import { Entity } from "../../common/entitysystem/entity.js";
import { audioContext } from "./audio.js";

export class AudioSource extends Entity {
	private buffer!: AudioBuffer;
	private source!: AudioBufferSourceNode;
	private panner!: PannerNode;
	is3D: boolean = true;

	constructor(buffer?: AudioBuffer) {
		super();

		if (buffer) this.buffer = buffer;
	}

	setBuffer(buffer: AudioBuffer) {
		this.buffer = buffer;
	}

	play() {
		if (!audioContext) return;
		if (!this.buffer) return;

		this.stop();

		this.source = audioContext.createBufferSource();
		this.source.buffer = this.buffer;

		this.panner = audioContext.createPanner();

		if (this.is3D) {
			this.panner.panningModel = "HRTF";
		}
		else {
			this.panner.panningModel = "equalpower";
		}

		this.source.connect(this.panner);
		this.panner.connect(audioContext.destination);

		// destroy self when ended
		// consts prevent using a bad reference
		const source = this.source;
		const panner = this.panner;
		source.onended = () => {
			source.stop();
			source.disconnect();

			panner.disconnect();
		}

		this.source.start();
	}

	override update(): void {
		if (!this.panner) return;
		if (!this.is3D) return;

		const position = this.transform.getWorldPosition();
		const forward = this.transform.getWorldForward();

		console.log(position);
		console.log(this.parent?.transform.translation);

		this.panner.positionX.value = position.x;
		this.panner.positionY.value = position.y;
		this.panner.positionZ.value = position.z;

		this.panner.orientationX.value = forward.x;
		this.panner.orientationY.value = forward.y;
		this.panner.orientationZ.value = forward.z;
	}

	stop() {
		if (this.source) {
			this.source.stop();
			this.source.disconnect();

			this.panner.disconnect();
		}
	}

	override onDestroy(): void {
		this.stop();
	}
}