import { EditorFace, EditorMesh } from "../mesh/editormesh.js";
import { initSdkGl } from "../../../common/gl.js";
import { SdkWindowManager } from "../../../common/sdkwindowmanager.js";
import { Viewport2D, Viewport2DAngle } from "../windows/viewport2d.js";
import { Viewport3D } from "../windows/viewport3d.js";
import { addHighPriorityShortcuts, addLowPriorityShortcuts, initSdkInput } from "../../../common/sdkinput.js";
import { gl, glEndFrame, resizeCanvas } from "../../../../src/client/render/gl.js";
import { Tool, ToolEnum, getToolButtons as initToolButtons, updateToolButtonVisuals } from "../tools/tool.js";
import { BlockTool } from "../tools/blocktool.js";
import { SelectMode, SelectTool } from "../tools/selecttool.js";
import { EditorFileManagement } from "../file/filemanagement.js";
import { TexturePanel } from "./texturepanel.js";
import { CutTool } from "../tools/cuttool.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { RotateTool } from "../tools/rotate.js";
import { ScaleTool } from "../tools/scale.js";
import { TranslateTool } from "../tools/translate.js";
import { EntityTool } from "../tools/entitytool.js";
import { EntityPanel } from "./entitypanel.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { loadedModels } from "../../../../src/common/mesh/gltfloader.js";
import { initEditorUi } from "./ui.js";

export class Editor {
	meshes: Set<EditorMesh> = new Set();
	entities: Set<any> = new Set();

	activeToolEnum: ToolEnum = ToolEnum.Select;
	activeTool: Tool;

	gridSize: number = 1;
	gridRotation: quaternion = quaternion.identity();
	gridOffset: number = 0;

	windowManager: SdkWindowManager;
	selectTool: SelectTool;
	translateTool: TranslateTool;
	rotateTool: RotateTool;
	scaleTool: ScaleTool;
	entityTool: EntityTool;
	blockTool: BlockTool;
	cutTool: CutTool;

	constructor() {
		this.windowManager = new SdkWindowManager();

		this.selectTool = new SelectTool();
		this.translateTool = new TranslateTool();
		this.rotateTool = new RotateTool();
		this.scaleTool = new ScaleTool();
		this.entityTool = new EntityTool();
		this.blockTool = new BlockTool();
		this.cutTool = new CutTool();

		this.activeTool = this.selectTool;

		EditorFileManagement.getAssetList();
		EditorFileManagement.getEntityList();

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
		await initSdkGl();
		initSdkInput(this.windowManager);
		this.initEditorInput();
		initEditorUi();
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

		await this.translateTool.init();
		await this.rotateTool.init();
	}

	initEditorInput() {
		addLowPriorityShortcuts([{
			keyCodes: ["BracketLeft"],
			function: () => this.decreaseGrid()
		},
		{
			keyCodes: ["BracketRight"],
			function: () => this.increaseGrid()
		},
		{
			keyCodes: ["Digit1"],
			function: () => this.selectTool.setSelectMode(SelectMode.Vertex)
		},
		{
			keyCodes: ["Digit2"],
			function: () => this.selectTool.setSelectMode(SelectMode.Edge)
		},
		{
			keyCodes: ["Digit3"],
			function: () => this.selectTool.setSelectMode(SelectMode.Face)
		},
		{
			keyCodes: ["Digit4"],
			function: () => this.selectTool.setSelectMode(SelectMode.Mesh)
		},
		{
			keyCodes: ["KeyQ"],
			function: () => this.setTool(ToolEnum.Select)
		},
		{
			keyCodes: ["KeyB"],
			function: () => this.setTool(ToolEnum.Block)
		},
		{
			keyCodes: ["KeyC"],
			function: () => this.setTool(ToolEnum.Cut)
		},
		{
			keyCodes: ["KeyE"],
			function: () => this.setTool(ToolEnum.Scale)
		},
		{
			keyCodes: ["KeyR"],
			function: () => this.setTool(ToolEnum.Rotate)
		},
		{
			keyCodes: ["KeyT"],
			function: () => this.setTool(ToolEnum.Translate)
		},
		{
			keyCodes: ["ControlLeft", "KeyA"],
			function: () => { if (this.activeToolEnum == ToolEnum.Select) this.selectTool.selectAll() }
		}]);
		addHighPriorityShortcuts([{
			keyCodes: ["ShiftLeft", "KeyE"],
			function: () => this.setTool(ToolEnum.Entity)
		}]);
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
		loadedModels.clear();
	}

	loadMeshesFromJson(meshes: any) {
		(meshes as any[]).forEach(mesh => {
			const m = EditorMesh.fromJson(mesh);
			if (m)
				this.meshes.add(m);
		});
	}

	async loadEntitiesFromJson(entities: any) {
		for (const entity of entities) {
			const m = await EntityTool.fromJson(entity);
			this.entities.add(m);
		}
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

	snapToGrid2(v: vec3): vec3 {
		const newVec = vec3.copy(v);
		this.snapToGrid(newVec);
		return newVec;
	}

	moveGridToPoint(p: vec3) {
		let dir = new vec3(0, 1, 0);
		dir = dir.rotate(this.gridRotation);

		this.gridOffset = vec3.dot(p, dir);
	}

	castRay(ray: Ray, ignoreBackfaces: boolean = true) {
		let bestMesh: EditorMesh | null = null;
		let bestFace: EditorFace | null = null;
		let bestDist = Infinity;
		let bestPoint = vec3.origin();

		const it = this.meshes.values();
		let i = it.next();
		while (!i.done) {
			const mesh = i.value;

			for (let i = 0; i < mesh.collisionTris.length; ++i) {
				const tri = mesh.collisionTris[i];

				// ignore backfaces
				if (ignoreBackfaces)
					if (vec3.dot(tri.normal, ray.direction) > 0)
						continue;

				let positions = [
					tri.edge1.tail!.position,
					tri.edge2.tail!.position,
					tri.edge3.tail!.position,
				]

				// find where ray and plane intersect
				const denom = vec3.dot(tri.normal, ray.direction);

				if (Math.abs(denom) == 0)
					continue;

				let t = (-vec3.dot(tri.normal, ray.origin) + tri.dist) / denom;
				if (t < 0)
					continue;

				// get plane axis
				const x = positions[1].minus(positions[0]).normalised();
				const y = vec3.cross(tri.normal, x).normalised();

				const point = ray.origin.plus(ray.direction.times(t));
				const pointTrans = new vec3(vec3.dot(x, point), vec3.dot(y, point), 0);

				let insideTri = true;

				// for each edge
				for (let i = 0; i < 3; ++i) {
					// check if point is inside
					const nextPoint = positions[(i + 1) % 3];
					const edgeDir = nextPoint.minus(positions[i]);

					const vertTrans = new vec3(vec3.dot(x, positions[i]), vec3.dot(y, positions[i]), 0);
					const edgeDirTrans = new vec3(vec3.dot(edgeDir, x), vec3.dot(edgeDir, y), 0);

					const edgeLeftTrans = new vec3(-edgeDirTrans.y, edgeDirTrans.x, 0);

					const isInside = vec3.dot(edgeLeftTrans, pointTrans) >= vec3.dot(edgeLeftTrans, vertTrans);
					if (!isInside) {
						insideTri = false;
						break;
					}
				}

				if (insideTri && t < bestDist) {
					bestPoint = point;
					bestDist = t;
					bestMesh = mesh;
					bestFace = tri.edge1.face;
				}
			}

			i = it.next();
		};

		return { mesh: bestMesh, face: bestFace, dist: bestDist, point: bestPoint };
	};
}