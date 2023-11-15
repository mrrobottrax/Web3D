export enum Context {
	none,
	client,
	server,
	host
}

export let context: Context;

export function setContext(_context: Context) {
	context = _context;
}