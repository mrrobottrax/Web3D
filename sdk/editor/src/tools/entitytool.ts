import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { drawLine } from "../../../../src/client/render/render.js";
import { vec3 } from "../../../../src/common/math/vector.js";
import { FileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";
import { entityModels } from "../system/entitymodels.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

export class EntityTool extends Tool {
	entityOrigin: vec3 = vec3.origin();
	currentEntityName: string = "";
	currentEntity: any = null;

	draw(viewport: Viewport) {
		drawLine(this.entityOrigin, this.entityOrigin.plus(new vec3(0, 1, 0)), [0, 1, 0, 1]);
	}

	override mouse(button: number, pressed: boolean): boolean {
		if (!(button == 0 && pressed)) return false;

		const viewport = editor.windowManager.activeWindow as Viewport;
		if (!viewport) return false;

		const pos = viewport.getMouseWorldRounded();

		if (!viewport.perspective) {
			const mask = viewport.getMask();
			this.entityOrigin.x = (1 - mask.x) * pos.x + mask.x * this.entityOrigin.x;
			this.entityOrigin.y = (1 - mask.y) * pos.y + mask.y * this.entityOrigin.y;
			this.entityOrigin.z = (1 - mask.z) * pos.z + mask.z * this.entityOrigin.z;
			this.entityOrigin.x = (1 - mask.x) * pos.x + mask.x * this.entityOrigin.x;
			this.entityOrigin.y = (1 - mask.y) * pos.y + mask.y * this.entityOrigin.y;
			this.entityOrigin.z = (1 - mask.z) * pos.z + mask.z * this.entityOrigin.z;
		} else {
			this.entityOrigin = pos;
		}

		return false
	}

	override key(code: string, pressed: boolean): boolean {
		if (code == "Enter" && pressed) {
			if (!this.currentEntity) return false;

			// add properties from base classes
			let entity: any = {};
			let base = this.currentEntity;
			while (base) {
				const base2 = FileManagement.baseClasses.get(base.base);

				if (base2) {
					base = base2;

					for (const k in base) {
						if (!entity[k])
							entity[k] = base[k];
					}
				}
				else break;
			}

			for (const k in this.currentEntity) {
				entity[k] = this.currentEntity[k];
			}

			entity.keyvalues.origin = this.entityOrigin.x.toString() + " " + this.entityOrigin.y.toString() + " " + this.entityOrigin.z.toString();
			editor.entities.add(entity);

			if (entity.model && !entityModels.has(entity.model)) {
				// load model
				const loadModel = async (model: string) => {
					entityModels.set(model, await ClientGltfLoader.loadGltfFromWeb(model));
				}
				loadModel(entity.model);
			}
		}

		return false;
	}
}