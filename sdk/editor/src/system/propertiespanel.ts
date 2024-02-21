import { vec3 } from "../../../../src/common/math/vector.js";
import { EditorFileManagement } from "../file/filemanagement.js";
import { editor } from "../main.js";
import { EditorFace, EditorFullEdge, EditorHalfEdge, EditorMesh, EditorVertex } from "../mesh/editormesh.js";
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
			case SelectMode.Vertex:
				this.vertexProperties(properties);
				break;
		}
	}

	static vertexProperties(properties: HTMLElement) {
		const select = editor.selectTool;
		if (select.selectedMeshes.size == 0) return;

		properties.innerHTML += `
		<button class="wide margin" id="print">Print</button>
		<button class="wide margin" id="dist-merge">Grid merge</button>
		<button class="wide margin" id="snap">Snap to grid</button>
		`;

		const print = document.getElementById("print") as HTMLElement;
		print.onclick = () => {
			console.log(editor.selectTool.selectedVertices);
		}

		const distMerge = document.getElementById("dist-merge") as HTMLElement;
		distMerge.onclick = () => {
			select.selectedMeshes.forEach(mesh => {
				let newVerts: EditorVertex[] = [];

				const it = mesh.verts.values();
				let i = it.next();
				let index1 = 0;
				while (!i.done) {
					const vert1 = i.value;

					const it2 = mesh.verts.values();
					let i2 = it2.next();
					let index2 = 0;
					while (!i2.done) {
						if (index2 > index1) {
							// haven't already checked this pair
							const vert2 = i2.value;

							if (vec3.dist(vert1.position, vert2.position) < editor.gridSize) {
								// merge vertices
								const position = vec3.copy(vert1.position);

								const edges = new Set<EditorHalfEdge>();

								vert1.edges.forEach(edge => {
									edges.add(edge);
								});
								vert2.edges.forEach(edge => {
									edges.add(edge);
								});

								const collapseEdge = (edge: EditorHalfEdge) => {
									const full = edge.full!;

									mesh.edges.delete(full);
									edges.delete(edge);
									edges.delete(edge.twin!);

									const a = full.halfA;
									const b = full.halfB;

									const inner = (e: EditorHalfEdge) => {
										mesh.halfEdges.delete(e);
										e.tail?.edges.delete(e);
										if (e.next) {
											e.next.tail = e.tail;
											e.next.prev = e.prev;
											if (e.prev) e.prev.next = e.next;
										}
									}

									if (a) {
										inner(a);
									}

									if (b) {
										inner(b);
									}
								}

								// check if these verts share an edge
								vert1.edges.forEach((edge) => {
									if (edge.next?.tail == vert2) {
										// collapse the shared edge
										collapseEdge(edge);
									}
								});

								// try the other way around too
								vert2.edges.forEach((edge) => {
									if (edge.next?.tail == vert1) {
										collapseEdge(edge);
									}
								});

								const newVert: EditorVertex = {
									position: position,
									edges: edges
								}

								vert1.edges.forEach(edge => {
									edge.tail = newVert;
								});
								vert2.edges.forEach(edge => {
									edge.tail = newVert;
								});

								mesh.verts.delete(vert1);
								mesh.verts.delete(vert2);
								newVerts.push(newVert);

								// check if we've created a new pair of twins
								newVert.edges.forEach(edge1 => {
									const otherVert = edge1.next?.tail;

									if (!otherVert) return;

									otherVert.edges.forEach(edge2 => {
										if (edge2.next?.tail == newVert) {
											if (edge2.twin != edge1 || edge1.twin != edge2) {
												if (edge1.face && edge1.face == edge2.face) {
													// inner
													if (edge1.twin && edge2.twin) {
														mesh.deleteFace(edge1.face);
														mesh.edges.delete(edge2.full!);
														const full = edge1.full!

														edge1.twin.twin = edge2.twin;
														edge2.twin.twin = edge1.twin;

														full.halfA = edge1.twin;
														full.halfB = edge2.twin;

														edge1.twin.full = full;
														edge2.twin.full = full;
													}
												} else if (!edge1.twin && !edge2.twin) {
													// outer
													mesh.edges.delete(edge2.full!);
													const full = edge1.full!

													full.halfA = edge1;
													full.halfB = edge2;

													edge1.twin = edge2;
													edge2.twin = edge1;

													edge1.full = full;
													edge2.full = full;
												}
											}
										}
									});
								});
							}
						}
						i2 = it2.next();
						++index2;
					}

					i = it.next();
					++index1;
				}

				// prevents infinite loop
				newVerts.forEach(vert => {
					mesh.verts.add(vert);
				});

				mesh.updateShape();
			});
		}

		const snap = document.getElementById("snap") as HTMLElement;
		snap.onclick = () => {
			select.selectedMeshes.forEach(mesh => {
				mesh.verts.forEach(vert => {
					editor.snapToGrid(vert.position);
				});

				mesh.updateShape();
			});
		}
	}

	static meshProperties(properties: HTMLElement) {
		const select = editor.selectTool;
		if (select.selectedMeshes.size == 0) return;

		properties.innerHTML += `
		<button class="wide margin" id="print">Print</button>
		<button class="wide margin" id="validate">Validate</button>
		<button class="wide margin" id="combine">Combine meshes</button>
		<button class="wide margin" id="rotate">Rotate 15d</button>
		`;

		const print = document.getElementById("print") as HTMLElement;
		print.onclick = () => {
			console.log(select.selectedMeshes);
		}

		const validate = document.getElementById("validate") as HTMLElement;
		validate.onclick = () => {
			select.selectedMeshes.forEach(mesh => {
				if (mesh.faces.size == 0 || !mesh.validate()) {
					editor.meshes.delete(mesh);
				}
			});
		}

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
					face.mesh = newMesh;
				});
			});

			select.selectedMeshes.clear();
			select.selectedMeshes.add(newMesh);

			editor.meshes.add(newMesh);
			newMesh.updateShape();
		}

		const rotate = document.getElementById("rotate") as HTMLElement;
		rotate.onclick = () => {
			// Get pivot
			let pivot: vec3 = vec3.origin();
			select.selectedMeshes.forEach(mesh => {
				pivot.add(mesh.getOrigin());
			});
			pivot.div(select.selectedMeshes.size);

			// Snap pivot to grid
			editor.snapToGrid(pivot);

			select.selectedMeshes.forEach(mesh => {
				mesh.rotateY(15, pivot);
			});
		}
	}

	static faceProperties(properties: HTMLElement) {
		const select = editor.selectTool;
		if (select.selectedFaces.size == 0) return;

		const face: EditorFace = select.selectedFaces.values().next().value;

		const d2h = (d: number) => {
			var h = (d).toString(16);
			return h.length % 2 ? '0' + h : h;
		}

		const colorHex = "#" + d2h(face.color[0] * 255) + d2h(face.color[1] * 255) + d2h(face.color[2] * 255);
		const faceBright = Math.floor(((face.color[0] + face.color[1] + face.color[2]) / 3) * 255);

		// let textureOptions = "";
		// FileManagement.texturesList.forEach(texture => {
		// 	textureOptions += `<option>${texture}</option>`;
		// });

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