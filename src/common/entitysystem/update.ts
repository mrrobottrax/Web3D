import { entities } from "./entity.js";

export function updateEntities() {
	for (const entity of entities) {
		// update scripts
		entity.update();

		// update positions
		// we update entities with parents later
		if (!entity.parent) {
			const trans = entity.transform;
			const mat = trans.worldMatrix;
			mat.setIdentity();
			mat.translate(trans.translation);
			mat.rotate(trans.rotation);
			mat.scale(trans.scale);
		}
	}

	// update entities with parent
	for (const entity of entities) {
		if (entity.parent) {
			const trans = entity.transform;
			const mat = trans.worldMatrix;
			mat.set(entity.parent.transform.worldMatrix);
			mat.translate(trans.translation);
			mat.rotate(trans.rotation);
			mat.scale(trans.scale);
		}
	}
}