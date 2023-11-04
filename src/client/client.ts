import { PacketType } from "../network/netenums.js";
import { Packet } from "../network/packet.js";

const localhost: string = "ws://127.0.0.1";

export class Client {
	ws: WebSocket | null;
	isConnected: boolean = false;

	public constructor() {
		this.ws = null;
		(window as any).connect = (url: string) => this.connect(url);
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
					break;
				default:
					break;
			}
		}
	}
}