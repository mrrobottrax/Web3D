export enum GameContext {
	none,
	client,
	server,
	host
}

export let gameContext: GameContext;

export function setGameContext(_context: GameContext) {
	gameContext = _context;
}