import { WebSocket, WebSocketServer } from "ws";
import { readFileSync } from "fs";
import { ServerPlayer } from "../entities/serverplayer.js";
import { PacketType } from "../../common/network/netenums.js";
import { JoinResponsePacket, PlayerSnapshot, Snapshot, SnapshotPacket, UserCmdPacket } from "../../common/network/packet.js";
import { findSpawn, setLevelServer } from "../entities/level.js";
import { Time, updateTime } from "../../common/system/time.js";
import { Environment, setGameContext } from "../../common/system/context.js";
import { setPlayerModel } from "../../common/player/sharedplayer.js";
import { ServerGltfLoader } from "../mesh/gltfloader.js";
import { updateEntities } from "../../common/entitysystem/update.js";
import { vec3 } from "../../common/math/vector.js";
import { players } from "../../common/system/playerList.js";

export class Server {
	wss!: WebSocketServer;

	playerCount: number = 0;
	maxPlayerCount: number = 32;

	snapshot!: Snapshot;

	public async init() {
		setGameContext(Environment.server);

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
		setLevelServer("./data/levels/bigmap");
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
		for (const player of (players as Map<number, ServerPlayer>).values()) {
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
		const player = new ServerPlayer(id, ws);
		players.set(id, player);

		// find spawns
		const spawn = findSpawn();
		if (!spawn) console.error("FAIELD TO FIND SPAWN!");
		else {
			const pos = spawn.transform.translation;
			player.position = new vec3(pos.x, pos.y, pos.z);
			// player.yaw = spawn.transform.rotation.; todo:
		}

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
		const player = players.get(packet.id) as ServerPlayer;

		if (!player) {
			console.log("ERROR: UserCMD from nonexistant player");
			return;
		}

		if (player.ws != ws) {
			console.log("Identity fraud!");
		}

		if (player.isDead()) {
			return;
		}

		player.lastButtons = player.buttons;
		player.buttons = cmd.buttons;
		player.processCmd(cmd);
		player.lastCmd = packet.number;
	}

	generateSnapshot() {
		let playerSnaps: PlayerSnapshot[] = [];

		for (const player of players.values()) {
			playerSnaps.push({
				id: player.id,
				pitch: player.pitch,
				yaw: player.yaw,
				anim: player.controller.state,
				time: player.controller.time,
				data: player.createPredictedData(),
				health: player.health
			});
		}

		this.snapshot = {
			players: playerSnaps
		}
	}
}