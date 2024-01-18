import { Model } from "../../../../src/common/mesh/model.js";
import { initSdkGl } from "../../../common/gl.js";
import { initSdkInput} from "../../../common/sdkinput.js";
import { SdkWindowManager } from "../../../common/sdkwindowmanager.js";
import { closeModelFile } from "../file/modelLoader.js";
import { ModelViewPort } from "../windows/modelviewport.js";
import { initModelViewerFooter } from "../ui/footer.js";
import { initModelViewerHeader } from "../ui/header.js";

export class ModelViewer {
	windowManager = new SdkWindowManager();
	viewport = new ModelViewPort(0, 0, 1, 1);

	viewedModel: Model | null = null;

	setModel(model: Model) {
		this.viewedModel = model;
	}

	async init() {
		await initSdkGl();

		initSdkInput(this.windowManager);

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