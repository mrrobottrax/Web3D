import { entityList } from "./entity.js";

export function updateEntities() {
	for (let i = 0; i < entityList.length; ++i) {
		// update scripts
		entityList[i].update();

		// update positions
		const trans = entityList[i].transform;
		const mat = trans.worldMatrix;
		mat.setIdentity();
		mat.translate(trans.translation);
		mat.rotate(trans.rotation);
		mat.scale(trans.scale);
	}
}