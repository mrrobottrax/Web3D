import { WebSocket } from "ws";
import { SharedPlayer } from "../sharedplayer.js";
import { vec3 } from "../common/math/vector.js";

export class ServerPlayer extends SharedPlayer {
	lastCmd: number = -1;
	ws: WebSocket

	constructor(id: number, ws: WebSocket) {
		super(id);

		this.ws = ws;
	}
}