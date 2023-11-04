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