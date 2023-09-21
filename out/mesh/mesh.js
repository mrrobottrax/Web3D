import { gl } from "../gl.js";
import { Primitive } from "./primitive.js";
export class Mesh {
    constructor() {
        this.primitives = [];
    }
    genBuffers(data) {
        this.primitives = [];
        for (let i = 0; i < data.length; ++i) {
            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            const vBuffer = gl.createBuffer();
            const eBuffer = gl.createBuffer();
            if (!vBuffer || !eBuffer || !vao) {
                console.error("Error creating buffer");
                return;
            }
            this.primitives.push(new Primitive(vao, data[i].elements.length));
            const length = data[i].positions.length + data[i].texCoords.length;
            let verts = new Float32Array(length);
            // merge into one array
            const vertCount = data[i].positions.length / 3;
            for (let j = 0; j < vertCount; ++j) {
                const index = j * 5;
                const posIndex = j * 3;
                const texIndex = j * 2;
                verts[index] = data[i].positions[posIndex];
                verts[index + 1] = data[i].positions[posIndex + 1];
                verts[index + 2] = data[i].positions[posIndex + 2];
                verts[index + 3] = data[i].texCoords[texIndex];
                verts[index + 4] = data[i].texCoords[texIndex + 1];
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data[i].elements, gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 12);
            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);
            gl.bindVertexArray(null);
        }
    }
}
//# sourceMappingURL=mesh.js.map