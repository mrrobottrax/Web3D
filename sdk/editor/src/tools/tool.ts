import { editor } from "../main.js";

export enum ToolEnum {
	Select,
	Block
}

let selectButton: HTMLElement | null;
let blockButton: HTMLElement | null;
export function getToolButtons() {
	selectButton = document.getElementById("tool-select");
	blockButton = document.getElementById("tool-block");

	if (!(selectButton && blockButton)) {
		console.error("MISSING BUTTON ELEMENTS");
		return;
	}

	selectButton.onclick = () => setTool(ToolEnum.Select);
	blockButton.onclick = () => setTool(ToolEnum.Block);

	updateVisuals();
}

export function setTool(tool: ToolEnum) {
	editor.activeToolEnum = tool;

	switch (tool) {
		case ToolEnum.Select:
			editor.activeTool = editor.selectTool;

			break;
		case ToolEnum.Block:
			editor.activeTool = editor.blockTool;
			break;
	}

	updateVisuals();
}

function updateVisuals() {
	selectButton?.classList.remove("selected-button");
	blockButton?.classList.remove("selected-button");

	switch (editor.activeToolEnum) {
		case ToolEnum.Select:
			selectButton?.classList.add("selected-button");
			break;
		case ToolEnum.Block:
			blockButton?.classList.add("selected-button");
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
}