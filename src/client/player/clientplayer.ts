import { quaternion } from "../../common/math/vector.js";
import { PlayerUtil } from "../../common/player/playerutil.js";
import { SharedPlayer } from "../../common/player/sharedplayer.js";

export class ClientPlayer extends SharedPlayer {
	constructor(id: number) {
		super(id);
	}

	override update(): void {
		this.transform.translation = PlayerUtil.getFeet(this);
		this.transform.rotation = quaternion.eulerRad(0, this.yaw + Math.PI, 0);

		super.update();
	}
}