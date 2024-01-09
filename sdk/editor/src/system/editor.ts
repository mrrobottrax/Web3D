import { EditorMesh } from "../mesh/editormesh.js";
import { initEditorGl } from "../render/gl.js";
import { WindowManager } from "../windows/windowmanager.js";
import { Viewport2D, Viewport2DAngle } from "../windows/viewport2d.js";
import { Viewport3D } from "../windows/viewport3d.js";
import { initEditorInput } from "./input.js";
import { gl, glEndFrame, resizeCanvas } from "../../../../src/client/render/gl.js";
import { Tool, ToolEnum, getToolButtons as initToolButtons, updateToolButtonVisuals } from "../tools/tool.js";
import { BlockTool } from "../tools/blocktool.js";
import { SelectTool } from "../tools/selecttool.js";
import { FileManagement } from "../file/filemanagement.js";
import { TexturePanel } from "./texturepanel.js";
import { CutTool } from "../tools/cuttool.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { RotateTool } from "../tools/rotate.js";
import { ScaleTool } from "../tools/scale.js";
import { TranslateTool } from "../tools/translate.js";
import { EntityTool } from "../tools/entitytool.js";
import { EntityPanel } from "./entitypanel.js";
import { Model } from "../../../../src/common/mesh/model.js";
import { Ray } from "../../../../src/common/math/ray.js";

export class Editor {
	meshes: Set<EditorMesh> = new Set();
	entities: Set<any> = new Set();
	entityModels = new Map<string, Model>();

	activeToolEnum: ToolEnum = ToolEnum.Select;
	activeTool: Tool;

	gridSize: number = 1;
	gridRotation: quaternion = quaternion.identity();
	gridOffset: number = 0;

	windowManager: WindowManager;
	selectTool: SelectTool;
	translateTool: TranslateTool;
	rotateTool: RotateTool;
	scaleTool: ScaleTool;
	entityTool: EntityTool;
	blockTool: BlockTool;
	cutTool: CutTool;

	constructor() {
		this.windowManager = new WindowManager();

		this.selectTool = new SelectTool();
		this.translateTool = new TranslateTool();
		this.rotateTool = new RotateTool();
		this.scaleTool = new ScaleTool();
		this.entityTool = new EntityTool();
		this.blockTool = new BlockTool();
		this.cutTool = new CutTool();

		this.activeTool = this.selectTool;

		FileManagement.getAssetList();
		FileManagement.getEntityList();

		this.updateGridText();
	}

	toJSON() {
		return {
			meshes: Array.from(this.meshes),
			entities: Array.from(this.entities)
		};
	}

	decreaseGrid() {
		this.gridSize /= 2
		this.updateGridText();
	}

	increaseGrid() {
		this.gridSize *= 2
		this.updateGridText();
	}

	updateGridText() {
		const grid = document.getElementById("grid-size");
		if (grid) grid.innerText = `Grid: ${this.gridSize}`;
	}

	async init() {
		await initEditorGl();
		initEditorInput();
		initToolButtons();
		TexturePanel.initTexturePanel();
		EntityPanel.initEntityPanel();

		const w = 0.5;
		const h = 0.5;

		this.windowManager.addWindow(new Viewport3D(0, h, w, h));
		this.windowManager.addWindow(new Viewport2D(w, h, w, h, Viewport2DAngle.Top));
		this.windowManager.addWindow(new Viewport2D(0, 0, w, h, Viewport2DAngle.Side));
		this.windowManager.addWindow(new Viewport2D(w, 0, w, h, Viewport2DAngle.Front));

		// await setLevelClient("./data/levels/styletest");
		// drawHalfEdgeMesh(currentLevel.collision, [0, 1, 0, 1], Infinity);

		this.translateTool.init();
	}

	frame() {
		resizeCanvas();

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this.windowManager.updateWindows();

		this.blockTool.resetDraw();

		glEndFrame();
	}

	close() {
		this.selectTool.close();
		this.translateTool.close();
		this.rotateTool.close();
		this.scaleTool.close();
		this.blockTool.close();
		this.cutTool.close();

		this.unloadMeshes();
		this.unloadEntities();
	}

	unloadMeshes() {
		this.meshes.forEach(mesh => {
			mesh.cleanUpGl();
		});

		this.meshes.clear();
	}

	unloadEntities() {
		this.entities.forEach(entity => {
			this.entityTool.cleanUpGl(entity);
		});

		this.entities.clear();
		this.entityModels.clear();
	}

	loadMeshesFromJson(meshes: any) {
		(meshes as any[]).forEach(mesh => {
			const m = EditorMesh.fromJson(mesh);
			if (m)
				this.meshes.add(m);
		});
	}

	loadEntitiesFromJson(entities: any) {
		(entities as any[]).forEach(entity => {
			const m = EntityTool.fromJson(entity);
			this.entities.add(m);
		});
	}

	setTool(tool: ToolEnum) {
		this.activeToolEnum = tool;

		switch (tool) {
			case ToolEnum.Select:
				this.activeTool = this.selectTool;
				break;
			case ToolEnum.Translate:
				this.activeTool = this.translateTool;
				break;
			case ToolEnum.Rotate:
				this.activeTool = this.rotateTool;
				break;
			case ToolEnum.Scale:
				this.activeTool = this.scaleTool;
				break;
			case ToolEnum.Entity:
				this.activeTool = this.entityTool;
				break;
			case ToolEnum.Block:
				this.activeTool = this.blockTool;
				break;
			case ToolEnum.Cut:
				this.activeTool = this.cutTool;
				break;
		}

		this.activeTool.onSwitch();

		updateToolButtonVisuals();
	}

	snapToGrid(v: vec3): void {
		let r = v.rotate(this.gridRotation);

		r.x = Math.round(r.x / this.gridSize) * this.gridSize;
		r.y = Math.round(r.y / this.gridSize) * this.gridSize;
		r.z = Math.round(r.z / this.gridSize) * this.gridSize;

		r = r.rotate(this.gridRotation.inverse());

		v.x = r.x;
		v.y = r.y;
		v.z = r.z;
	}

	moveGridToPoint(p: vec3) {
		let dir = new vec3(0, 1, 0);
		dir = dir.rotate(this.gridRotation);

		this.gridOffset = vec3.dot(p, dir);
	}

	castRay(ray: Ray): vec3 {
		return new vec3(0, 0, 0);
	}
}