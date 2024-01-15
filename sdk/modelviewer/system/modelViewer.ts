import { closeModelFile } from "../src/file/modelLoader.js";
import { initModelViewerGl } from "../src/render/gl.js";
import { modelViewerRenderFrame } from "../src/render/render.js";
import { initModelViewerFooter } from "../src/ui/footer.js";
import { initModelViewerHeader } from "../src/ui/header.js";

export class ModelViewer {
	async init() {
		initModelViewerGl();

		initModelViewerHeader();
		initModelViewerFooter();

		closeModelFile();
	}

	frame() {
		modelViewerRenderFrame();
	}
}