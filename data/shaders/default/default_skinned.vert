attribute vec4 aVertexPosition;
attribute vec2 aTexCoord;
attribute vec3 aColor;
attribute vec4 aBoneIds;
attribute vec4 aBoneWeights;

const int MAX_BONES = 64;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uBoneMatrices[MAX_BONES];

varying vec2 vTexCoord;
varying vec3 vColor;
varying float vDepth;

void main() {
	vTexCoord = aTexCoord;
	vColor = aColor;

	mat4 skinMat = aBoneWeights.x * uBoneMatrices[int(aBoneIds.x)] +
		aBoneWeights.y * uBoneMatrices[int(aBoneIds.y)] +
		aBoneWeights.z * uBoneMatrices[int(aBoneIds.z)] +
		aBoneWeights.w * uBoneMatrices[int(aBoneIds.w)];
	vec4 worldPosition = skinMat * aVertexPosition;
	vec4 cameraPosition = uModelViewMatrix * worldPosition;
	gl_Position = uProjectionMatrix * cameraPosition;

	vDepth = -cameraPosition.z;
}