import { Entity } from "../../common/entitysystem/entity.js";
import { audioContext } from "./audio.js";

export class AudioSource extends Entity {
	private buffer!: AudioBuffer;
	private source!: AudioBufferSourceNode;
	private panner!: PannerNode;
	private gain!: GainNode;
	is3D: boolean = true;
	volume: number = 1;
	panningModel: PanningModelType = "HRTF";
	distanceModel: DistanceModelType = "exponential";
	rolloffFactor: number = 1;
	refDistance: number = 1;
	maxDistance: number = 100;

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

		this.gain = audioContext.createGain();
		this.gain.gain.value = this.volume;
		this.gain.connect(audioContext.destination);

		if (this.is3D) {
			this.panner = audioContext.createPanner();
			this.panner.panningModel = this.panningModel;
			this.panner.distanceModel = this.distanceModel;
			this.panner.rolloffFactor = this.rolloffFactor;
			this.panner.refDistance = this.refDistance;
			this.panner.maxDistance = this.maxDistance;
			this.source.connect(this.panner);
			this.panner.connect(this.gain);
		}
		else {
			this.panner = null!;
			this.source.connect(this.gain);
		}

		// destroy self when ended
		// consts prevent using a bad reference
		const source = this.source;
		const panner = this.panner;
		const gain = this.gain;
		source.onended = () => {
			source.stop();
			source.disconnect();
			gain.disconnect();

			if (panner) {
				panner.disconnect();
			}
		}

		this.source.start();
	}

	override update(): void {
		if (!this.panner) return;
		if (!this.is3D) return;

		const position = this.transform.getWorldPosition();
		const forward = this.transform.getWorldForward();

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
			if (this.source)
				this.source.disconnect();

			if (this.panner)
				this.panner.disconnect();
		}
	}

	override onDestroy(): void {
		this.stop();
	}
}