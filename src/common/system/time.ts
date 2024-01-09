import { Environment, environment } from "./context.js";

export let Time =
{
	deltaTime: 0,
	fixedDeltaTime: 1 / 32,
	elapsed: 0,
	canTick: false,
	nextTick: 0,
	fract: 0
}

let lastTime = Date.now();

export function startTicking(): void {
	Time.nextTick = Date.now();
}

let pause: boolean = false;
let advance: boolean = false;

export function pauseGame() {
	pause = !pause;
}

export function advanceGame() {
	advance = true;
}

export function updateTime(): void {
	const time = Date.now();

	Time.deltaTime = (time - lastTime) / 1000;
	Time.elapsed += Time.deltaTime;

	lastTime = time;

	// handle ticks on client
	if (environment != Environment.server) {
		if (time >= Time.nextTick) {
			if (time - Time.nextTick > Time.fixedDeltaTime * 3000) {
				console.log("more than 3 ticks behind, starting over");
				Time.nextTick = Date.now();
			}
			Time.nextTick = Time.nextTick + Time.fixedDeltaTime * 1000;
			if (!pause || advance) {
				Time.canTick = true;
				advance = false;
			}
		} else {
			Time.canTick = false;
		}
	}

	if (!pause) {
		Time.fract = 1 - ((Time.nextTick - time) / (Time.fixedDeltaTime * 1000));
		Time.fract = Math.max(Time.fract, 0);
		Time.fract = Math.min(Time.fract, 1);
	}
}