import { drawLine } from "../../../../src/client/render/render.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { EditorMesh } from "../mesh/editormesh.js";
import { addWindow, renderFrameEditor } from "../render/render.js";
import { Viewport } from "../windows/viewport.js";

export class Editor {
	meshes: EditorMesh[] = [];

	init() {
		addWindow(new Viewport(0, 0, 800, 600));
		drawLine(new vec3(0, 0, 0), new vec3(0, 1, 0), [1, 0, 0, 1], 100);
	}

	frame() {
		renderFrameEditor();
	}
}