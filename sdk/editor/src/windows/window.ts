export abstract class EditorWindow {
	posX: number;
	posY: number;

	sizeX: number;
	sizeY: number;

	constructor(posX: number, posY: number, sizeX: number, sizeY: number) {
		this.posX = posX;
		this.posY = posY;
		this.sizeX = sizeX;
		this.sizeY = sizeY;
	}

	abstract frame(): void;
	tick(): void {};

	key(code: string, pressed: boolean): void {
		
	}

	mouse(button: number, pressed: boolean): void {
		
	}

	mouseMove(dx: number, dy: number): void {

	}

	mouseUnlock() {

	}
}