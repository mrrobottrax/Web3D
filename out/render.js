import { defaultShader, gl, glProperties } from "./gl.js";
import gMath from "./gmath.js";
import { quaternion, vec3 } from "./vector.js";
import { Model } from "./model.js";
import { mat4 } from "./matrix.js";
import { Time } from "./time.js";
const nearClip = 0.3;
const farClip = 1000;
let vertBuffer;
let elementBuffer;
let cubeModel = new Model();
cubeModel.position = new vec3(0, -3, -7);
cubeModel.rotation = quaternion.identity();
cubeModel.verts = [
    -1, -1, -1,
    -1, -1, 1,
    -1, 1, -1,
    -1, 1, 1,
    1, -1, -1,
    1, -1, 1,
    1, 1, -1,
    1, 1, 1, // 7
];
cubeModel.elements = [
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
];
export function drawInit() {
    vertBuffer = gl.createBuffer();
    elementBuffer = gl.createBuffer();
    if (!vertBuffer || !elementBuffer) {
        console.error("Error creating buffer");
        return;
    }
    gl.useProgram(defaultShader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeModel.verts), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(cubeModel.elements), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, calcPerspectiveMatrix(80, glProperties.width, glProperties.height).data());
    gl.useProgram(null);
}
let r = 0;
export function drawFrame() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(defaultShader.program);
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    let mat = new mat4;
    cubeModel.scale = new vec3(1, 0.5, 2);
    cubeModel.rotation = quaternion.euler(0, r, 0);
    r += Time.deltaTime * 20;
    mat.scale(cubeModel.scale);
    mat.rotate(cubeModel.rotation);
    mat.translate(cubeModel.position);
    gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, mat.data());
    gl.drawElements(gl.TRIANGLES, cubeModel.elements.length, gl.UNSIGNED_BYTE, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(0);
    gl.useProgram(null);
}
function calcPerspectiveMatrix(fov, width, height) {
    const scale = getFrustumScale(fov);
    let matrix = new mat4;
    matrix.setValue(0, 0, scale * (height / width));
    matrix.setValue(1, 1, scale);
    matrix.setValue(2, 2, (farClip + nearClip) / (nearClip - farClip));
    matrix.setValue(2, 3, (2 * farClip * nearClip) / (nearClip - farClip));
    matrix.setValue(3, 2, -1);
    return matrix;
}
function getFrustumScale(fov) {
    return 1 / Math.tan(gMath.deg2Rad(fov) / 2);
}
//# sourceMappingURL=render.js.map