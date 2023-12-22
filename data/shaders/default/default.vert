attribute vec4 aVertexPosition;
attribute vec2 aTexCoord;
attribute vec3 aColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;
varying vec3 vColor;

void main() {
	vTexCoord = aTexCoord;
	vColor = aColor;
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}