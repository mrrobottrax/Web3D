export function getFileType(name: string): string {
	return name.substring(name.lastIndexOf("."));
}

export function getFileNameWithoutType(fullName: string): string {
	return fullName.substring(0, fullName.lastIndexOf("."));
}

export function getFileWithoutDirectory(fullName: string): string {
	const index = fullName.lastIndexOf("/");

	if (index == -1) return fullName;
	return fullName.substring(index + 1);
}