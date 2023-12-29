import { editor } from "../main.js";

export enum ToolEnum {
	Select,
	Translate,
	Rotate,
	Scale,
	Block,
	Cut
}

let selectButton: HTMLElement | null;
let translateButton: HTMLElement | null;
let rotateButton: HTMLElement | null;
let scaleButton: HTMLElement | null;
let blockButton: HTMLElement | null;
let cutButton: HTMLElement | null;
export function getToolButtons() {
	selectButton = document.getElementById("tool-select");
	translateButton = document.getElementById("tool-translate");
	rotateButton = document.getElementById("tool-rotate");
	scaleButton = document.getElementById("tool-scale");
	blockButton = document.getElementById("tool-block");
	cutButton = document.getElementById("tool-cut");

	if (!(selectButton && blockButton && cutButton &&translateButton
		&& rotateButton && scaleButton)) {
		console.error("MISSING BUTTON ELEMENTS");
		return;
	}

	selectButton.onclick = () => editor.setTool(ToolEnum.Select);
	translateButton.onclick = () => editor.setTool(ToolEnum.Translate);
	rotateButton.onclick = () => editor.setTool(ToolEnum.Rotate);
	scaleButton.onclick = () => editor.setTool(ToolEnum.Scale);
	blockButton.onclick = () => editor.setTool(ToolEnum.Block);
	cutButton.onclick = () => editor.setTool(ToolEnum.Cut);

	updateToolButtonVisuals();
}

export function updateToolButtonVisuals() {
	selectButton?.classList.remove("selected-button");
	translateButton?.classList.remove("selected-button");
	rotateButton?.classList.remove("selected-button");
	scaleButton?.classList.remove("selected-button");
	blockButton?.classList.remove("selected-button");
	cutButton?.classList.remove("selected-button");

	switch (editor.activeToolEnum) {
		case ToolEnum.Select:
			selectButton?.classList.add("selected-button");
			break;
		case ToolEnum.Translate:
			translateButton?.classList.add("selected-button");
			break;
		case ToolEnum.Rotate:
			rotateButton?.classList.add("selected-button");
			break;
		case ToolEnum.Scale:
			scaleButton?.classList.add("selected-button");
			break;
		case ToolEnum.Block:
			blockButton?.classList.add("selected-button");
			break;
		case ToolEnum.Cut:
			cutButton?.classList.add("selected-button");
			break;
	}
}

export class Tool {
	mouse(button: number, pressed: boolean): boolean {
		return false;
	}

	mouseMove(dx: number, dy: number): boolean {
		return false;
	}

	key(code: string, pressed: boolean): boolean {
		return false;
	}

	close() {

	}

	onSwitch() {

	}
}