precision mediump float;

uniform vec3 uFillColor;
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
	float totalGrid = grid(fragCoord, uGridSize)
		+ grid(fragCoord, uGridSize * 2.0) * 0.3
		+ grid(fragCoord, uGridSize * 4.0) * 0.3
		+ grid(fragCoord, uGridSize * 8.0) * 0.3
		+ grid(fragCoord, uGridSize * 16.0) * 0.3;

	totalGrid *= 1.0 - zeroGrid;

	vec3 color = uFillColor * totalGrid + uZeroFillColor * zeroGrid;

	gl_FragColor = vec4(color, 1);
}