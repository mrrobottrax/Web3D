export let Time = 
{
    deltaTime: 0
}

let lastTime = Date.now();

export function updateTime(): void
{
    const time = Date.now();

    Time.deltaTime = (time - lastTime) / 1000;

    lastTime = time;
}