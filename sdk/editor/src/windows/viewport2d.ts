import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { EditorWindow } from "./window.js";

export enum Viewport2DAngle {
	Top,
	Front,
	Side
}

export class Viewport2D extends EditorWindow {
	camera: Camera;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number, angle: Viewport2DAngle) {
		super(posX, posY, sizeX, sizeY);

		let orientation: quaternion;

		switch (angle) {
			case Viewport2DAngle.Top:
				orientation = quaternion.euler(-90, 0, 0);
				break;
			case Viewport2DAngle.Front:
				orientation = quaternion.euler(0, 0, 0);
				break;
			case Viewport2DAngle.Side:
				orientation = quaternion.euler(0, -90, 0);
				break;
		}

		this.camera = new Camera(0.1, new vec3(5, 5, 5), orientation);
	}

	override draw(): void {
		if (glProperties.resolutionChanged) {
			this.camera.calcOrthographicMatrix(this.sizeX, this.sizeY);
		}

		this.camera.updateViewMatrix();

		gl.viewport(this.posX, this.posY, this.sizeX, this.sizeY);
		renderDebug(this.camera.perspectiveMatrix, this.camera.viewMatrix);
	}
}