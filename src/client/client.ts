import { CircularBuffer } from "../common/circularbuffer.js";
import { vec3 } from "../common/math/vector.js";
import { PacketType } from "../network/netenums.js";
import { Packet, SnapshotPacket, UserCmdPacket } from "../network/packet.js";
import { PlayerUtil } from "../playerutil.js";
import { SharedPlayer } from "../sharedplayer.js";
import { Time } from "../time.js";
import { UserCmd } from "../usercmd.js";
import { createUserCMD, initInput } from "./input.js";
import { initGl, resizeCanvas } from "./render/gl.js";
import { drawFrame, drawLine, lastCamPos, updateInterp } from "./render/render.js";
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

	positionBuffer: CircularBuffer<PlayerData>;

	public constructor() {
		this.ws = null;
		(window as any).connect = (url: string) => this.connect(url);
		this.positionBuffer = new CircularBuffer(1 / Time.fixedDeltaTime);
	}

	public async init() {
		this.setup();

		await initGl();
		initUi();
	}

	setup() {
		this.localPlayer = new SharedPlayer(vec3.origin(), 0, 0);
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
					this.isConnected = true;
					this.setup();
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
			cmd: cmd
		}
		this.ws?.send(JSON.stringify(cmdPacket));
		
		// predict player
		this.localPlayer.processCmd(cmd);
		this.positionBuffer.push({
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

		updateInterp(this.localPlayer);
		resizeCanvas();
		drawFrame(this.localPlayer);
	}

	handleSnapshot(snapshot: SnapshotPacket) {
		const offset = this.cmdNumber - snapshot.lastCmd;
		const playerData = this.positionBuffer.rewind(offset);
		
		if (playerData.cmdNumber != snapshot.lastCmd) {
			console.error("Record does not exist!");
			return;
		}

		if (!playerData.position.equals(snapshot.pos)) {
			drawLine(snapshot.pos, snapshot.pos.add(new vec3(0, 2, 0)), [1, 0, 0, 1], 1);
			drawLine(playerData.position, playerData.position.add(new vec3(0, 2, 0)), [1, 0, 0, 1], 1);

			console.error("Prediction Error! " + vec3.dist(snapshot.pos, playerData.position));

			// snap to position and resim all userCmds
			this.localPlayer.position = vec3.copy(snapshot.pos);

			for (let i = offset; i <= 0; --i) {
				this.localPlayer.processCmd(this.positionBuffer.rewind(offset).cmd, true);
				this.positionBuffer.rewind(offset).position = this.localPlayer.position;
			}
		}
	}
}