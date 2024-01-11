import { glProperties } from "../../../../src/client/render/gl.js";
import { vec2 } from "../../../../src/common/math/vector.js";
import { mousePosX, mousePosY } from "../system/input.js";

export abstract class EditorWindow {
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
	tick(): void { };

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

	key(code: string, pressed: boolean): void {
		// console.log(code);
	}

	mouse(button: number, pressed: boolean): void {

	}

	wheel(dy: number): void {

	}

	mouseMove(dx: number, dy: number): void {

	}

	mouseUnlock() {

	}
}