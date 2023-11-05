import { WebSocket, WebSocketServer } from "ws";
import { LevelFile } from "../levelfile.js";
import { ServerPlayer } from "./serverplayer.js";
import { vec3 } from "../common/math/vector.js";
import { PacketType } from "../network/netenums.js";
import { JoinResponsePacket, PlayerSnapshot, Snapshot, SnapshotPacket, UserCmdPacket } from "../network/packet.js";
import { setLevelServer } from "./level.js";
import { Time } from "../time.js";

export class Server {
	wss!: WebSocketServer;

	public currentMap: LevelFile | null = null;
	public players: Map<number, ServerPlayer> = new Map();

	playerCount: number = 0;
	maxPlayerCount: number = 32;

	snapshot!: Snapshot;

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

		setInterval(() => { this.tick() }, Time.fixedDeltaTime * 1000);
		setLevelServer("./data/levels/_testlvl");

		console.log("SERVER OPENED");
	}

	tick() {
		this.generateSnapshot();

		for (let player of this.players.values()) {
			const res: SnapshotPacket = {
				type: PacketType.snapshot,
				lastCmd: player.lastCmd,
				snapshot: this.snapshot
			}
			player.ws.send(JSON.stringify(res));
		}
	}

	canPlayerJoin(): boolean {
		return this.playerCount < this.maxPlayerCount;
	}

	// returns player id or null when they cannot connect
	playerConnect(ws: WebSocket): number | null {
		if (!this.canPlayerJoin)
			return null;

		const id = this.generatePlayerId();
		this.players.set(id, new ServerPlayer(vec3.origin(), 0, 0, id, ws));

		return id;
	}

	nextPlayerId = 0;
	generatePlayerId(): number {
		return ++this.nextPlayerId;
	}

	handleJoin(ws: WebSocket) {
		console.log("Player requesting join.");

		const id = this.playerConnect(ws);
		if (id == null) {
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
			playerId: id,
			mapname: ""
		}

		ws.send(JSON.stringify(resPacket));
		console.log("Added player");
	}

	handleCmd(packet: UserCmdPacket, ws: WebSocket) {
		const cmd = packet.cmd;
		const player = this.players.get(packet.id);

		if (!player) {
			console.log("ERROR: UserCMD from nonexistant player");
			return;
		}

		if (player.ws != ws) {
			console.log("Identity fraud!");
		}

		player.processCmd(cmd);
		player.lastCmd = packet.number;
	}

	generateSnapshot() {
		let players: PlayerSnapshot[] = [];
		players.length = this.players.size;

		let i = 0;
		for (let player of this.players.values()) {
			players[i] = {
				id: player.id,
				position: player.position
			}

			++i;
		}

		this.snapshot = {
			players: players
		}
	}
}
