import { Transform } from "../entitysystem/transform.js";
import { AnimationController, Animation } from "../mesh/animation.js";

export enum PlayerAnimState {
	none,
	idle,
	walk
}

export class PlayerAnimController extends AnimationController {
	state: PlayerAnimState = PlayerAnimState.none;

	idle: Animation;
	walk: Animation;

	constructor(nodeTransforms: Transform[],
		idle: Animation,
		walk: Animation
	) {
		super(nodeTransforms);

		this.idle = idle;
		this.walk = walk;

		this.setAnimation(this.idle);
	}

	override frame() {
		super.frame();
	}
}