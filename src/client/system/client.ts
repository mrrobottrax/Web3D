import { CircularBuffer } from "../../common/collections/circularbuffer.js";
import { quaternion, vec3 } from "../../common/math/vector.js";
import { Environment, setGameContext } from "../../common/system/context.js";
import { PacketType } from "../../common/network/netenums.js";
import { Packet, PlayerSnapshot, SnapshotPacket, UserCmdPacket } from "../../common/network/packet.js";
import { PredictedData, SharedPlayer } from "../../common/player/sharedplayer.js";
import { Time } from "../../common/system/time.js";
import { UserCmd } from "../../common/input/usercmd.js";
import { ClientPlayer } from "../player/clientplayer.js";
import { glEndFrame, glProperties, initGl, resizeCanvas } from "../render/gl.js";
import { drawText, initUi, initUiBuffers } from "../render/ui.js";
import { tickViewmodel } from "../render/viewmodel.js";
import { updateEntities } from "../../common/entitysystem/update.js";
import { Camera } from "../render/camera.js";
import { Buttons } from "../../common/input/buttons.js";
import { input } from "../player/input.js";
import { players } from "../../common/system/playerList.js";
import { drawLine } from "../render/debugRender.js";
import { initRender, lastCamPos, updateInterp, drawFrame } from "../render/render.js";
import { PlayerUtil } from "../../common/player/playerutil.js";
import { client } from "../clientmain.js";
import { audioContext, updateAudio } from "../audio/audio.js";

interface PlayerData {
	cmd: UserCmd,
	cmdNumber: number,
	predictedData: PredictedData
}

export class Client {
	ws: WebSocket | null;
	isConnected: boolean = false;
	localPlayer!: ClientPlayer;
	nextCmdNumber: number = 0;

	cmdBuffer: CircularBuffer<PlayerData>;

	camera: Camera;

	lastButtons = new Array<boolean>(Buttons.MAX_BUTTONS);
	buttons = new Array<boolean>(Buttons.MAX_BUTTONS);

	public constructor() {
		setGameContext(Environment.client);
		this.ws = null;
		(window as any).connect = (url: string) => this.connect(url);
		this.cmdBuffer = new CircularBuffer(1 / Time.fixedDeltaTime);
		this.camera = new Camera(90, vec3.origin(), quaternion.identity());
	}

	public async init() {
		await initGl();
		initUiBuffers();
		await initUi();
		initRender();
	}

	setup(playerId: number) {
		this.localPlayer = new ClientPlayer(playerId);
		this.nextCmdNumber = 0;
		input.initInput(this.localPlayer);

		// drawText(new vec3(-10, -10, 0), "TEST TEXT! HelLo wOrLd! _0123()[]", 1000, new vec3(1, 1, 1));
	}

	public connect(url: string): void {
		console.log("Connecting to: " + url);

		this.ws = new WebSocket(url);

		this.ws.onopen = ev => {
			if (this.ws == null)
				return;

			const reqPacket: Packet = {
				type: PacketType.joinReq
			}

			this.ws.send(JSON.stringify(reqPacket));
		}

		this.ws.onmessage = ev => {
			const data = JSON.parse(ev.data);

			switch (data.type) {
				case PacketType.joinRes:
					console.log("Successfully joined server");
					this.setup(data.playerId);
					this.isConnected = true;
					break;
				case PacketType.snapshot:
					this.handleSnapshot(data);
					break;
				default:
					break;
			}
		}
	}

	public tick(): void {
		if (!this.isConnected)
			return;

		lastCamPos.copy(this.localPlayer.camPosition);

		const cmd = input.createUserCMD(this.localPlayer);
		const cmdPacket: UserCmdPacket = {
			number: this.nextCmdNumber,
			type: PacketType.userCmd,
			cmd: cmd,
			id: this.localPlayer.id
		}
		this.ws?.send(JSON.stringify(cmdPacket));

		// predict player
		this.localPlayer.processCmd(cmd);
		this.cmdBuffer.push({
			cmd: cmd,
			cmdNumber: this.nextCmdNumber,
			predictedData: this.localPlayer.createPredictedData()
		});

		tickViewmodel(this.localPlayer);

		input.tickButtons();
		++this.nextCmdNumber;
	}

	public frame(): void {
		if (!this.isConnected)
			return;

		updateEntities();
		updateInterp(this);

		this.camera.rotation = this.localPlayer.camRotation;

		resizeCanvas();
		if (glProperties.resolutionChanged)
			this.camera.calcPerspectiveMatrix(glProperties.width, glProperties.height);

		drawFrame(this);
		glEndFrame();

		updateAudio(this);
	}

	handleSnapshot(packet: SnapshotPacket) {
		// udpate players
		for (let i = 0; i < packet.snapshot.players.length; ++i) {
			const playerSnapshot = packet.snapshot.players[i];

			if (playerSnapshot.id == this.localPlayer.id) {
				this.updateLocalPlayer(playerSnapshot, packet);
			} else {
				let player = players.get(playerSnapshot.id);

				if (!player) {
					player = new ClientPlayer(playerSnapshot.id);
					players.set(playerSnapshot.id, player);
				}

				player.position.copy(playerSnapshot.data.position);
				player.yaw = playerSnapshot.yaw;
				player.pitch = playerSnapshot.pitch;
				player.controller.setState(playerSnapshot.anim);
				player.controller.time = playerSnapshot.time;

				if (player.health > playerSnapshot.health) {
					// deal damage effect
				}
				player.health = playerSnapshot.health;
			}
		}
	}

	updateLocalPlayer(playerSnapshot: PlayerSnapshot, snapshot: SnapshotPacket) {
		if (client.localPlayer.health > playerSnapshot.health) {
			// took damage effect
			console.log("TOOK DAMAGE!");
		}
		client.localPlayer.health = playerSnapshot.health;

		if (client.localPlayer.isDead()) {
			// move to origin
			client.localPlayer.camPosition = new vec3(0, 1, 0);
		} else {
			// check if predicted stuff is valid
			const offset = this.nextCmdNumber - snapshot.lastCmd;
			const playerData = this.cmdBuffer.rewind(offset);
			if (snapshot.lastCmd == -1) {
				console.log("Record does not exist");
				return;
			}

			if (!SharedPlayer.predictedVarsMatch(playerData.predictedData, playerSnapshot.data)) {
				drawLine(playerSnapshot.data.position, vec3.copy(playerSnapshot.data.position).plus(new vec3(0, 2, 0)), [0, 0, 1, 1], 1);
				drawLine(playerData.predictedData.position, playerData.predictedData.position.plus(new vec3(0, 2, 0)), [1, 0, 0, 1], 1);

				console.error("Prediction error: " + playerData.predictedData.position.dist(playerSnapshot.data.position));

				// snap to position and resimulate all usercmds
				playerData.predictedData = SharedPlayer.copyPredictedData(playerSnapshot.data);
				this.localPlayer.setPredictedData(playerSnapshot.data);
				PlayerUtil.catagorizePosition(this.localPlayer);

				for (let i = offset - 1; i > 0; --i) {
					this.localPlayer.processCmd(this.cmdBuffer.rewind(i).cmd, true);
					this.cmdBuffer.rewind(i).predictedData = this.localPlayer.createPredictedData();
				}
			}
		}
	}
}