import gMath from "../../common/math/gmath.js";
import { mat4 } from "../../common/math/matrix.js";
import { quaternion, vec3 } from "../../common/math/vector.js";
import { glProperties } from "./gl.js";

export const nearClip = 0.015;
export const farClip = 1000;

export class Camera {
	position: vec3;
	rotation: quaternion;

	perspectiveMatrix: mat4;
	viewMatrix: mat4;

	fov: number;

	constructor(fov: number, position: vec3, rotation: quaternion) {
		this.fov = fov;
		this.position = position;
		this.rotation = rotation;

		this.perspectiveMatrix = new mat4(0);
		this.viewMatrix = mat4.identity();
	}

	updateViewMatrix() {
		this.viewMatrix.setIdentity();
		this.viewMatrix.rotate(this.rotation.inverse());
		this.viewMatrix.translate(this.position.inverse());
	}

	calcPerspectiveMatrix(width: number, height: number) {
		const scale = this.getFrustumScale(this.fov);

		this.perspectiveMatrix.setAll(0);
		this.perspectiveMatrix.setValue(0, 0, scale * (height / width));
		this.perspectiveMatrix.setValue(1, 1, scale);
		this.perspectiveMatrix.setValue(2, 2, (farClip + nearClip) / (nearClip - farClip));
		this.perspectiveMatrix.setValue(3, 2, (2 * farClip * nearClip) / (nearClip - farClip));
		this.perspectiveMatrix.setValue(2, 3, -1);
	}

	getFrustumScale(fov: number): number {
		return 1 / Math.tan(gMath.deg2Rad(fov) / 2);
	}

	calcOrthographicMatrix(width: number, height: number) {
		this.perspectiveMatrix.setAll(0);
		this.perspectiveMatrix.setValue(0, 0, this.fov * (height / width));
		this.perspectiveMatrix.setValue(1, 1, this.fov);
		this.perspectiveMatrix.setValue(3, 3, 1);
	}
}