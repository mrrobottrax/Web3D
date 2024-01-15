import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { drawLine } from "../../../../src/client/render/debugRender.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { loadedModels } from "../../../../src/common/mesh/gltfloader.js";
import { Model } from "../../../../src/common/mesh/model.js";
import { EditorFileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

export class EntityTool extends Tool {
	entityOrigin: vec3 = vec3.origin();
	currentEntityName: string = "";

	draw(viewport: Viewport) {
		drawLine(this.entityOrigin, this.entityOrigin.plus(new vec3(0, 1, 0)), [0, 1, 0, 1]);
	}

	cleanUpGl(entity: any) {
		if (entity.model) {
			const model = loadedModels.get(entity.model);
			if (model) {
				model.cleanUp();
			}
		}
	}

	static async fromJson(fileEntity: any): Promise<any> {
		const entity = EntityTool.getNewEntity(fileEntity.classname);
		entity.keyvalues = fileEntity.keyvalues;
		await EntityTool.loadEntityModel(entity);
		return entity;
	}

	override mouse(button: number, pressed: boolean): boolean {
		if (!(button == 0 && pressed)) return false;

		const viewport = editor.windowManager.activeWindow as Viewport;
		if (!viewport) return false;


		if (!viewport.perspective) {
			const pos = viewport.getMouseWorldRounded();
			const mask = viewport.getMask();
			this.entityOrigin.x = (1 - mask.x) * pos.x + mask.x * this.entityOrigin.x;
			this.entityOrigin.y = (1 - mask.y) * pos.y + mask.y * this.entityOrigin.y;
			this.entityOrigin.z = (1 - mask.z) * pos.z + mask.z * this.entityOrigin.z;
			this.entityOrigin.x = (1 - mask.x) * pos.x + mask.x * this.entityOrigin.x;
			this.entityOrigin.y = (1 - mask.y) * pos.y + mask.y * this.entityOrigin.y;
			this.entityOrigin.z = (1 - mask.z) * pos.z + mask.z * this.entityOrigin.z;
		} else {
			// cast ray
			this.entityOrigin = editor.snapToGrid2(editor.castRay(viewport.mouseRay()).point);
		}

		return false
	}

	static getNewEntity(name: string): any {
		// add properties from base classes
		const entity = EditorFileManagement.engineEntities.get(name);
		let newEntity: any = {};
		let base = entity;
		while (base) {
			const base2 = EditorFileManagement.baseClasses.get(base.base);

			if (base2) {
				base = base2;

				for (const k in base) {
					if (!newEntity[k])
						newEntity[k] = base[k];
				}
			}
			else break;
		}

		for (const k in entity) {
			newEntity[k] = entity[k];
		}

		newEntity.className = name;
		newEntity.keyvalues = JSON.parse(JSON.stringify(newEntity.keyvalues)); // Sharing is NOT caring!

		newEntity.toJSON = () => {
			return {
				classname: newEntity.className,
				keyvalues: newEntity.keyvalues
			}
		}

		return newEntity;
	}

	static async loadEntityModel(entity: any) {
		if (entity.model) {
			await ClientGltfLoader.loadGltfFromWeb(entity.model);
		}
	}

	override key(code: string, pressed: boolean): boolean {
		if (code == "Enter" && pressed) {
			if (!this.currentEntityName) return false;

			const entity = EntityTool.getNewEntity(this.currentEntityName);
			entity.keyvalues.origin = this.entityOrigin.x.toString() + " " + this.entityOrigin.y.toString() + " " + this.entityOrigin.z.toString();

			EntityTool.loadEntityModel(entity);
			editor.entities.add(entity);
			console.log(editor.entities);
		}

		return false;
	}
}