import { AudioSource } from "../audio/audiosource.js";
import { SharedPlayer } from "../../common/player/sharedplayer.js";
import { quaternion } from "../../common/math/vector.js";
import { PlayerUtil } from "../../common/player/playerutil.js";
import { hurtSound } from "../audio/audio.js";
import { ClientPistol } from "../weapons/clientpistol.js";
import { client } from "../clientmain.js";

export class ClientPlayer extends SharedPlayer {
	soundEntity: AudioSource;

	constructor(id: number) {
		super(id);

		this.weapon = new ClientPistol();
		this.soundEntity = new AudioSource();
		this.soundEntity.parent = this;
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

	override async damageEffect() {
		console.log("TEST");
		this.soundEntity.setBuffer(hurtSound);
		this.soundEntity.play();
	}
}