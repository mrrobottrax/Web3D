import { Camera } from "../../../../src/client/render/camera.js";
import { defaultShader, gl, glEndFrame, glProperties, resizeCanvas } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { EditorWindow } from "../../../editor/src/windows/window.js";
import { modelViewer } from "../main.js";

export class ModelViewPort extends EditorWindow {
	camera: Camera = new Camera(80, new vec3(0, 0, 0), quaternion.identity());

	orbitRotation = vec3.origin();
	panVector = vec3.origin();

	orbiting = false;
	panning = false;

	initCamera() {
		this.camera.calcPerspectiveMatrix(glProperties.width, glProperties.height);
	}

	addOrbitRotation(euler: vec3) {
		this.orbitRotation.add(euler);
	}

	addPan(panDelta: vec3) {
		this.panVector.add(panDelta);
	}

	modelViewerRenderFrame() {
		resizeCanvas();
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this.drawViewedModel();

		glEndFrame();
	}

	drawViewedModel() {
		if (!modelViewer.viewedModel) return;

		this.camera.updateViewMatrix();

		gl.useProgram(defaultShader.program);
		gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, this.camera.perspectiveMatrix.getData());

		modelViewer.viewedModel.nodes.forEach(node => {
			node.primitives.forEach(prim => {
				const mat = this.camera.viewMatrix.copy();
				mat.translate(new vec3(0, 0, -5));
				mat.translate(this.panVector);
				mat.rotateX(-this.orbitRotation.x);
				mat.rotateY(this.orbitRotation.y);
				drawPrimitive(prim, mat, defaultShader);
			});
		});

		gl.useProgram(null);
	}

	frame(): void {
		this.modelViewerRenderFrame();
	}

	override mouse(button: number, pressed: boolean): void {
		switch (button) {
			case 0:
				this.orbiting = pressed;
				break;
			case 2:
				this.panning = pressed;
				break;
		}
	}

	override mouseMove(dx: number, dy: number): void {
		if (this.orbiting) {
			this.addOrbitRotation(new vec3(-dy, dx, 0));
		}
		if (this.panning) {
			this.addPan(new vec3(dx * 0.01, -dy * 0.01, 0));
		}
	}
}