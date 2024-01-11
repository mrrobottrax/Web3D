import { Transform } from "./transform.js";

export let entities = new Set<Entity>()

export class Entity {
	transform: Transform = new Transform();
	parent: Entity | null = null;

	update() {}
	onDestroy() {};

	constructor() {
		entities.add(this);
	}
}

export function DestroyEntity(entity: Entity) {
	entity.onDestroy();
	entities.delete(entity);
}