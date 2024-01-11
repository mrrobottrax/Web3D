import { FileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";

export class EntityPanel {
	static initEntityPanel() {
		const list = document.getElementById("entities-list") as HTMLDataListElement;
		const input = document.getElementById("entities-input") as HTMLInputElement;

		if (!list) {
			console.error("Couldn't find entities list!");
			return;
		}

		FileManagement.engineEntities.forEach((value, key) => {
			list.innerHTML += `<option value="${key}"></option>`
		});

		input.oninput = () => {
			const entity = FileManagement.engineEntities.get(input.value);

			if (entity) {
				editor.entityTool.currentEntityName = input.value;
			} else {
				editor.entityTool.currentEntityName = "player_start";
			}
		}
	}
}