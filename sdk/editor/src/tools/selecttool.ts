import { gl, solidShader } from "../../../../src/client/render/gl.js";
import { editor } from "../main.js";
import { EditorMesh } from "../mesh/editormesh.js";
import { Viewport } from "../windows/viewport.js";
import { Tool } from "./tool.js";

export enum SelectMode {
	Vertex,
	Edge,
}

export class SelectTool extends Tool {
	mode: SelectMode = SelectMode.Vertex;

	vertexButton: HTMLElement | null;
	edgeButton: HTMLElement | null;

	meshUnderCursor: EditorMesh | null = null;

	constructor() {
		super();
		this.vertexButton = document.getElementById("select-vertex");
		this.edgeButton = document.getElementById("select-edge");

		if (!(this.vertexButton && this.edgeButton)) {
			console.error("MISSING BUTTONS!");
			return;
		}

		this.vertexButton.onclick = () => this.setSelectMode(SelectMode.Vertex);
		this.edgeButton.onclick = () => this.setSelectMode(SelectMode.Edge);

		this.updateModeGraphics();
	}

	setSelectMode(selectMode: SelectMode) {
		this.mode = selectMode;

		this.updateModeGraphics();
	}

	updateModeGraphics() {
		this.vertexButton?.classList.remove("selected-button");
		this.edgeButton?.classList.remove("selected-button");

		switch (this.mode) {
			case SelectMode.Vertex:
				this.vertexButton?.classList.add("selected-button");
				break;
			case SelectMode.Edge:
				this.edgeButton?.classList.add("selected-button");
				break;
		}
	}

	drawSelected(viewport: Viewport) {
		this.meshUnderCursor = editor.meshes.values().next().value;

		if (!this.meshUnderCursor) return;

		const m = this.meshUnderCursor;

		gl.useProgram(solidShader.program);
		gl.uniformMatrix4fv(solidShader.projectionMatrixUnif, false, viewport.camera.perspectiveMatrix.getData());

		gl.bindVertexArray(m.wireFrameData.vao);

		gl.uniform4fv(solidShader.colorUnif, [1, 0, 1, 1]);
		gl.uniformMatrix4fv(solidShader.modelViewMatrixUnif, false, viewport.camera.viewMatrix.getData());

		gl.drawElements(gl.LINES, m.wireFrameData.elementCount, gl.UNSIGNED_SHORT, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);

		gl.bindVertexArray(null);

		gl.useProgram(null);
	}
}