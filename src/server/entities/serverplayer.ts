import { WebSocket } from "ws";
import { SharedPlayer } from "../../common/player/sharedplayer.js";
import { Buttons } from "../../common/input/buttons.js";
import { Pistol } from "../../common/weapons/pistol.js";

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
}