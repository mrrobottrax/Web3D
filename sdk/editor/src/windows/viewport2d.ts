import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { gridShader } from "../render/gl.js";
import { mousePosX, mousePosY } from "../system/input.js";
import { Viewport } from "./viewport.js";

export enum Viewport2DAngle {
	Top,
	Front,
	Side
}

export class Viewport2D extends Viewport {
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

		this.camera = new Camera(0.05, vec3.origin(), orientation);
	}

	override frame(): void {
		this.drawFrame();
	}

	drawFrame() {
		if (glProperties.resolutionChanged) {
			this.camera.calcOrthographicMatrix(this.sizeX, this.sizeY);
		}

		const startPos = vec3.copy(this.camera.position);
		this.camera.position.rotate(this.camera.rotation);
		this.camera.updateViewMatrix();
		this.camera.position = startPos;

		gl.viewport(this.posX, this.posY, this.sizeX, this.sizeY);

		// grid background
		gl.useProgram(gridShader.program);
		gl.bindVertexArray(rectVao);

		const ppu = this.getPixelsPerUnit();

		gl.uniform3f(gridShader.fillColorUnif, 0.15, 0.15, 0.15);
		gl.uniform1f(gridShader.gridSizeUnif, ppu * editor.gridSize);
		gl.uniform2f(gridShader.offsetUnif,
			this.camera.position.x * ppu - this.sizeX * 0.5 - this.posX,
			this.camera.position.y * ppu - this.sizeY * 0.5 - this.posY
		);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

		gl.bindVertexArray(null);
		gl.useProgram(null);

		this.drawMeshOutlines(this.camera.perspectiveMatrix, this.camera.viewMatrix);
		this.drawBorder();
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

	override wheel(dy: number): void {
		const scrollAmt = 0.02;

		const vpMouse = new vec3(mousePosX - glProperties.offsetX - this.posX - this.sizeX * 0.5, mousePosY - glProperties.offsetY - this.posY - this.sizeY * 0.5, 0);
		const startWorldMouse = vpMouse.times(1 / this.getPixelsPerUnit()).plus(this.camera.position);
		
		if (dy > 0) {
			this.camera.fov *= 1 / dy / scrollAmt;
		} else {
			this.camera.fov *= -dy * scrollAmt;
		}

		const endWorldMouse = vpMouse.times(1 / this.getPixelsPerUnit()).plus(this.camera.position);

		const delta = startWorldMouse.minus(endWorldMouse);
		this.camera.position.add(delta);

		this.camera.calcOrthographicMatrix(this.sizeX, this.sizeY);
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
		add = add.times(1 / this.getPixelsPerUnit());
		this.camera.position.add(add);
	}

	override mouseUnlock(): void {
		this.stopLook();
	}

	getPixelsPerUnit(): number {
		return this.camera.fov * this.sizeY * 0.5;
	}
}