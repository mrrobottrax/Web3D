import { ClientGltfLoader } from "../../../../src/client/mesh/gltfloader.js";
import { gl, solidShader } from "../../../../src/client/render/gl.js";
import { camPos, drawPrimitive } from "../../../../src/client/render/render.js";
import { mat4 } from "../../../../src/common/math/matrix.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";
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
}