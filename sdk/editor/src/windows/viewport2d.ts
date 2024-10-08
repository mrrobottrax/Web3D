import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import gMath from "../../../../src/common/math/gmath.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { quaternion, vec2, vec3 } from "../../../../src/common/math/vector.js";
import { editor } from "../main.js";
import { gridShader } from "../../../common/gl.js";
import { mousePosX, mousePosY } from "../../../common/sdkinput.js";
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
		this.perspective = false;

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
		this.drawSetup();

		this.drawFrame();
	}

	drawSetup() {
		if (glProperties.resolutionChanged) {
			this.camera.calcOrthographicMatrix(this.size.x, this.size.y);
		}

		const startPos = vec3.copy(this.camera.position);
		this.camera.position = this.camera.position.rotate(this.camera.rotation);
		this.camera.updateViewMatrix();
		this.camera.position = startPos;

		gl.viewport(this.pos.x, this.pos.y, this.size.x, this.size.y);
	}

	drawFrame() {
		this.drawGrid();

		this.drawMeshesWire();

		this.drawTool();
		renderDebug(this.camera.perspectiveMatrix, this.camera.viewMatrix);
	}

	// grid background
	drawGrid() {
		gl.useProgram(gridShader.program);
		gl.bindVertexArray(rectVao);

		const ppu = this.getPixelsPerUnit();

		gl.uniform3f(gridShader.fillColorUnif, 0.15, 0.15, 0.15);
		gl.uniform3f(gridShader.zeroFillColorUnif, 0.35, 0.15, 0);
		gl.uniform1f(gridShader.gridSizeUnif, ppu * editor.gridSize);
		gl.uniform2f(gridShader.offsetUnif,
			this.camera.position.x * ppu - this.size.x * 0.5 - this.pos.x,
			this.camera.position.y * ppu - this.size.y * 0.5 - this.pos.y
		);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

		gl.bindVertexArray(null);
		gl.useProgram(null);
	}

	override mouse(button: number, pressed: boolean): boolean {
		if (super.mouse(button, pressed)) return true;

		switch (button) {
			// pan
			case 2:
				if (pressed)
					this.startLook();
				else
					this.stopLook();
				break;
		}

		return true;
	}

	override wheel(dy: number): boolean {
		if (super.wheel(dy)) return true;

		const scrollAmt = 1.1;

		const vpMouse = new vec3(mousePosX - glProperties.offsetX - this.pos.x - this.size.x * 0.5, mousePosY - glProperties.offsetY - this.pos.y - this.size.y * 0.5, 0);
		const startWorldMouse = vpMouse.times(1 / this.getPixelsPerUnit()).plus(this.camera.position);

		if (dy > 0) {
			this.camera.fov /= scrollAmt;
		} else {
			this.camera.fov *= scrollAmt;
		}

		this.camera.fov = gMath.clamp(this.camera.fov, 0.001, 20);

		const endWorldMouse = vpMouse.times(1 / this.getPixelsPerUnit()).plus(this.camera.position);

		const delta = startWorldMouse.minus(endWorldMouse);
		this.camera.position.add(delta);

		this.camera.calcOrthographicMatrix(this.size.x, this.size.y);

		return true;
	}

	startLook() {
		this.looking = true;
		editor.windowManager.lockActive = true;
	}

	stopLook() {
		this.looking = false;
		editor.windowManager.lockActive = false;
	}

	mouseMove(dx: number, dy: number): boolean {
		if (super.mouseMove(dx, dy)) return true;
		if (!this.looking) return false;

		let add = new vec3(-dx, dy, 0);
		add = add.times(1 / this.getPixelsPerUnit());
		this.camera.position.add(add);

		return true;
	}

	override mouseUnlock(): void {
		this.stopLook();
	}

	getPixelsPerUnit(): number {
		return this.camera.fov * this.size.y * 0.5;
	}

	override mouseToGrid(): vec2 {
		return this.screenToGrid(this.getRelativeMousePos());
	}

	override screenToGrid(v: vec2): vec2 {
		return v.minus(this.size.times(0.5)).times(1 / this.getPixelsPerUnit()).plus(new vec2(this.camera.position.x, this.camera.position.y));
	}

	override screenRay(screenPos: vec2): Ray {
		if (!this.pos)
			return { origin: vec3.origin(), direction: vec3.origin() };

		const direction = new vec3(0, 0, -1).rotate(this.camera.rotation);
		const dist = 100000;

		let midScreenPos = vec2.copy(screenPos);
		midScreenPos.x -= this.size.x / 2;
		midScreenPos.y -= this.size.y / 2;

		const pos = new vec3(
			midScreenPos.x / this.getPixelsPerUnit() + this.camera.position.x,
			midScreenPos.y / this.getPixelsPerUnit() + this.camera.position.y,
			0
		);
		const origin = new vec3(0, 0, dist).plus(pos).rotate(this.camera.rotation);

		return { origin: origin, direction: direction };
	}

	override cameraRay(): Ray {
		return {
			origin: this.camera.position,
			direction: new vec3(0, 0, -1).rotate(this.camera.rotation)
		};
	}

	override gridToWorld(v: vec2): vec3 {
		let a = new vec3(v.x, v.y, 0);
		a = a.rotate(this.camera.rotation);

		// Snap
		editor.snapToGrid(a);

		return a;
	}

	override getMouseWorldRounded(): vec3 {
		return this.gridToWorld(this.mouseToGrid());
	}

	override getMask(): vec3 {
		let v = new vec3(0, 0, 1).rotate(this.camera.rotation);
		v.abs();
		v.x = Math.round(v.x);
		v.y = Math.round(v.y);
		v.z = Math.round(v.z);
		return v;
	}
}