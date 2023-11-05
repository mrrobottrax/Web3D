import { WebSocket, WebSocketServer } from "ws";
import { LevelFile } from "../levelfile.js";
import { ServerPlayer } from "./serverplayer.js";
import { vec3 } from "../common/math/vector.js";
import { PacketType } from "../network/netenums.js";
import { JoinResponsePacket, SnapshotPacket, UserCmdPacket } from "../network/packet.js";
import { setLevelServer } from "./level.js";

export class Server {
	wss!: WebSocketServer;

	public currentMap: LevelFile | null = null;
	public players: Map<WebSocket, ServerPlayer> = new Map();

	playerCount: number = 0;
	maxPlayerCount: number = 32;

	public init() {
		this.wss = new WebSocketServer({ port: 80 })
		this.wss.on('connection', ws => {
			ws.on('error', console.error);

			ws.on('message', async data => {
				await new Promise(resolve => setTimeout(resolve, 100));

				const packet = JSON.parse(data.toString());
				switch (packet.type) {
					case PacketType.joinReq:
						this.handleJoin(ws);
						break;
					case PacketType.userCmd:
						this.handleCmd(packet, ws);
						break;
					default:
						break;
				}
			});
		});

		setLevelServer("./data/levels/_testlvl");

		console.log("SERVER OPENED");
	}

	canPlayerJoin(): boolean {
		return this.playerCount < this.maxPlayerCount;
	}

	playerConnect(ws: WebSocket): boolean {
		if (!this.canPlayerJoin)
			return false;

		this.players.set(ws, new ServerPlayer(vec3.origin(), 0, 0));

		return true;
	}

	handleJoin(ws: WebSocket) {
		console.log("Player requesting join.");

		if (!this.playerConnect(ws)) {
			const resPacket: JoinResponsePacket = {
				type: PacketType.joinRes,
				success: false
			}
			ws.send(JSON.stringify(resPacket));

			console.log("Player cannot join");
			return;
		}

		const resPacket: JoinResponsePacket = {
			type: PacketType.joinRes,
			success: true,
			mapname: ""
		}

		ws.send(JSON.stringify(resPacket));
		console.log("Added player");
	}

	handleCmd(packet: UserCmdPacket, ws: WebSocket) {
		const cmd = packet.cmd;
		const player = this.players.get(ws);

		if (!player)
		{
			console.log("ERROR: UserCMD from nonexistant player");
			return;
		}

		player.processCmd(cmd);
		player.lastCmd = packet.number;

		const res: SnapshotPacket = {
			type: PacketType.snapshot,
			lastCmd: player.lastCmd,
			pos: player.position,
		}
		ws.send(JSON.stringify(res));
	}
}
