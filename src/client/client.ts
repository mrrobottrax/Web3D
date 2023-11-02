import { PacketType } from "../network/netenums.js";
import { Packet } from "../network/packet.js";

export function initClient() {
	(window as any).connect = connect;
}

let ws: WebSocket;
function connect(url: string) {
	console.log("Connecting to: " + url);

	ws = new WebSocket(url);
	ws.onopen = ev => {
		const reqPacket: Packet = {
			type: PacketType.requestJoin
		}

		ws.send(JSON.stringify(reqPacket));
	}
	ws.onmessage = ev => {
		console.log("RECEIVED: ");
		console.log(ev.data);
	}
}