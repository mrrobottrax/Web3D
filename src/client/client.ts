import { CircularBuffer } from "../common/circularbuffer.js";
import { vec3 } from "../common/math/vector.js";
import { PacketType } from "../network/netenums.js";
import { Packet, PlayerSnapshot, SnapshotPacket, UserCmdPacket } from "../network/packet.js";
import { PlayerUtil } from "../playerutil.js";
import { SharedPlayer } from "../sharedplayer.js";
import { Time } from "../time.js";
import { UserCmd } from "../usercmd.js";
import { createUserCMD, initInput } from "./input.js";
import { initGl, resizeCanvas } from "./render/gl.js";
import { drawFrame, drawLine, initRender, lastCamPos, updateInterp } from "./render/render.js";
import { initUi } from "./render/ui.js";
import { tickViewmodel } from "./render/viewmodel.js";

interface PlayerData {
	position: vec3,
	cmd: UserCmd,
	cmdNumber: number
}

export class Client {
	ws: WebSocket | null;
	isConnected: boolean = false;
	localPlayer!: SharedPlayer;
	cmdNumber: number = 0;

	cmdBuffer: CircularBuffer<PlayerData>;

	otherPlayers!: Map<number, SharedPlayer>;

	public constructor() {
		this.ws = null;
		(window as any).connect = (url: string) => this.connect(url);
		this.cmdBuffer = new CircularBuffer(1 / Time.fixedDeltaTime);
	}

	public async init() {
		await initGl();
		initUi();
		initRender();
	}

	setup(playerId: number) {
		this.localPlayer = new SharedPlayer(playerId);
		this.otherPlayers = new Map();
		this.cmdNumber = 0;
		initInput(this.localPlayer);
	}

	public connect(url: string) {
		console.log("Connecting to: " + url);

		this.ws = new WebSocket(url);

		this.ws.onopen = ev => {
			if (this.ws == null)
				return;

			const reqPacket: Packet = {
				type: PacketType.joinReq
			}

			this.ws.send(JSON.stringify(reqPacket));
		}

		this.ws.onmessage = ev => {
			const data = JSON.parse(ev.data);

			switch (data.type) {
				case PacketType.joinRes:
					console.log("Successfully joined server");
					this.setup(data.playerId);
					this.isConnected = true;
					break;
				case PacketType.snapshot:
					this.handleSnapshot(data);
					break;
				default:
					break;
			}
		}
	}

	public tick(): void {
		if (!this.isConnected)
			return;

		lastCamPos.copy(this.localPlayer.camPosition);

		const cmd = createUserCMD(this.localPlayer);
		const cmdPacket: UserCmdPacket = {
			number: this.cmdNumber,
			type: PacketType.userCmd,
			cmd: cmd,
			id: this.localPlayer.id
		}
		this.ws?.send(JSON.stringify(cmdPacket));

		// predict player
		this.localPlayer.processCmd(cmd);
		this.cmdBuffer.push({
			position: vec3.copy(this.localPlayer.position),
			cmd: cmd,
			cmdNumber: this.cmdNumber
		});

		tickViewmodel(this.localPlayer);
		++this.cmdNumber;
	}

	public frame(): void {
		if (!this.isConnected)
			return;

		updateInterp(this);
		resizeCanvas();
		drawFrame(this);
	}

	handleSnapshot(packet: SnapshotPacket) {
		// udpate players
		for (let i = 0; i < packet.snapshot.players.length; ++i) {
			const playerSnapshot = packet.snapshot.players[i];

			if (playerSnapshot.id == this.localPlayer.id) {
				this.updateLocalPlayer(playerSnapshot, packet);
			} else {
				let player = this.otherPlayers.get(playerSnapshot.id);

				if (!player) {
					player = new SharedPlayer(playerSnapshot.id);
					this.otherPlayers.set(playerSnapshot.id, player);	
				}

				player.position.copy(playerSnapshot.position);
			}
		}
	}

	updateLocalPlayer(playerSnapshot: PlayerSnapshot, snapshot: SnapshotPacket) {
		const offset = this.cmdNumber - snapshot.lastCmd;
		const playerData = this.cmdBuffer.rewind(offset);

		if (!playerData || playerData.cmdNumber != snapshot.lastCmd) {
			console.error("Record does not exist!");
			return;
		}

		if (!playerData.position.equals(playerSnapshot.position)) {
			drawLine(playerSnapshot.position, vec3.copy(playerSnapshot.position).add(new vec3(0, 2, 0)), [0, 0, 1, 1], 1);
			drawLine(playerData.position, playerData.position.add(new vec3(0, 2, 0)), [1, 0, 0, 1], 1);

			console.error("Prediction Error! " + playerData.position.dist(playerData.position));

			// snap to position and resim all userCmds
			this.localPlayer.position = vec3.copy(playerSnapshot.position);

			for (let i = offset; i <= 0; --i) {
				this.localPlayer.processCmd(this.cmdBuffer.rewind(offset).cmd, true);
				this.cmdBuffer.rewind(offset).position = this.localPlayer.position;
			}
		}
	}
}