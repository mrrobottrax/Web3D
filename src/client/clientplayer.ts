import { quaternion } from "../common/math/vector.js";
import { PlayerUtil } from "../playerutil.js";
import { SharedPlayer, playerModel } from "../sharedplayer.js";
import { Model } from "./mesh/model.js";

export class ClientPlayer extends SharedPlayer {
	model: Model;

	constructor(id: number) {
		super(id);

		this.model = playerModel;
	}

	override update(): void {
		this.transform.translation = PlayerUtil.getFeet(this);
		this.transform.rotation = quaternion.eulerRad(0, this.yaw + Math.PI, 0);
	}
}