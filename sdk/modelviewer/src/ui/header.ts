import { closeModelFile, loadModelTextureDialog, openModelDialog } from "../file/modelLoader.js";

export function initModelViewerHeader() {
	(document as any).openModelDialog = () => openModelDialog();
	(document as any).closeModelFile = () => closeModelFile();
	(document as any).loadModelTexture = () => loadModelTextureDialog();
}