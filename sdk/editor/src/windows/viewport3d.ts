import { quakeSens } from "../../../../src/client/player/input.js";
import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { renderDebug } from "../../../../src/client/render/render.js";
import { lockCursor, unlockCursor } from "../../../../src/client/system/pointerlock.js";
import gMath from "../../../../src/common/math/gmath.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { quaternion, vec2, vec3 } from "../../../../src/common/math/vector.js";
import { Time } from "../../../../src/common/system/time.js";
import { editor } from "../main.js";
import { editorConfig } from "../system/editorconfig.js";
import { getKeyDown } from "../system/input.js";
import { Viewport } from "./viewport.js";

export class Viewport3D extends Viewport {
	pitch: number;
	yaw: number;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number) {
		super(posX, posY, sizeX, sizeY);
		this.perspective = true;

		this.camera = new Camera(90, new vec3(0, 5, 5), quaternion.identity());

		this.pitch = 0;
		this.yaw = 0;

		this.looking = false;
	}

	override frame(): void {
		this.moveCamera()

		this.draw();
	}

	moveCamera() {
		if (!this.looking) return;

		let moveVector = vec3.origin();

		if (getKeyDown("KeyA")) moveVector.x -= 1;
		if (getKeyDown("KeyD")) moveVector.x += 1;
		if (getKeyDown("KeyW")) moveVector.z -= 1;
		if (getKeyDown("KeyS")) moveVector.z += 1;

		moveVector = moveVector.rotatePitch(this.pitch);
		moveVector = moveVector.rotateYaw(this.yaw);
		
		moveVector.normalise();

		if (getKeyDown("Space")) moveVector.y += 0.5;
		if (getKeyDown("ShiftLeft")) moveVector.y -= 0.5;


		this.camera.position.add(moveVector.times(Time.deltaTime * editorConfig.moveSpeed));
	}

	draw() {
		this.drawSetup();

		this.drawMeshesSolid();
		this.drawTool();
		renderDebug(this.camera.perspectiveMatrix, this.camera.viewMatrix);

		this.drawBorder();
	}

	drawSetup() {
		if (glProperties.resolutionChanged) {
			this.camera.calcPerspectiveMatrix(this.size.x, this.size.y);
		}

		this.camera.updateViewMatrix();

		gl.viewport(this.pos.x, this.pos.y, this.size.x, this.size.y);
	}

	override mouse(button: number, pressed: boolean): void {
		switch (button) {
			// move
			case 2:
				if (pressed)
					this.startLook();
				else
					this.stopLook();
				break;
		}
	}

	startLook() {
		lockCursor();
		this.looking = true;
	}

	stopLook() {
		unlockCursor();
		this.looking = false;
	}

	mouseMove(dx: number, dy: number): void {
		if (!this.looking) return;

		this.pitch -= dy * editorConfig.sensitivity * quakeSens;
		this.yaw -= dx * editorConfig.sensitivity * quakeSens;

		this.camera.rotation = quaternion.eulerRad(this.pitch, this.yaw, 0);
	}

	override mouseUnlock(): void {
		this.stopLook();
	}

	screenToGrid(v: vec2): vec2 {
		// get ray
		const ray = this.screenRay(this.getRelativeMousePos());

		// find where ray intersects with grid
		// todo: currently only does 0, 0
		const slope = ray.direction.y;

		const t = (editor.gridOffset - ray.origin.y) / slope;

		const point = ray.origin.plus(ray.direction.times(t));

		return new vec2(point.x, point.z);
	}

	gridToWorld(v: vec2): vec3 {
		let a = new vec3(v.x, 0, v.y);

		// Snap
		a.x = Math.round(a.x / editor.gridSize) * editor.gridSize;
		a.y = Math.round(a.y / editor.gridSize) * editor.gridSize;
		a.z = Math.round(a.z / editor.gridSize) * editor.gridSize;

		return a;
	}

	getMask(): vec3 {
		throw new Error("Method not implemented.");
	}

	override screenRay(v: vec2): Ray {
		// size of view frustum at 1 unit dist
		const ySize = Math.tan(gMath.deg2Rad(this.camera.fov / 2)) * 2;
		const xSize = ySize * (this.size.x / this.size.y);

		// number of pixels per unit at 1 unit dist
		const ppuX = this.size.x / xSize;
		const ppuY = this.size.y / ySize;

		let worldScreen = v.minus(this.size.times(0.5));
		worldScreen.x /= ppuX;
		worldScreen.y /= ppuY;

		let vector = new vec3(worldScreen.x, worldScreen.y, -1);
		vector = vector.rotate(this.camera.rotation);
		vector.normalise();

		return { origin: this.camera.position, direction: vector };
	}
}