attribute vec4 aVertexPosition;

varying vec2 vPosition;

void main() {
	vPosition = aVertexPosition.xy;
	gl_Position = aVertexPosition;
}