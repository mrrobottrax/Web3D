import { gl, resizeCanvas } from "../../../../src/client/render/gl.js";
import { mousePosX, mousePosY } from "../system/input.js";
import { EditorWindow } from "../windows/window.js";

export class WindowManager {
	windows: EditorWindow[] = [];
	activeWindow: EditorWindow | null;
	
	constructor() {
		this.activeWindow = null;
	}

	addWindow(window: EditorWindow) {
		this.windows.push(window);
	}
	
	updateWindows() {
		resizeCanvas();
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
		this.windows.forEach(window => {
			window.frame();
		});
	}

	findWindowUnderMouse(): void {
		this.windows.forEach(window => {
			if ((mousePosX > window.posX && mousePosX < window.posX + window.sizeX) && (mousePosY > window.posY && mousePosY < window.posY + window.sizeY)) {
				this.activeWindow = window;
				return;
			}
		});
	}
}
