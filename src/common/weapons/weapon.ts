import { fireViewmodel } from "../../client/render/viewmodel.js";
import { vec3 } from "../math/vector.js";
import { SharedPlayer } from "../player/sharedplayer.js";
import { Environment, environment } from "../system/context.js";
import { castRay } from "../system/physics.js";

export abstract class Weapon {
	fire(player: SharedPlayer) {
		const start = player.camPosition;
		const dir = new vec3(0, 0, -1).rotatePitch(player.pitch).rotateYaw(player.yaw);
		const result = castRay(start, dir.times(1000), true, player);

		if (result.entity instanceof SharedPlayer) {
			result.entity.damage(20);
		}

		if (environment == Environment.client) {
			this.clientSideEffects();
		}
	}

	clientSideEffects() {
		fireViewmodel();
	}
}