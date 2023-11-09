attribute vec4 aVertexPosition;
attribute vec2 aTexCoord;
attribute vec4 aBoneIds;
attribute vec4 aBoneWeights;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main() {
	vTexCoord = aTexCoord;

	mat4 boneMatrix = mat4(1.0);

	gl_Position = uProjectionMatrix * uModelViewMatrix * boneMatrix * aVertexPosition;
}