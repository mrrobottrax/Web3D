import { vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { Viewport } from "../windows/viewport.js";
import { SelectMode } from "./selecttool.js";
import { Tool } from "./tool.js";

export enum GizmoPart {
	None,
	X,
	Y,
	Z
}

export class SelectExtension extends Tool {
	center: vec3 = vec3.origin();

	draw(viewport: Viewport) {
		editor.selectTool.draw(viewport);
	}

	override mouse(button: number, pressed: boolean): boolean {
		const v = editor.selectTool.mouse(button, pressed);

		this.updateSelection();

		return v;
	}

	override mouseMove(dx: number, dy: number): boolean {
		return editor.selectTool.mouseMove(dx, dy);
	}

	override key(code: string, pressed: boolean): boolean {
		return editor.selectTool.key(code, pressed);
	}

	updateSelection(): void {
		this.center = this.calculateCenter();
	}

	calculateCenter(): vec3 {
		switch (editor.selectTool.mode) {
			case SelectMode.Vertex:
				// average all vertex positions
				{
					let position = vec3.origin();
					editor.selectTool.selectedVertices.forEach(vert => {
						position.add(vert.position);
					});

					position.mult(1 / editor.selectTool.selectedVertices.size);

					return position;
				}
			case SelectMode.Edge:
				// average all vertices of each edge
				{
					let position = vec3.origin();
					editor.selectTool.selectedEdges.forEach(edge => {
						if (edge.halfA?.tail) {
							position.add(edge.halfA.tail.position);
							position.add(edge.halfA.next!.tail!.position);
						} else if (edge.halfB?.tail) {
							position.add(edge.halfB.tail.position);
							position.add(edge.halfB.next!.tail!.position);
						}
					});

					// * 2 for both verts of each edge
					position.mult(1 / (editor.selectTool.selectedEdges.size * 2));

					return position;
				}
			case SelectMode.Face:
				// average all vertices of each face
				{
					let position = vec3.origin();
					let count = 0;
					editor.selectTool.selectedFaces.forEach(face => {
						const start = face.halfEdge;
						let edge = start!;
						do {
							position.add(edge.tail!.position);
							++count;

							edge = edge!.next!;
						} while (edge != start)
					});

					position.mult(1 / count);

					return position;
				}
			case SelectMode.Mesh:
				// average all vertices
				{
					let objCount = 0;
					let position = vec3.origin();
					editor.selectTool.selectedMeshes.forEach(mesh => {
						position.add(mesh.getOrigin());
						++objCount;
					});

					editor.selectTool.selectedEntities.forEach(entity => {
						const origin = vec3.parse(entity.keyvalues.origin);
						position.add(origin);
						++objCount;
					});

					position.mult(1 / objCount);

					return position;
				}

			default:
				return vec3.origin();
		}
	}

	onSwitch(): void {
		this.updateSelection();
	}

	shouldDraw(): boolean {
		const select = editor.selectTool;

		switch (select.mode) {
			case SelectMode.Vertex:
				if (select.selectedVertices.size == 0) return false;
				break;
			case SelectMode.Edge:
				if (select.selectedEdges.size == 0) return false;
				break;
			case SelectMode.Face:
				if (select.selectedFaces.size == 0) return false;
				break;
			case SelectMode.Mesh:
				if (select.selectedMeshes.size == 0 && select.selectedEntities.size == 0) return false;
				break;
		}

		return true;
	}
}