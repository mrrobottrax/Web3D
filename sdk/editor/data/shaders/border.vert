attribute vec4 aVertexPosition;

varying vec2 position;

void main() {
	position = aVertexPosition.xy;
	gl_Position = aVertexPosition;
}