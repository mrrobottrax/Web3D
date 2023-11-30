import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties, solidShader } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { EditorWindow } from "./window.js";

export class Viewport extends EditorWindow {
	camera: Camera;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number) {
		super(posX, posY, sizeX, sizeY);

		this.camera = new Camera(90, new vec3(0, 0, 5), quaternion.identity());
	}

	override draw(): void {
		if (glProperties.resolutionChanged)
			this.camera.calcPerspectiveMatrix(this.sizeX, this.sizeY);

		this.camera.updateViewMatrix();

		gl.viewport(this.posX, this.posY, this.sizeX, this.sizeY);
		renderDebug(this.camera.perspectiveMatrix, this.camera.viewMatrix);
	}
}