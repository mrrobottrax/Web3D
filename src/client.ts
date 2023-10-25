export function initClient() {
	(window as any).connect = connect;
}

let ws: WebSocket;
function connect(url: string) {
	console.log("Connecting to: " + url);

	ws = new WebSocket(url);
	ws.onopen = ev => {
		ws.send("TESTPACKET");
	}
}