import { Transform } from "../entitysystem/transform.js";
import { AnimationController, Animation } from "../mesh/animation.js";
import { Environment, environment } from "../system/context.js";
import { SharedPlayer, playerModel } from "./sharedplayer.js";

export enum PlayerAnimState {
	none,
	idle,
	walk
}

export class PlayerAnimController extends AnimationController {
	state: PlayerAnimState = PlayerAnimState.none;
	lastState: PlayerAnimState = PlayerAnimState.none;

	idle: Animation;
	walk: Animation;

	player: SharedPlayer;

	constructor(nodeTransforms: Transform[], player: SharedPlayer,
		idle: Animation,
		walk: Animation
	) {
		super(nodeTransforms, playerModel.hierarchy[0].children[0].index);

		this.player = player;

		this.idle = idle;
		this.walk = walk;
	}

	override frame() {
		// the server creates states
		if (environment != Environment.client) {
			this.calcState();
		}

		if (this.state != this.lastState) {
			this.lastState = this.state;
			this.setAnimFromState();
		}

		super.frame();
	}

	setState(state: PlayerAnimState) {
		this.state = state;
	}

	calcState() {
		if (this.player.velocity.sqrMagnitude() > 10) {
			this.state = PlayerAnimState.walk;
			return;
		}

		this.state = PlayerAnimState.idle;
	}

	setAnimFromState() {
		switch (this.state) {
			case PlayerAnimState.idle:
				this.setAnimation(this.idle);
				return;
			case PlayerAnimState.walk:
				this.setAnimation(this.walk);
				return;
		}
	}
}