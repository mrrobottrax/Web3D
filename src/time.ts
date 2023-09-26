export let Time =
{
	deltaTime: 0,
	fixedDeltaTime: 1 / 32,
	canTick: false,
	nextTick: 0,
	fract: 0,
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

	lastTime = time;

	if (time >= Time.nextTick) {
		Time.nextTick = Time.nextTick + Time.fixedDeltaTime * 1000;
		if (!pause || advance) {
			Time.canTick = true;
			advance = false;
		}
	} else {
		Time.canTick = false;
	}

	if (!pause) {
		Time.fract = 1 - ((Time.nextTick - time) / (Time.fixedDeltaTime * 1000));
		Time.fract = Math.max(Time.fract, 0);
		Time.fract = Math.min(Time.fract, 1);
	}
}