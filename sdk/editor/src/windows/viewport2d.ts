import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { lockCursor, unlockCursor } from "../../../../src/client/system/pointerlock.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { EditorWindow } from "./window.js";

export enum Viewport2DAngle {
	Top,
	Front,
	Side
}

export class Viewport2D extends EditorWindow {
	camera: Camera;

	looking: boolean;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number, angle: Viewport2DAngle) {
		super(posX, posY, sizeX, sizeY);
		this.looking = false;

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

		this.camera = new Camera(0.1, vec3.origin(), orientation);
	}

	override frame(): void {
		this.drawFrame();
	}

	drawFrame() {
		if (glProperties.resolutionChanged) {
			this.camera.calcOrthographicMatrix(this.sizeX, this.sizeY);
		}

		this.camera.updateViewMatrix();

		gl.viewport(this.posX, this.posY, this.sizeX, this.sizeY);
		renderDebug(this.camera.perspectiveMatrix, this.camera.viewMatrix);
	}

	override mouse(button: number, pressed: boolean): void {
		switch (button) {
			// pan
			case 2:
				if (pressed)
					this.startLook();
				else
					this.stopLook();
				break;
		}
	}

	startLook() {
		this.looking = true;
	}
	
	stopLook() {
		this.looking = false;
	}

	mouseMove(dx: number, dy: number): void {
		if (!this.looking) return;

		let add = new vec3(-dx, dy, 0);
		add = add.times(1 / (this.camera.fov * this.sizeY * 0.5));
		add.rotate(this.camera.rotation);

		this.camera.position.add(add);
	}

	override mouseUnlock(): void {
		this.stopLook();
	}
}