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
}