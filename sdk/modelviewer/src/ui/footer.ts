let currentModelText: HTMLElement | null;

export function initModelViewerFooter() {
	currentModelText = document.getElementById("current-model");
}

export function setCurrentModelText(fileName: string) {
	if (!currentModelText) return;

	currentModelText.innerText = fileName;
}