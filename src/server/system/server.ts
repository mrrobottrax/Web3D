import { WebSocket, WebSocketServer } from "ws";
import { readFileSync } from "fs";
import { ServerPlayer } from "../entities/serverplayer.js";
import { PacketType } from "../../common/network/netenums.js";
import { JoinResponsePacket, PlayerSnapshot, Snapshot, SnapshotPacket, UserCmdPacket } from "../../common/network/packet.js";
import { setLevelServer } from "../entities/level.js";
import { Time, updateTime } from "../../common/system/time.js";
import { GameContext, setGameContext } from "../../common/system/context.js";
import { setPlayerModel } from "../../common/player/sharedplayer.js";
import { ServerGltfLoader } from "../mesh/gltfloader.js";
import { updateEntities } from "../../common/entitysystem/update.js";

export class Server {
	wss!: WebSocketServer;

	public players: Map<number, ServerPlayer> = new Map();

	playerCount: number = 0;
	maxPlayerCount: number = 32;

	snapshot!: Snapshot;

	public async init() {
		setGameContext(GameContext.server);

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
		setLevelServer("./data/levels/map");
		setPlayerModel(await ServerGltfLoader.loadGltfFromDisk("./data/models/sci_player"));

		console.log("SERVER OPENED");
	}

	static readFile(path: string): Buffer {
		return readFileSync(path);
	}

	static readFileUtf8(path: string): string {
		return readFileSync(path, 'utf8');
	}

	tick() {
		updateTime();
		updateEntities();

		// send snapshot of world
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
		this.players.set(id, new ServerPlayer(id, ws));

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
				position: player.position,
				pitch: player.pitch,
				yaw: player.yaw,
				anim: player.controller.state,
				time: player.controller.time
			}

			++i;
		}

		this.snapshot = {
			players: players
		}
	}
}