import { vec3 } from "../../../src/common/math/vector.js";
import { closeModelFile } from "../src/file/modelLoader.js";
import { initModelViewerGl } from "../src/render/gl.js";
import { modelViewerRenderFrame, addOrbitRotation, addPan } from "../src/render/render.js";
import { initModelViewerFooter } from "../src/ui/footer.js";
import { initModelViewerHeader } from "../src/ui/header.js";
import { initModelViewerInput } from "./input.js";

export class ModelViewer {
	async init() {
		await initModelViewerGl();

		initModelViewerInput();

		initModelViewerHeader();
		initModelViewerFooter();

		closeModelFile();
	}

	frame() {
		modelViewerRenderFrame();
	}

	mouseMove(xDelta: number, yDelta: number) {
		if (this.orbiting) {
			addOrbitRotation(new vec3(yDelta, xDelta, 0));
		}

		if (this.panning) {
			addPan(new vec3(xDelta * 0.01, yDelta * 0.01, 0));
		}
	}

	panning: boolean = false;
	startPan() {
		this.panning = true;
	}

	stopPan() {
		this.panning = false;
	}

	orbiting: boolean = false;
	startOrbit() {
		this.orbiting = true;
	}

	stopOrbit() {
		this.orbiting = false;
	}
}