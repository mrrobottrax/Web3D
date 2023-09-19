attribute vec4 aVertexPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main() {
	vTexCoord = aTexCoord;
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}