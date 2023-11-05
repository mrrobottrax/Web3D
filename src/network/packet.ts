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
	mapname?: string,
}

export interface UserCmdPacket extends Packet {
	number: number,
	cmd: UserCmd
}

export interface SnapshotPacket extends Packet {
	lastCmd: number,
	pos: vec3
}