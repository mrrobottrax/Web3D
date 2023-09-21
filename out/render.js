var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { defaultShader, gl, glProperties } from "./gl.js";
import gMath from "./gmath.js";
import { quaternion, vec3 } from "./vector.js";
import { Model } from "./mesh/model.js";
import { mat4 } from "./matrix.js";
import { Time } from "./time.js";
import { loadGlTFFromWeb } from "./mesh/gltfloader.js";
const nearClip = 0.3;
const farClip = 1000;
let webModel = new Model();
export function drawInit() {
    return __awaiter(this, void 0, void 0, function* () {
        gl.useProgram(defaultShader.program);
        gl.uniformMatrix4fv(defaultShader.projectionMatrixUnif, false, calcPerspectiveMatrix(80, glProperties.width, glProperties.height).getData());
        gl.useProgram(null);
        webModel.position = new vec3(0, 0, -0.3);
        const m = yield loadGlTFFromWeb("./data/models/sign");
        if (m)
            webModel.mesh = m;
    });
}
let r1 = 0;
let r2 = 0;
let r3 = 0;
export function drawFrame() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(defaultShader.program);
    drawMesh(webModel.mesh, webModel.position, webModel.rotation, webModel.scale);
    gl.useProgram(null);
    webModel.rotation = quaternion.euler(r1, r2, r3);
    r1 += Time.deltaTime * 20;
    r2 += Time.deltaTime * 15;
    r3 += Time.deltaTime * 10;
}
function drawMesh(mesh, position, rotation, scale) {
    for (let i = 0; i < mesh.primitives.length; ++i) {
        drawPrimitive(mesh.primitives[i], position, rotation, scale);
    }
}
function drawPrimitive(primitive, position, rotation, scale) {
    gl.bindVertexArray(primitive.vao);
    let mat = new mat4;
    mat.translate(position);
    mat.rotate(rotation);
    mat.scale(scale);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, primitive.textures[0]);
    gl.uniformMatrix4fv(defaultShader.modelViewMatrixUnif, false, mat.getData());
    gl.uniform1i(defaultShader.samplerUnif, 0);
    gl.drawElements(gl.TRIANGLES, primitive.elementCount, gl.UNSIGNED_SHORT, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
}
function calcPerspectiveMatrix(fov, width, height) {
    const scale = getFrustumScale(fov);
    let matrix = new mat4;
    matrix.setValue(0, 0, scale * (height / width));
    matrix.setValue(1, 1, scale);
    matrix.setValue(2, 2, (farClip + nearClip) / (nearClip - farClip));
    matrix.setValue(3, 2, (2 * farClip * nearClip) / (nearClip - farClip));
    matrix.setValue(2, 3, -1);
    return matrix;
}
function getFrustumScale(fov) {
    return 1 / Math.tan(gMath.deg2Rad(fov) / 2);
}
//# sourceMappingURL=render.js.map