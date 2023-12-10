import { quakeSens } from "../../../../src/client/player/input.js";
import { Camera } from "../../../../src/client/render/camera.js";
import { gl, glProperties } from "../../../../src/client/render/gl.js";
import { lockCursor, unlockCursor } from "../../../../src/client/system/pointerlock.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { Time } from "../../../../src/common/system/time.js";
import { editorConfig } from "../system/editorconfig.js";
import { getKeyDown } from "../system/input.js";
import { Viewport } from "./viewport.js";

export class Viewport3D extends Viewport {
	pitch: number;
	yaw: number;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number) {
		super(posX, posY, sizeX, sizeY);

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

		if (getKeyDown("Space")) moveVector.y += 1;
		if (getKeyDown("ShiftLeft")) moveVector.y -= 1;

		// moveVector.normalise();

		this.camera.position.add(moveVector.times(Time.deltaTime * editorConfig.moveSpeed));
	}

	draw() {
		if (glProperties.resolutionChanged) {
			this.camera.calcPerspectiveMatrix(this.sizeX, this.sizeY);
		}

		this.camera.updateViewMatrix();

		gl.viewport(this.posX, this.posY, this.sizeX, this.sizeY);
		
		this.drawMeshOutlines(this.camera.perspectiveMatrix, this.camera.viewMatrix)
		this.drawBorder();
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
}