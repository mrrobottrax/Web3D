import { canvas, glProperties } from "../../src/client/render/gl.js";
import { SdkWindow } from "./sdkwindow.js";

export class SdkWindowManager {
	windows: SdkWindow[] = [];
	activeWindow: SdkWindow | null;
	lockActive = false;

	constructor() {
		this.activeWindow = null;
	}

	addWindow(window: SdkWindow) {
		this.windows.push(window);
	}

	updateWindows() {
		this.windows.forEach(window => {
			if (glProperties.resolutionChanged) {
				window.recalculateSize();
			}

			window.frame();

			// could be slow but must be done in foreach for order
			if (window == this.activeWindow) window.drawBorder();
		});
	}

	setActiveWindowUnderMouse(): void {
		if (this.lockActive) return;

		if (document.activeElement != canvas && document.activeElement != document.body) {
			this.activeWindow = null;
			return;
		}

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
