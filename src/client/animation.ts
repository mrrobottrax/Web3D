import { quaternion, vec3 } from "../common/math/vector";
import { ModelBase } from "./mesh/model";

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
	target: ModelBase;
	keyframes: Keyframe[] = [];
	currentKeyframe: number = 0;

	constructor (target: ModelBase, channel: ChannelTarget) {
		this.targetChannel = channel;
		this.target = target;
	}
}

export class Animation {
	length: number = 0;
	channels: AnimationChannel[] = [];
}

export class AnimationController {
	currentAnimation: Animation | null = null;

	time: number = 0;
}