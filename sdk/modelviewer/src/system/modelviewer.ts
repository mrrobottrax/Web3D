import { vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";
import { initSdkInput, setMouseDownFunc, setMouseMoveFunc, setMouseUpFunc } from "../../../editor/src/system/input.js";
import { WindowManager } from "../../../editor/src/windows/windowmanager.js";
import { closeModelFile } from "../file/modelLoader.js";
import { initModelViewerGl } from "../render/gl.js";
import { ModelViewPort } from "../render/modelviewport.js";
import { initModelViewerFooter } from "../ui/footer.js";
import { initModelViewerHeader } from "../ui/header.js";

export class ModelViewer {
	windowManager = new WindowManager();
	viewport = new ModelViewPort(0, 0, 1, 1);

	viewedModel: Model | null = null;

	setModel(model: Model) {
		this.viewedModel = model;
	}

	async init() {
		await initModelViewerGl();

		initSdkInput();
		setMouseDownFunc((event: MouseEvent) => {
			if (!this.windowManager.activeWindow) return;

			event.preventDefault();

			(document.activeElement as HTMLElement).blur();

			this.windowManager.activeWindow?.mouse(event.button, true);
		});
		setMouseUpFunc((event: MouseEvent) => {
			this.windowManager.activeWindow?.mouse(event.button, false);
		});
		setMouseMoveFunc((event: MouseEvent) => {
			this.windowManager.setActiveWindowUnderMouse();
			this.windowManager.activeWindow?.mouseMove(event.movementX, event.movementY);
		});

		initModelViewerHeader();
		initModelViewerFooter();

		closeModelFile();

		this.windowManager.addWindow(this.viewport);
		this.viewport.initCamera();
	}

	frame() {
		this.windowManager.updateWindows();
	}
}