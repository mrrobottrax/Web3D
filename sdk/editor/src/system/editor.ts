import { currentLevel, setLevelClient } from "../../../../src/client/entities/level.js";
import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { drawHalfEdgeMesh, drawLine } from "../../../../src/client/render/render.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { EditorMesh } from "../mesh/editormesh.js";
import { initEditorGl } from "../render/gl.js";
import { WindowManager } from "../render/windowmanager.js";
import { Viewport2D, Viewport2DAngle } from "../windows/viewport2d.js";
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

		this.windowManager.addWindow(new Viewport3D(0, 450, 600, 450));
		this.windowManager.addWindow(new Viewport2D(600, 450, 600, 450, Viewport2DAngle.Top));
		this.windowManager.addWindow(new Viewport2D(0, 0, 600, 450, Viewport2DAngle.Side));
		this.windowManager.addWindow(new Viewport2D(600, 0, 600, 450, Viewport2DAngle.Front));

		drawLine(new vec3(0, 0, 0), new vec3(0, 1, 0), [1, 0, 0, 1], Infinity);
		await setLevelClient("./data/levels/styletest");
		drawHalfEdgeMesh(currentLevel.collision, [0, 1, 0, 1], Infinity);
	}

	frame() {
		this.windowManager.updateWindows();
	}
}