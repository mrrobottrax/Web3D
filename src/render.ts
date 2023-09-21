import { defaultShader, gl, glProperties } from "./gl.js";
import gMath from "./gmath.js";
import { quaternion, vec3 } from "./vector.js";
import { Model } from "./mesh/model.js";
import { mat4 } from "./matrix.js";
import { Time } from "./time.js";
import { PrimitiveData } from "./mesh/primitive.js";
import { Mesh } from "./mesh/mesh.js";
import { loadMeshFromWeb } from "./gltfloader.js";

const nearClip = 0.3;
const farClip = 1000;

let webModel: Model = new Model();
let cubeModel: Model = new Model();

let cubeData: PrimitiveData[] = [{
	vertices: new Float32Array([
		-1, -1, -1, // 0
		-1, -1, 1, // 1
		-1, 1, -1, // 2
		-1, 1, 1, // 3
		1, -1, -1, // 4
		1, -1, 1, // 5
		1, 1, -1, // 6
		1, 1, 1, // 7
	]),
	elements: new Uint16Array([
		// top
		3, 7, 2,
		6, 2, 7,

		// left
		0, 1, 2,
		3, 2, 1,

		// right
		6, 5, 4,
		7, 5, 6,

		// bottom
		4, 1, 0,
		5, 1, 4,

		// front
		5, 3, 1,
		7, 3, 5,

		// back
		0, 2, 4,
		4, 2, 6,
	])
}];

export async function drawInit(): Promise<void> {
	gl.useProgram(defaultShader.program);

	gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false,
		calcPerspectiveMatrix(80, glProperties.width, glProperties.height).getData());

	gl.useProgram(null);

	cubeModel.position = new vec3(0, -3, -7);
	cubeModel.scale = new vec3(2, 0.5, 1);

	//cubeModel.mesh.genBuffers(cubeData);

	webModel.position = new vec3(0, -3, -7);
	const m = await loadMeshFromWeb("./data/models/cube.glb");
	if (m)
		webModel.mesh = m;
}

let r1 = 0;
let r2 = 0;
let r3 = 0;
export function drawFrame(): void {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(defaultShader.program);
	gl.enableVertexAttribArray(0);

	//drawMesh(cubeModel.mesh, cubeModel.position, cubeModel.rotation, cubeModel.scale);
	drawMesh(webModel.mesh, webModel.position, webModel.rotation, webModel.scale);

	gl.disableVertexAttribArray(0);
	gl.useProgram(null);

	webModel.rotation = quaternion.euler(r1, r2, r3);
	r1 += Time.deltaTime * 20;
	r2 += Time.deltaTime * 15;
	r3 += Time.deltaTime * 10;
}

function drawMesh(mesh: Mesh, position: vec3, rotation: quaternion, scale: vec3) {
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.primitives[0].vertBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.primitives[0].elementBuffer);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

	let mat = new mat4;
	mat.translate(position);
	mat.rotate(rotation);
	mat.scale(scale);

	gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, mat.getData());

	gl.drawElements(gl.TRIANGLES, mesh.primitives[0].elementCount, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function calcPerspectiveMatrix(fov: number, width: number, height: number): mat4 {
	const scale = getFrustumScale(fov);

	let matrix = new mat4;
	matrix.setValue(0, 0, scale * (height / width));
	matrix.setValue(1, 1, scale);
	matrix.setValue(2, 2, (farClip + nearClip) / (nearClip - farClip));
	matrix.setValue(3, 2, (2 * farClip * nearClip) / (nearClip - farClip));
	matrix.setValue(2, 3, -1);

	return matrix;
}

function getFrustumScale(fov: number): number {
	return 1 / Math.tan(gMath.deg2Rad(fov) / 2);
}