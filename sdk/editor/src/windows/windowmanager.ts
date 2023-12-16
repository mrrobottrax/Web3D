import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { editor } from "../main.js";
import { mousePosX, mousePosY } from "../system/input.js";
import { ToolEnum } from "../tools/tool.js";
import { Viewport } from "./viewport.js";
import { EditorWindow } from "./window.js";

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
		this.windows.forEach(window => {
			if (glProperties.resolutionChanged) {
				window.recalculateSize();
			}

			window.frame();
		});
	}

	setActiveWindowUnderMouse(): void {
		for (const window of this.windows) {
			const pos = window.getRelativeMousePos();
			if ((pos.x > 0 && pos.x < window.size.x) && (pos.y > 0 && pos.y < window.size.y)) {
				this.activeWindow = window;
				return;
			}
		}

		this.activeWindow = null;
		return;
	}
}
