attribute vec4 aVertexPosition;

void main() {
	gl_Position = vec4(aVertexPosition.x * 2.0, aVertexPosition.y * 2.0, aVertexPosition.z, aVertexPosition.w);
}