import { gl, resizeCanvas } from "../../../../src/client/render/gl.js";
import { mousePosX } from "../system/input.js";
import { EditorWindow } from "../windows/window.js";

export class WindowManager {
	windows: EditorWindow[] = [];
	activeWindow: EditorWindow;
	
	addWindow(window: EditorWindow) {
		this.windows.push(window);
	}
	
	renderWindows() {
		resizeCanvas();
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
		this.windows.forEach(window => {
			window.draw();
		});
	}

	findWindowUnderMouse(): EditorWindow | null {
		this.windows.forEach(element => {
			// if () {

			// }
		});

		return null;
	}
}
