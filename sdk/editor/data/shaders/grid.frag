precision mediump float;

uniform vec3 uFillColor;
uniform float uGridSize;
uniform vec2 uOffset;

float grid(vec2 fragCoord, float size)
{
	vec2 p = fragCoord + uOffset;
	
	vec2 a1 = mod(p - 0.5, size);
	vec2 a2 = mod(p + 0.5, size);
	vec2 a = a2 - a1;
	
	float g = min(a.x, a.y);

	return step(g, 0.0);
}

void main()
{
	vec2 fragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);

	gl_FragColor = vec4(uFillColor * grid(fragCoord, uGridSize), 1);
}