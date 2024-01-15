import { Camera } from "../../../../src/client/render/camera.js";
import { defaultShader, gl, glEndFrame, glProperties, resizeCanvas } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";

let viewedModel: Model;
let camera: Camera = new Camera(80, new vec3(0, 0, 5), quaternion.identity());

export function setModel(model: Model) {
	viewedModel = model;

	camera.calcPerspectiveMatrix(glProperties.width, glProperties.height);
}

export function modelViewerRenderFrame() {
	resizeCanvas();
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if (viewedModel) drawViewedModel();

	glEndFrame();
}

function drawViewedModel() {
	camera.updateViewMatrix();

	gl.useProgram(defaultShader.program);
	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, camera.perspectiveMatrix.getData());

	viewedModel.nodes.forEach(node => {
		node.primitives.forEach(prim => {
			const mat = camera.viewMatrix.copy();
			drawPrimitive(prim, mat, defaultShader);
		});
	});

	gl.useProgram(null);
}