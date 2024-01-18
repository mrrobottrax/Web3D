import { EditorFileManagement } from "../file/filemanagement.js";

export function initEditorUi() {
	// buttons
	// windows menu
	(window as any).exportMap = () => EditorFileManagement.exportMap();
	(window as any).saveMap = () => EditorFileManagement.saveMap();
	(window as any).closeMap = () => EditorFileManagement.closeMap();
	(window as any).loadMap = () => {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = ".level";

		fileInput.addEventListener("input", () => {
			if (fileInput && fileInput.files) {
				EditorFileManagement.loadMap(fileInput.files[0]);
			}
		});

		fileInput.click();
		fileInput.remove();
	};
}