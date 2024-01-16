import { modelViewer } from "../src/main.js";

export let mousePosX: number;
export let mousePosY: number;

let keys: any = {};

export function initModelViewerInput() {
	document.addEventListener("mousedown", event => {
		if (document.activeElement?.tagName != "BODY") return;

		// start pan / orbit
		switch (event.button) {
			case 0:
				// left click
				modelViewer.startOrbit();
				break;
			case 2:
				// right click
				modelViewer.startPan();
				break;
		}
	});

	document.addEventListener("mouseup", event => {
		// stop pan / orbit
		switch (event.button) {
			case 0:
				// left click
				modelViewer.stopOrbit();
				break;
			case 2:
				// right click
				modelViewer.stopPan();
				break;
		}
	});

	document.addEventListener("mousemove", event => {
		const lastX = mousePosX;
		const lastY = mousePosY;

		mousePosX = event.pageX;
		mousePosY = window.innerHeight - event.pageY; // match webgl

		modelViewer.mouseMove(mousePosX - lastX, mousePosY - lastY);
	});

	document.addEventListener("wheel", event => {
		// zoom
	});

	document.oncontextmenu = event => {
		event.preventDefault();
	}

	document.onpointerlockchange = event => {

	}
}

export function getKeyDown(code: string): boolean {
	return keys[code];
}