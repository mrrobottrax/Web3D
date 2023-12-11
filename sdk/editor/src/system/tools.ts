export enum Tool {
	Select,
	Block
}

export function useTool(tool: Tool) {
	console.log(tool);
}