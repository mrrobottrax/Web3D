import { EditorMesh } from "../mesh/editormesh.js";
import { renderFrameEditor } from "../render/render.js";

export class Editor {
	meshes: EditorMesh[] = [];

	init() {
		
	}

	frame() {
		renderFrameEditor();
	}
}