import { quaternion } from "../../common/math/vector.js";
import { PlayerUtil } from "../../common/player/playerutil.js";
import { SharedPlayer } from "../../common/player/sharedplayer.js";
import { client } from "../clientmain.js";
import { ClientPistol } from "../weapons/clientpistol.js";

export class ClientPlayer extends SharedPlayer {
	constructor(id: number) {
		super(id);

		this.weapon = new ClientPistol();
	}

	override update(): void {
		this.transform.translation = PlayerUtil.getFeet(this);
		this.transform.rotation = quaternion.eulerRad(0, this.yaw + Math.PI, 0);

		super.update();
	}

	getButtons(): boolean[] {
		return client.buttons;
	}

	getLastButtons(): boolean[] {
		return client.lastButtons;
	}
}