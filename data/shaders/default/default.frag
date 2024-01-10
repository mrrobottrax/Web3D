precision mediump float;

varying vec2 vTexCoord;
varying vec3 vColor;
varying float vDepth;

uniform sampler2D uSampler;
uniform vec4 uColor;

uniform vec4 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

void main() {
	vec4 color = uColor * vec4(vColor, 1) * texture2D(uSampler, vTexCoord);
	float fogAmount = smoothstep(uFogNear, uFogFar, vDepth);

	gl_FragColor = mix(color, uFogColor, fogAmount);
}