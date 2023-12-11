precision mediump float;

uniform vec3 uFillColor;
uniform vec3 uBigFillColor;
uniform vec3 uZeroFillColor;
uniform float uGridSize;
uniform vec2 uOffset;

float grid(vec2 fragCoord, float size) {
	vec2 p = fragCoord + uOffset;

	vec2 a1 = mod(p - 0.5, size);
	vec2 a2 = mod(p + 0.5, size);
	vec2 a = a2 - a1;

	float g = min(a.x, a.y);

	return step(g, 0.0);
}

float zeroGrid(vec2 fragCoord) {
	vec2 p = fragCoord + uOffset;

	vec2 b = (p + 0.5) * (p - 0.5);

	return step(min(b.x, b.y), 0.0);
}

void main() {
	vec2 fragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);

	float zeroGrid = zeroGrid(fragCoord);
	float bigGrid = grid(fragCoord, uGridSize * 16.0);
	float smallGrid = grid(fragCoord, uGridSize);

	bigGrid *= 1.0 - zeroGrid;
	smallGrid *= (1.0 - bigGrid) * (1.0 - zeroGrid);

	vec3 color = uFillColor * smallGrid + uBigFillColor * bigGrid + uZeroFillColor * zeroGrid;

	gl_FragColor = vec4(color, 1);
}