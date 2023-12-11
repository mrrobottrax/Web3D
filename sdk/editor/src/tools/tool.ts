import { editor } from "../main.js";

export enum ToolEnum {
	Select,
	Block
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
}

export class Tool {
	mouse(button: number, pressed: boolean): boolean {
		return false;
	}

	mouseMove(dx: number, dy: number): boolean {
		return false;
	}
}