import { mat4 } from "../math/matrix.js";
import { quaternion, vec3 } from "../math/vector.js";

export class Transform {
	translation: vec3 = vec3.origin();
	scale: vec3 = vec3.one();
	rotation: quaternion = quaternion.identity();
	worldMatrix: mat4 = mat4.identity();

	getWorldPosition(): vec3 {
		return new vec3(
			this.worldMatrix.getValue(3, 0),
			this.worldMatrix.getValue(3, 1),
			this.worldMatrix.getValue(3, 2)
		);
	}

	getWorldForward(): vec3 {
		// don't add translation
		const noOffsetMat = this.worldMatrix.copy();
		noOffsetMat.setValue(3, 0, 0);
		noOffsetMat.setValue(3, 0, 1);
		noOffsetMat.setValue(3, 0, 2);

		return new vec3(0, 0, -1).multMat4(noOffsetMat).normalised();
	}
}