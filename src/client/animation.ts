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
	private currentAnimation: Animation | null = null;
	private time: number = 0;
	private keyframeIndices: number[] = [];

	public setAnimation(anim: Animation) {
		this.keyframeIndices = [];
		this.currentAnimation = anim;

		this.keyframeIndices.length = this.currentAnimation.channels.length;
		for (let i = 0; i < this.keyframeIndices.length; ++i) {
			this.keyframeIndices[i] = 0;
		}
	}

	public frame() {
		if (!this.currentAnimation)
			return;

		for (let i = 0; i < this.currentAnimation.channels.length; ++i) {
			const channel = this.currentAnimation.channels[i];
			const keyframes = channel.keyframes;

			const next = (i: number) => {
				return (i + 1) % keyframes.length;
			}
			
			let nextKeyframeIndex = next(this.keyframeIndices[i]);
			let loops = 0;
			while (keyframes[this.keyframeIndices[i]].time > this.time || keyframes[nextKeyframeIndex].time < this.time) {
				this.keyframeIndices[i] = nextKeyframeIndex;
				nextKeyframeIndex = next(nextKeyframeIndex);

				if (loops++ > keyframes.length) {
					console.error("MAX LOOPS EXCEEDED!");
					break;
				}
			}
			
			const currentKeyframe = keyframes[this.keyframeIndices[i]];
			const nextKeyframe = keyframes[nextKeyframeIndex];
			
			const fract = (this.time - currentKeyframe.time) / (nextKeyframe.time - currentKeyframe.time);

			switch (channel.targetChannel) {
				case ChannelTarget.translation:
					channel.target.transform.position = vec3.lerp(currentKeyframe.value as vec3, nextKeyframe.value as vec3, fract);
					break;
				case ChannelTarget.rotation:
					channel.target.transform.rotation = quaternion.slerp(currentKeyframe.value as quaternion, nextKeyframe.value as quaternion, fract);
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
		}
	}
}