import { gl, defaultShader } from "../gl.js";
import { Primitive } from "./primitive.js";
export class Mesh {
    constructor() {
        this.primitives = [];
    }
    genBuffers(data) {
        this.primitives = [];
        for (let i = 0; i < data.length; ++i) {
            const vBuffer = gl.createBuffer();
            const eBuffer = gl.createBuffer();
            if (!vBuffer || !eBuffer) {
                console.error("Error creating buffer");
                return;
            }
            this.primitives.push(new Primitive(vBuffer, eBuffer, data[i].elements.length));
            gl.useProgram(defaultShader.program);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.primitives[i].vertBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.primitives[i].elementBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[i].vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data[i].elements), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.useProgram(null);
        }
    }
}
//# sourceMappingURL=mesh.js.map