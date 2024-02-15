import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { drawLine } from "../../../../src/client/render/debugRender.js";
import { gl, solidShader } from "../../../../src/client/render/gl.js";
import { camPos, drawPrimitive } from "../../../../src/client/render/render.js";
import gMath from "../../../../src/common/math/gmath.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { Ray } from "../../../../src/common/math/ray.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";
import { editor } from "../main.js";
import { Viewport } from "../windows/viewport.js";
import { SelectExtension } from "./selectextension.js";

export class RotateTool extends SelectExtension {
	circleModel: Model = new Model();

	async init() {
		this.circleModel = await ClientGltfLoader.loadGltfFromWeb("./sdk/editor/data/models/circle");
	}

	draw(viewport: Viewport) {
		super.draw(viewport);

		const cameraDir = viewport.cameraRay().direction;
		const dist = vec3.dot(this.center, cameraDir) - vec3.dot(viewport.camera.position, cameraDir);

		const drawCircle = (rotation: quaternion, color: number[]) => {
			let mat: mat4 = viewport.camera.viewMatrix.copy();
			mat.translate(this.center);
			mat.rotate(rotation);

			// don't do perspective divide
			if (viewport.perspective)
				mat.scale(new vec3(dist, dist, dist));
			else
				mat.scale(new vec3(1 / viewport.camera.fov, 1 / viewport.camera.fov, 1 / viewport.camera.fov));

			mat.scale(new vec3(0.2, 0.2, 0.2));
			this.circleModel.nodes.forEach(node => {
				node.primitives.forEach(primitive => {
					drawPrimitive(primitive, mat, solidShader, color);
				});
			});
		};

		gl.useProgram(solidShader.program);
		gl.clear(gl.DEPTH_BUFFER_BIT);

		drawCircle(quaternion.euler(0, 0, 90), [1, 0, 0, 1]); // X
		drawCircle(quaternion.identity(), [0, 1, 0, 1]); // Y
		drawCircle(quaternion.euler(90, 0, 0), [0, 0, 1, 1]); // Z

		gl.useProgram(null);
	}

	mouseMove(dx: number, dy: number): boolean {
		const viewport = editor.windowManager.activeWindow as Viewport;

		if (viewport && !viewport.looking) {
			// Get scale of gizmo
			let gizmoScale;
			if (viewport.perspective) {
				const camDir = viewport.cameraRay().direction;
				const distFromCamera = vec3.dot(this.center, camDir) - vec3.dot(viewport.camera.position, camDir);

				gizmoScale = distFromCamera;
			}
			else {
				gizmoScale = 1 / viewport.camera.fov;
			}

			const ray: Ray = viewport.mouseRay();
			const sphereCenter = this.center.minus(ray.origin); // Center relative to ray origin
			const sphereRadius = 0.2 * gizmoScale;
			
			const tCenter = vec3.dot(sphereCenter, ray.direction); // Dist along ray to center
			
			const distSquared = vec3.dot(sphereCenter, sphereCenter) - tCenter * tCenter; // Squared dist from center to nearest point
			if (distSquared < sphereRadius * sphereRadius)
			{
				// Hit

				const tInverse = Math.sqrt(sphereRadius * sphereRadius - distSquared); // Inverse distance along ray to hitpoint
				const t = tCenter - tInverse;
				
				const hitpoint = ray.direction.times(t).minus(sphereCenter).normalised(); // Local sphere coordinates
			}
		}

		return super.mouseMove(dx, dy);
	}
}