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

	abstract draw(): void;

	key(code: string, pressed: boolean): void {
		console.log(code);
	}

	mouse(button: number, pressed: boolean): void {
		
	}

	mouseMove(x: number, y: number): void {
		
	}
}