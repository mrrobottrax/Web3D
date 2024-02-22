import { WebSocket } from "ws";
import { SharedPlayer, playerModel } from "../../common/player/sharedplayer.js";
import { Buttons } from "../../common/input/buttons.js";
import { Pistol } from "../../common/weapons/pistol.js";
import { Time } from "../../common/system/time.js";
import { findSpawn } from "./level.js";
import { vec3 } from "../../common/math/vector.js";
import { PlayerUtil } from "../../common/player/playerutil.js";

export class ServerPlayer extends SharedPlayer {
	lastCmd: number = -1;
	ws: WebSocket
	lastButtons = new Array<boolean>(Buttons.MAX_BUTTONS);
	buttons = new Array<boolean>(Buttons.MAX_BUTTONS);

	constructor(id: number, ws: WebSocket) {
		super(id);

		this.ws = ws;
		this.weapon = new Pistol();
	}

	getButtons(): boolean[] {
		return this.buttons;
	}

	getLastButtons(): boolean[] {
		return this.lastButtons;
	}

	override update(): void {
		super.update();

		if (this.respawnTimer > 0) {
			console.log("Respawn in: " + this.respawnTimer);
			this.respawnTimer -= Time.deltaTime;

			if (this.respawnTimer <= 0) {
				this.respawn();
			}
		}
	}

	override die() {
		this.respawnTimer = 5;
	}

	respawn() {
		// find spawns
		const spawn = findSpawn();
		if (!spawn) console.error("FAIELD TO FIND SPAWN!");
		else {
			const pos = spawn.transform.translation;
			PlayerUtil.setFeetPos(this, pos);
			this.health = 100;
			this.pitch = 0;
			this.yaw = spawn.transform.rotation.toEuler().y;
		}
	}
}