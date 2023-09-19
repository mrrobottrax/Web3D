export let Time = {
    deltaTime: 0
};
let lastTime = Date.now();
export function updateTime() {
    const time = Date.now();
    Time.deltaTime = (time - lastTime) / 1000;
    lastTime = time;
}
//# sourceMappingURL=time.js.map