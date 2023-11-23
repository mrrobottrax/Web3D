import { WebSocket } from "ws";
import { SharedPlayer } from "../common/sharedplayer.js";

export class ServerPlayer extends SharedPlayer {
	lastCmd: number = -1;
	ws: WebSocket

	constructor(id: number, ws: WebSocket) {
		super(id);

		this.ws = ws;
	}
}