import { WebSocket, WebSocketServer } from 'ws';
import { PacketType } from '../network/netenums.js';
import { Packet } from '../network/packet.js';

const wss = new WebSocketServer({ port: 80 });

wss.on('connection', function connection(ws) {
	ws.on('error', console.error);

	ws.on('message', function message(data) {
		const packet = JSON.parse(data.toString());
		switch (packet.type) {
			case PacketType.requestJoin:
				HandleJoin(ws);
				break;
			default:
				break;
		}
	});
});

console.log("SERVER OPENED");

function HandleJoin(ws: WebSocket) {
	console.log("Player requesting join.");

	ws.send("You want to join!");
}