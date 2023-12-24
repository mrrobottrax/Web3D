import { FileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";
import { EditorFace, EditorMesh } from "../mesh/editormesh.js";
import { SelectMode } from "../tools/selecttool.js";

export class PropertiesPanel {
	static updateProperties() {
		const properties = document.getElementById("properties-panel");
		if (!properties) { console.error("NO PROPERTIES PANEL!!"); return; }

		properties.innerHTML = "";

		const select = editor.selectTool;
		switch (select.mode) {
			case SelectMode.Face:
				this.faceProperties(properties);
				break;
			case SelectMode.Mesh:
				this.meshProperties(properties);
				break;
		}
	}

	static meshProperties(properties: HTMLElement) {
		const select = editor.selectTool;
		if (select.selectedMeshes.size == 0) return;

		properties.innerHTML += `
		<button class="wide margin" id="combine">Combine meshes</button>
		<button class="wide margin" id="cleanup">Clean up</button>
		`;

		const combine = document.getElementById("combine") as HTMLElement;
		combine.onclick = () => {
			const newMesh = new EditorMesh(new Set(), new Set(), new Set(), new Set());

			select.selectedMeshes.forEach(mesh => {
				editor.meshes.delete(mesh);
				mesh.verts.forEach(vert => {
					newMesh.verts.add(vert);
				});
				mesh.edges.forEach(edge => {
					newMesh.edges.add(edge);
				});
				mesh.halfEdges.forEach(halfEdge => {
					newMesh.halfEdges.add(halfEdge);
				});
				mesh.faces.forEach(face => {
					newMesh.faces.add(face);
				});
			});

			select.selectedMeshes.clear();

			editor.meshes.add(newMesh);
			newMesh.updateShape();
		}
	}

	static faceProperties(properties: HTMLElement) {
		const select = editor.selectTool;
		if (select.selectedFaces.size == 0) return;

		const face: EditorFace = select.selectedFaces.values().next().value;

		const colorHex = "#" + (face.color[0] * 255).toString(16) + (face.color[1] * 255).toString(16) + (face.color[2] * 255).toString(16);
		const faceBright = Math.floor(((face.color[0] + face.color[1] + face.color[2]) / 3) * 255);

		let textureOptions = "";
		FileManagement.texturesList.forEach(texture => {
			textureOptions += `<option>${texture}</option>`;
		});

		properties.innerHTML += `
		<input type="color" id="color-select" value="${colorHex}">
		<input type="number" id="color-brightness" value="${faceBright}" class="small">
		<hr>
		<p>Texture</p>
		<button id="re-align">Re-align</button>
		<div style="display: grid; grid-template-rows: auto auto; grid-template-columns: auto auto auto; font-size: 0.75em;">
			<p>Scale</p>
			<p>Offset</p>
			<p>Rotation</p>
			<input type="number" id="scale-x" value="${face.scale.x}" class="small">
			<input type="number" id="offset-x" value="${face.offset.x}" class="small">
			<input type="number" id="rotation" value="${face.rotation}" class="small">
			<input type="number" id="scale-y" value="${face.scale.y}" class="small">
			<input type="number" id="offset-y" value="${face.offset.y}" class="small">
		</div>
		`;

		const cselect = document.getElementById("color-select") as HTMLInputElement;
		cselect.oninput = () => {
			const r = parseInt(cselect.value.substring(1, 3), 16) / 255;
			const g = parseInt(cselect.value.substring(3, 5), 16) / 255;
			const b = parseInt(cselect.value.substring(5, 7), 16) / 255;

			select.selectedFaces.forEach(face => {
				face.color[0] = r;
				face.color[1] = g;
				face.color[2] = b;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		};
		cselect.onblur = () => {
			this.updateProperties();
		};

		const brightness = document.getElementById("color-brightness") as HTMLInputElement;
		brightness.oninput = () => {
			const v = parseInt(brightness.value) / 255;

			if (isNaN(v))
				return;

			select.selectedFaces.forEach(face => {
				face.color[0] = v;
				face.color[1] = v;
				face.color[2] = v;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		};
		brightness.onblur = () => {
			this.updateProperties();
		};

		const realign = document.getElementById("re-align") as HTMLElement;
		realign.onclick = () => {
			select.selectedFaces.forEach(face => {
				const uv = EditorMesh.getBoxUvForFace(face);
				face.u = uv.u;
				face.v = uv.v;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});

			this.updateProperties();
		}

		const scaleX = document.getElementById("scale-x") as HTMLInputElement;
		scaleX.oninput = () => {
			const x = parseFloat(scaleX.value);

			console.log(x);

			if (isNaN(x))
				return;

			select.selectedFaces.forEach(face => {
				face.scale.x = x;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		};

		const scaleY = document.getElementById("scale-y") as HTMLInputElement;
		scaleY.oninput = () => {
			const x = parseFloat(scaleY.value);

			if (isNaN(x))
				return;

			select.selectedFaces.forEach(face => {
				face.scale.y = x;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		};

		const offsetX = document.getElementById("offset-x") as HTMLInputElement;
		offsetX.oninput = () => {
			const x = parseFloat(offsetX.value);

			if (isNaN(x))
				return;

			select.selectedFaces.forEach(face => {
				face.offset.x = x;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		};

		const offsetY = document.getElementById("offset-y") as HTMLInputElement;
		offsetY.oninput = () => {
			const x = parseFloat(offsetY.value);

			if (isNaN(x))
				return;

			select.selectedFaces.forEach(face => {
				face.offset.y = x;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		};

		const rotation = document.getElementById("rotation") as HTMLInputElement;
		rotation.oninput = () => {
			const x = parseFloat(rotation.value);

			if (isNaN(x))
				return;

			select.selectedFaces.forEach(face => {
				face.rotation = x;
			});

			select.selectedMeshes.forEach(mesh => {
				mesh.updateShape();
			});
		}
	}
}