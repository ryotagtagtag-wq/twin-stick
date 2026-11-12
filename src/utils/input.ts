/* src/utils/input.ts */
import Phaser from 'phaser';

export interface InputState {
  moveUp: boolean;
  moveDown: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  shoot: boolean;
  pointerX: number;
  pointerY: number;
  pause: boolean;
  mute: boolean;
  volumeUp: boolean;
  volumeDown: boolean;
}

export function createInputSystem(scene: Phaser.Scene): InputState & { update: () => void } {
  const state: InputState = {
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false,
    shoot: false,
    pointerX: 0,
    pointerY: 0,
    pause: false,
    mute: false,
    volumeUp: false,
    volumeDown: false,
  };

  const cursors = scene.input.keyboard!.createCursorKeys();
  const wasd = scene.input.keyboard!.addKeys('W,A,S,D,SPACE,ESC,P,M,BRACKET_OPEN,BRACKET_CLOSE') as Record<string, Phaser.Input.Keyboard.Key>;

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    state.pointerX = pointer.x;
    state.pointerY = pointer.y;
  });

  scene.input.on('pointerdown', () => {
    state.shoot = true;
  });

  scene.input.on('pointerup', () => {
    state.shoot = false;
  });

  // Lock mouse to canvas on click
  scene.input.on('pointerdown', () => {
    if (scene.input.mouse && scene.input.mouse.requestPointerLock) {
      scene.input.mouse.requestPointerLock();
    }
  });

  const getKey = (key: string): Phaser.Input.Keyboard.Key | undefined => wasd[key];

  const update = (): void => {
    const w = getKey('W');
    const s = getKey('S');
    const a = getKey('A');
    const d = getKey('D');
    const space = getKey('SPACE');
    const esc = getKey('ESC');
    const p = getKey('P');
    const m = getKey('M');
    const bracketClose = getKey('BRACKET_CLOSE');
    const bracketOpen = getKey('BRACKET_OPEN');

    state.moveUp = cursors.up.isDown || (w?.isDown ?? false);
    state.moveDown = cursors.down.isDown || (s?.isDown ?? false);
    state.moveLeft = cursors.left.isDown || (a?.isDown ?? false);
    state.moveRight = cursors.right.isDown || (d?.isDown ?? false);
    state.shoot = state.shoot || (space?.isDown ?? false);
    state.pause = Phaser.Input.Keyboard.JustDown(cursors.space) || Phaser.Input.Keyboard.JustDown(esc!) || Phaser.Input.Keyboard.JustDown(p!);
    state.mute = Phaser.Input.Keyboard.JustDown(m!);
    state.volumeUp = Phaser.Input.Keyboard.JustDown(bracketClose!); // ]
    state.volumeDown = Phaser.Input.Keyboard.JustDown(bracketOpen!); // [
  };

  return { ...state, update } as InputState & { update: () => void };
}

export function getMoveVector(input: InputState): { x: number; y: number } {
  let x = 0, y = 0;
  if (input.moveLeft) x -= 1;
  if (input.moveRight) x += 1;
  if (input.moveUp) y -= 1;
  if (input.moveDown) y += 1;
  // Normalize diagonal
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.sqrt(2);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}