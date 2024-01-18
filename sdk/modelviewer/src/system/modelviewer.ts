import { Model } from "../../../../src/common/mesh/model.js";
import { initSdkInput} from "../../../common/sdkinput.js";
import { SdkWindowManager } from "../../../common/sdkwindowmanager.js";
import { closeModelFile } from "../file/modelLoader.js";
import { initModelViewerGl } from "../render/gl.js";
import { ModelViewPort } from "../render/modelviewport.js";
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
		await initModelViewerGl();

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