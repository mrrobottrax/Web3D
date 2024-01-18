import { gl, glProperties } from "../../src/client/render/gl.js";
import { rectVao } from "../../src/client/render/ui.js";
import { vec2 } from "../../src/common/math/vector.js";
import { borderShader } from "./gl.js";
import { mousePosX, mousePosY } from "./sdkinput.js";

export abstract class SdkWindow {
	pos: vec2;
	size: vec2

	ratioPos: vec2;
	ratioSize: vec2;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number) {
		this.ratioPos = new vec2(posX, posY);
		this.ratioSize = new vec2(sizeX, sizeY);

		this.pos = vec2.origin();
		this.size = vec2.origin();
		this.recalculateSize();
	}

	abstract frame(): void;

	recalculateSize(): void {
		this.pos.x = glProperties.width * this.ratioPos.x;
		this.pos.y = glProperties.height * this.ratioPos.y;

		this.size.x = glProperties.width * this.ratioSize.x;
		this.size.y = glProperties.height * this.ratioSize.y;
	};

	getRelativeMousePos(): vec2 {
		return new vec2(mousePosX * devicePixelRatio - glProperties.offsetX - this.pos.x, mousePosY * devicePixelRatio - glProperties.offsetY - this.pos.y);
	}

	getGlMousePos(): vec2 {
		const cursor = this.getRelativeMousePos().minus(this.size.times(0.5));
		cursor.x /= this.size.x * 0.5;
		cursor.y /= this.size.y * 0.5;

		return cursor;
	}

	key(code: string, pressed: boolean): boolean {
		// console.log(code);
		return false;
	}

	mouse(button: number, pressed: boolean): boolean {
		return false;
	}

	wheel(dy: number): boolean {
		return false;
	}

	mouseMove(dx: number, dy: number): boolean {
		return false;
	}

	mouseUnlock() {

	}

	drawBorder() {
		gl.useProgram(borderShader.program);
		gl.bindVertexArray(rectVao);
		gl.disable(gl.DEPTH_TEST);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

		gl.enable(gl.DEPTH_TEST);
		gl.bindVertexArray(null);
		gl.useProgram(null);
	}
}