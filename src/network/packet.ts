import { vec3 } from "../common/math/vector.js";
import { UserCmd } from "../usercmd.js";
import { PacketType } from "./netenums.js";

export interface Packet {
	type: PacketType;
}

export interface JoinRequestPacket extends Packet {
	
}

export interface JoinResponsePacket extends Packet {
	success: boolean,
	playerId?: number,
	mapname?: string,
}

export interface UserCmdPacket extends Packet {
	number: number,
	id: number
	cmd: UserCmd,
}

export interface Snapshot {
	players: PlayerSnapshot[]
}

export interface PlayerSnapshot {
	id: number,
	position: vec3
	pitch: number,
	yaw: number
}

export interface SnapshotPacket extends Packet {
	lastCmd: number,
	snapshot: Snapshot
}