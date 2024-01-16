import { Camera } from "../../../../src/client/render/camera.js";
import { defaultShader, gl, glEndFrame, glProperties, resizeCanvas } from "../../../../src/client/render/gl.js";
import { drawPrimitive } from "../../../../src/client/render/render.js";
import { quaternion, vec3 } from "../../../../src/common/math/vector.js";
import { Model } from "../../../../src/common/mesh/model.js";

let viewedModel: Model;
let camera: Camera = new Camera(80, new vec3(0, 0, 0), quaternion.identity());

let orbitRotation = vec3.origin();
let pan = vec3.origin();

export function setModel(model: Model) {
	viewedModel = model;

	camera.calcPerspectiveMatrix(glProperties.width, glProperties.height);
}

export function addOrbitRotation(euler: vec3) {
	orbitRotation.add(euler);
}

export function addPan(panDelta: vec3) {
	pan.add(panDelta);
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
			mat.translate(new vec3(0, 0, -5));
			mat.translate(pan);
			mat.rotateX(-orbitRotation.x);
			mat.rotateY(-orbitRotation.y);
			drawPrimitive(prim, mat, defaultShader);
		});
	});

	gl.useProgram(null);
}