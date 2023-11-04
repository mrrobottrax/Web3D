import { vec3 } from "../math/vector.js";
import { PacketType } from "../network/netenums.js";
import { Packet } from "../network/packet.js";
import { SharedPlayer } from "../sharedplayer.js";
import { createUserCMD, initInput } from "./input.js";
import { initGl, resizeCanvas } from "./render/gl.js";
import { drawFrame, lastCamPos, updateInterp } from "./render/render.js";
import { initUi } from "./render/ui.js";
import { tickViewmodel } from "./render/viewmodel.js";

const localhost: string = "ws://127.0.0.1";

export class Client {
	ws: WebSocket | null;
	isConnected: boolean = false;
	localPlayer!: SharedPlayer;

	public constructor() {
		this.ws = null;
		(window as any).connect = (url: string) => this.connect(url);
	}

	public async init() {
		this.localPlayer = new SharedPlayer(vec3.origin(), 0, 0);
		initInput(this.localPlayer);

		await initGl();
		initUi();
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
					this.localPlayer = new SharedPlayer(vec3.origin(), 0, 0);
					initInput(this.localPlayer);
					break;
				default:
					break;
			}
		}
	}

	public tick(): void {
		if (this.localPlayer == null)
			return;

		lastCamPos.copy(this.localPlayer.camPosition);

		const cmd = createUserCMD(this.localPlayer);
		this.localPlayer.move(cmd);
		
		tickViewmodel(this.localPlayer);
	}

	public frame(): void {
		if (this.localPlayer == null)
			return;

		updateInterp(this.localPlayer);
		resizeCanvas();
		drawFrame(this.localPlayer);
	}
}