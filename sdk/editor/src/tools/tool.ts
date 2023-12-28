import { editor } from "../main.js";

export enum ToolEnum {
	Select,
	Block,
	Cut
}

let selectButton: HTMLElement | null;
let blockButton: HTMLElement | null;
let cutButton: HTMLElement | null;
export function getToolButtons() {
	selectButton = document.getElementById("tool-select");
	blockButton = document.getElementById("tool-block");
	cutButton = document.getElementById("tool-cut");

	if (!(selectButton && blockButton && cutButton)) {
		console.error("MISSING BUTTON ELEMENTS");
		return;
	}

	selectButton.onclick = () => editor.setTool(ToolEnum.Select);
	blockButton.onclick = () => editor.setTool(ToolEnum.Block);
	cutButton.onclick = () => editor.setTool(ToolEnum.Cut);

	updateToolButtonVisuals();
}

export function updateToolButtonVisuals() {
	selectButton?.classList.remove("selected-button");
	blockButton?.classList.remove("selected-button");
	cutButton?.classList.remove("selected-button");

	switch (editor.activeToolEnum) {
		case ToolEnum.Select:
			selectButton?.classList.add("selected-button");
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