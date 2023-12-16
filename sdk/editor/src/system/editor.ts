import { EditorMesh } from "../mesh/editormesh.js";
import { initEditorGl } from "../render/gl.js";
import { WindowManager } from "../windows/windowmanager.js";
import { Viewport2D, Viewport2DAngle } from "../windows/viewport2d.js";
import { Viewport3D } from "../windows/viewport3d.js";
import { initEditorInput } from "./input.js";
import { gl, glEndFrame, resizeCanvas } from "../../../../src/client/render/gl.js";
import { Tool, ToolEnum, getToolButtons as initToolButtons } from "../tools/tool.js";
import { BlockTool } from "../tools/blocktool.js";
import { SelectTool } from "../tools/selecttool.js";

export class Editor {
	meshes: Set<EditorMesh> = new Set();
	activeToolEnum: ToolEnum = ToolEnum.Select;
	activeTool: Tool;

	gridSize: number = 1;

	windowManager: WindowManager;
	selectTool: SelectTool;
	blockTool: BlockTool;

	constructor() {
		this.windowManager = new WindowManager();

		this.selectTool = new SelectTool();
		this.blockTool = new BlockTool();

		this.activeTool = this.selectTool;;
	}

	toJSON() {
		return { meshes: Array.from(this.meshes) };
	}

	async init() {
		await initEditorGl();
		initEditorInput();
		initToolButtons();

		const w = 0.5;
		const h = 0.5;

		this.windowManager.addWindow(new Viewport3D(0, h, w, h));
		this.windowManager.addWindow(new Viewport2D(w, h, w, h, Viewport2DAngle.Top));
		this.windowManager.addWindow(new Viewport2D(0, 0, w, h, Viewport2DAngle.Side));
		this.windowManager.addWindow(new Viewport2D(w, 0, w, h, Viewport2DAngle.Front));

		// await setLevelClient("./data/levels/styletest");
		// drawHalfEdgeMesh(currentLevel.collision, [0, 1, 0, 1], Infinity);
	}

	frame() {
		resizeCanvas();

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this.windowManager.updateWindows();

		this.blockTool.resetDraw();

		glEndFrame();
	}

	unloadMeshes() {
		this.meshes.forEach(mesh => {
			mesh.cleanUpGl();
		});

		this.meshes.clear();
	}

	loadMeshesFromJson(meshes: any) {
		this.unloadMeshes();

		(meshes as any[]).forEach(mesh => {
			this.meshes.add(EditorMesh.fromJson(mesh));
		});
	}
}