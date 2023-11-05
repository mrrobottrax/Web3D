export default class gMath {
	static deg2Rad(angle: number): number {
		return (angle * Math.PI) / 180;
	}

	static rad2Deg(angle: number): number {
		return (angle * 180) / Math.PI;
	}

	static lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}

	static easeInOut(t: number) {
		if (t < 0.5) {
			return 4 * t * t * t;
		} else {
			const f = ((2 * t) - 2);
			return 0.5 * f * f * f + 1;
		}
	}

	static modulo(a: number, b: number) {
		return ((a % b) + b) % b;
	}
}