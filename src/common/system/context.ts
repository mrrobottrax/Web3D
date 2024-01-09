export enum Environment {
	none,
	client,
	server,
	host
}

export let environment: Environment;

export function setGameContext(_environment: Environment) {
	environment = _environment;
}