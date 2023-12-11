import { editor } from "../main.js";

export enum Tool {
	Select,
	Block
}

export function useTool(tool: Tool) {
	editor.activeTool = tool;
}