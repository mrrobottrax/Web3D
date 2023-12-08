import { glProperties } from "../../../../src/client/render/gl.js";

export abstract class EditorWindow {
	posX!: number;
	posY!: number;

	sizeX!: number;
	sizeY!: number;

	ratioPosX: number;
	ratioPosY: number;

	ratioSizeX: number;
	ratioSizeY: number;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number) {
		this.ratioPosX = posX;
		this.ratioPosY = posY;
		this.ratioSizeX = sizeX;
		this.ratioSizeY = sizeY;
		this.recalculateSize();
	}

	abstract frame(): void;
	tick(): void {};

	recalculateSize(): void {
		this.posX = glProperties.width * this.ratioPosX;
		this.posY = glProperties.height * this.ratioPosY;

		this.sizeX = glProperties.width * this.ratioSizeX;
		this.sizeY = glProperties.height * this.ratioSizeY;
	};

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