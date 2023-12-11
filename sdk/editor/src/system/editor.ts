import { currentLevel, setLevelClient } from "../../../../src/client/entities/level.js";
import { drawHalfEdgeMesh, drawLine } from "../../../../src/client/render/render.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { EditorMesh } from "../mesh/editormesh.js";
import { initEditorGl } from "../render/gl.js";
import { WindowManager } from "../windows/windowmanager.js";
import { Viewport2D, Viewport2DAngle } from "../windows/viewport2d.js";
import { Viewport3D } from "../windows/viewport3d.js";
import { initEditorInput } from "./input.js";
import { glEndFrame, resizeCanvas } from "../../../../src/client/render/gl.js";
import { Tool } from "../tools/tools.js";
import { BlockTool } from "../tools/blocktool.js";

export class Editor {
	meshes: EditorMesh[] = [];
	activeTool: Tool = Tool.Select;
	
	gridSize: number = 1;
	
	windowManager: WindowManager;
	blockTool: BlockTool;

	constructor() {
		this.windowManager = new WindowManager();
		this.blockTool = new BlockTool();
	}

	async init() {
		await initEditorGl();
		initEditorInput();

		const w = 0.5;
		const h = 0.5;

		this.windowManager.addWindow(new Viewport3D(0, h, w, h));
		this.windowManager.addWindow(new Viewport2D(w, h, w, h, Viewport2DAngle.Top));
		this.windowManager.addWindow(new Viewport2D(0, 0, w, h, Viewport2DAngle.Side));
		this.windowManager.addWindow(new Viewport2D(w, 0, w, h, Viewport2DAngle.Front));

		drawLine(new vec3(0, 0, 0), new vec3(0, 1, 0), [1, 0, 0, 1], Infinity);
		await setLevelClient("./data/levels/styletest");
		drawHalfEdgeMesh(currentLevel.collision, [0, 1, 0, 1], Infinity);
	}

	frame() {
		resizeCanvas();

		this.windowManager.updateWindows();
		
		glEndFrame();
	}
}