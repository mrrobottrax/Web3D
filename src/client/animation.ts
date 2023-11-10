import { quaternion, vec3 } from "../common/math/vector.js";
import { GameObject } from "../componentsystem/gameobject.js";
import { Time } from "../time.js";

export enum ChannelTarget {
	none,
	translation,
	rotation,
	scale,
	weights
}

export interface Keyframe {
	time: number,
	value: vec3 | quaternion | number;
}

export class AnimationChannel {
	targetChannel: ChannelTarget;
	target: GameObject;
	keyframes: Keyframe[] = [];
	currentKeyframe: number = 0;

	constructor(target: GameObject, path: string) {
		switch (path) {
			case "translation":
				this.targetChannel = ChannelTarget.translation;
				break;
			case "rotation":
				this.targetChannel = ChannelTarget.rotation;
				break;
			case "scale":
				this.targetChannel = ChannelTarget.scale;
				break;
			case "weights":
				this.targetChannel = ChannelTarget.weights;
				break;
			default:
				console.error("Error: Unknown path!");
				this.targetChannel = ChannelTarget.none;
				break
		}

		this.target = target;
	}
}

export class Animation {
	name: string;
	length: number = 0;
	channels: AnimationChannel[] = [];

	constructor(name: string) {
		this.name = name;
	}
}

export class AnimationController {
	currentAnimation: Animation | null = null;
	time: number = 0;

	frame() {
		if (!this.currentAnimation)
			return;

		for (let i = 0; i < this.currentAnimation.channels.length; ++i) {
			const channel = this.currentAnimation.channels[i];
			const keyframes = channel.keyframes;
			let currentKeyframe = keyframes[channel.currentKeyframe];
			let nextKeyframeIndex = (channel.currentKeyframe + 1) % keyframes.length;
			let nextKeyframe = keyframes[nextKeyframeIndex];

			if (this.time >= nextKeyframe.time) {
				channel.currentKeyframe = nextKeyframeIndex;

				nextKeyframeIndex = (channel.currentKeyframe + 1) % keyframes.length;
				currentKeyframe = keyframes[channel.currentKeyframe];
				nextKeyframe = keyframes[nextKeyframeIndex];
			}

			const fract = Math.max((this.time - currentKeyframe.time) / (nextKeyframe.time - currentKeyframe.time), 0);

			switch (channel.targetChannel) {
				case ChannelTarget.translation:
					channel.target.transform.position = vec3.lerp(currentKeyframe.value as vec3, nextKeyframe.value as vec3, fract);
					break;
				case ChannelTarget.rotation:
					// todo: faster, but should learn slerp anyways
					channel.target.transform.rotation = quaternion.lerp(currentKeyframe.value as quaternion, nextKeyframe.value as quaternion, fract);
					break;
				case ChannelTarget.scale:
					channel.target.transform.scale = vec3.lerp(currentKeyframe.value as vec3, nextKeyframe.value as vec3, fract);
					break;
				case ChannelTarget.weights:
					break;
				default:
					break;
			}
		}

		this.time += Time.deltaTime;
		if (this.time > this.currentAnimation.length) {
			this.time -= this.currentAnimation.length;

			for (let i = 0; i < this.currentAnimation.channels.length; ++i) {
				const channel = this.currentAnimation.channels[i];
				channel.currentKeyframe = 0;
			}
		}
	}
}