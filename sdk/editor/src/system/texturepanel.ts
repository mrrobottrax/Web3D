import { EditorFileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";
import { SelectMode } from "../tools/selecttool.js";

export class TexturePanel {
	static activeTexture: string = "data/levels/textures/dev.png";

	static texturePreview: HTMLImageElement;
	static texturePreviewName: HTMLInputElement;
	static textureList: HTMLElement;

	static initTexturePanel() {
		this.texturePreview = document.getElementById("texture-preview") as HTMLImageElement;
		this.texturePreviewName = document.getElementById("texture-preview-name") as HTMLInputElement;
		this.textureList = document.getElementById("texture-list")!;

		const textureApply = document.getElementById("texture-apply");
		if (textureApply) textureApply.onclick = () => this.applyActiveTexture();

		this.texturePreview.src = this.activeTexture;

		EditorFileManagement.texturesList.forEach(texture => {
			const div = document.createElement("div");
			div.style.cssText = "overflow: hidden; width: 128px; height: 175px; padding: 5px; word-wrap: break-word;";
			div.classList.add("button");
			div.classList.add("subtle-button");
			div.innerHTML = `<img src="${texture}" style="align-self: center; width: 128px; height: 128px">
	<p style="font-size: 0.5em;">${texture}</p>`;

			div.onclick = () => {
				this.setActiveTexture(texture);
			};

			this.textureList.appendChild(div);
		});
	}

	static setActiveTexture(texture: string) {
		this.activeTexture = texture;
		this.texturePreview.src = this.activeTexture;
		this.texturePreviewName.value = this.activeTexture;

		this.applyActiveTexture();
	}

	static applyActiveTexture() {
		if (editor.selectTool.mode = SelectMode.Face) {
			editor.selectTool.selectedFaces.forEach(face => {
				face.texture = this.activeTexture;
			});

			editor.selectTool.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		}
	}
}