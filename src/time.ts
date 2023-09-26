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

export function updateTime(): void {
	const time = Date.now();

	Time.deltaTime = (time - lastTime) / 1000;

	lastTime = time;

	if (time >= Time.nextTick) {
		Time.canTick = true;
		Time.nextTick = Time.nextTick + Time.fixedDeltaTime * 1000;
	} else {
		Time.canTick = false;
	}

	Time.fract = 1 - ((Time.nextTick - time) / (Time.fixedDeltaTime * 1000));
	Time.fract = Math.max(Time.fract, 0);
	Time.fract = Math.min(Time.fract, 1);
}