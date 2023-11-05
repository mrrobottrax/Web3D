import { SharedPlayer } from "../sharedplayer.js";

export class ServerPlayer extends SharedPlayer {
	lastCmd: number = -1;
}