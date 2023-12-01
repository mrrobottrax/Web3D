import { drawLine } from "../../../../src/client/render/render.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { EditorMesh } from "../mesh/editormesh.js";
import { initEditorGl } from "../render/gl.js";
import { WindowManager } from "../render/windowmanager.js";
import { Viewport3D } from "../windows/viewport3d.js";
import { initEditorInput } from "./input.js";

export class Editor {
	meshes: EditorMesh[] = [];
	windowManager: WindowManager;

	constructor() {
		this.windowManager = new WindowManager();
	}

	async init() {
		await initEditorGl();
		initEditorInput();

		this.windowManager.addWindow(new Viewport3D(0, 0, 400, 300));
		this.windowManager.addWindow(new Viewport3D(400, 0, 400, 300));
		this.windowManager.addWindow(new Viewport3D(0, 300, 400, 300));
		this.windowManager.addWindow(new Viewport3D(400, 300, 400, 300));

		drawLine(new vec3(0, 0, 0), new vec3(0, 1, 0), [1, 0, 0, 1], Infinity);
	}

	frame() {
		this.windowManager.renderWindows();
	}
}