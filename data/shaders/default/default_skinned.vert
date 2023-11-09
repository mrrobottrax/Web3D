attribute vec4 aVertexPosition;
attribute vec2 aTexCoord;
attribute vec4 aBoneIds;
attribute vec4 aBoneWeights;

const int MAX_BONES = 64;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uBoneMatrices[MAX_BONES];

varying vec2 vTexCoord;

void main() {
	vTexCoord = aTexCoord;

	gl_Position = uProjectionMatrix * uModelViewMatrix * 
		(uBoneMatrices[int(aBoneIds[0])] * aVertexPosition * aBoneWeights[0]
		+ uBoneMatrices[int(aBoneIds[1])] * aVertexPosition * aBoneWeights[1]
		+ uBoneMatrices[int(aBoneIds[2])] * aVertexPosition * aBoneWeights[2]
		+ uBoneMatrices[int(aBoneIds[3])] * aVertexPosition * aBoneWeights[3]);
}