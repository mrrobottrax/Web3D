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
}