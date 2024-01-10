import { entities } from "./entity.js";

export function updateEntities() {
	for (const entity of entities) {
		// update scripts
		entity.update();

		// update positions
		const trans = entity.transform;
		const mat = trans.worldMatrix;
		mat.setIdentity();
		mat.translate(trans.translation);
		mat.rotate(trans.rotation);
		mat.scale(trans.scale);
	}
}