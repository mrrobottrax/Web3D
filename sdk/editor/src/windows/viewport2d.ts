import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { rectVao } from "../../../../src/client/render/ui.js";
import gMath from "../../../../src/common/math/gmath.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { quaternion, vec2, vec3 } from "../../../../src/common/math/vector.js";
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

		this.drawBorder();
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
		return this.camera.fov * this.size.y * 0.5;
	}

	override mouseToGrid(): vec2 {
		return this.screenToGrid(this.getRelativeMousePos());
	}

	override screenToGrid(v: vec2): vec2 {
		return v.minus(this.size.times(0.5)).times(1 / this.getPixelsPerUnit()).plus(this.camera.position);
	}

	override mouseRay(): Ray {
		if (!this.pos)
			return { origin: vec3.origin(), direction: vec3.origin() };

		const direction = new vec3(0, 0, -1).rotate(this.camera.rotation);
		const dist = 100000;

		const mouse = this.mouseToGrid();
		const mouse3 = new vec3(mouse.x, mouse.y, 0);
		const origin = new vec3(0, 0, dist).plus(mouse3).rotate(this.camera.rotation);

		return { origin: origin, direction: direction };
	}

	override gridToWorld(v: vec2): vec3 {
		let a = new vec3(v.x, v.y, 0);
		a = a.rotate(this.camera.rotation);

		// Snap
		a.x = Math.round(a.x / editor.gridSize) * editor.gridSize;
		a.y = Math.round(a.y / editor.gridSize) * editor.gridSize;
		a.z = Math.round(a.z / editor.gridSize) * editor.gridSize;

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