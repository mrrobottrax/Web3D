import { defaultShader, gl } from "./gl.js";

let vertBuffer: WebGLBuffer | null;

export function drawInit(): void {
	vertBuffer = gl.createBuffer();
	if (!vertBuffer) {
		console.error("Error creating buffer")
		return;
	}

	const verts = [
		-0.5, -0.5,
		0.5, -0.5,
		0.5, 0.5,
	];

	gl.useProgram(defaultShader.program)
	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.useProgram(null);
}

export function drawFrame(): void {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(defaultShader.program);
	gl.enableVertexAttribArray(0);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.disableVertexAttribArray(0);
	gl.useProgram(null);
}