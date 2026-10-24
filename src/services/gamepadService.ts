// Gamepad Service for Xbox One / Standard Gamepad support on Chrome/Chromebook
export type GamepadAction =
  | 'callWhale'
  | 'swimAscend'
  | 'swimDescend'
  | 'interact'
  | 'backOrClose'
  | 'screenCall'
  | 'cryStudio'
  | 'prevTab'
  | 'nextTab'
  | 'toggleResources'
  | 'toggleSettings'
  | 'sprintBoost'
  | 'resetCamera';

export interface GamepadMapping {
  callWhale: number; // default: 7 (Right Trigger RT)
  swimAscend: number; // default: 0 (A button)
  swimDescend: number; // default: 6 (Left Trigger LT)
  interact: number; // default: 0 (A button)
  backOrClose: number; // default: 1 (B button)
  screenCall: number; // default: 2 (X button)
  cryStudio: number; // default: 3 (Y button)
  prevTab: number; // default: 4 (Left Bumper LB)
  nextTab: number; // default: 5 (Right Bumper RB)
  toggleResources: number; // default: 8 (View / Back button)
  toggleSettings: number; // default: 9 (Menu / Start button)
  sprintBoost: number; // default: 10 (Left Stick Click L3)
  resetCamera: number; // default: 11 (Right Stick Click R3)
}

export interface GamepadConfig {
  controllerMode: boolean; // whether controller mode is enabled
  deadzone: number; // 0.05 - 0.35 (default 0.12)
  lookSensitivity: number; // 0.2 - 3.0 (default 1.0)
  invertY: boolean; // default false
  mapping: GamepadMapping;
}

export const DEFAULT_GAMEPAD_MAPPING: GamepadMapping = {
  callWhale: 7, // Right Trigger (RT)
  swimAscend: 0, // A button
  swimDescend: 6, // Left Trigger (LT)
  interact: 0, // A button
  backOrClose: 1, // B button
  screenCall: 2, // X button
  cryStudio: 3, // Y button
  prevTab: 4, // Left Bumper (LB)
  nextTab: 5, // Right Bumper (RB)
  toggleResources: 8, // View / Back
  toggleSettings: 9, // Menu / Start
  sprintBoost: 10, // L3
  resetCamera: 11, // R3
};

export const XBOX_BUTTON_NAMES: Record<number, string> = {
  0: 'A Button',
  1: 'B Button',
  2: 'X Button',
  3: 'Y Button',
  4: 'Left Bumper (LB)',
  5: 'Right Bumper (RB)',
  6: 'Left Trigger (LT)',
  7: 'Right Trigger (RT)',
  8: 'View / Back',
  9: 'Menu / Start',
  10: 'Left Stick Click (L3)',
  11: 'Right Stick Click (R3)',
  12: 'D-Pad Up',
  13: 'D-Pad Down',
  14: 'D-Pad Left',
  15: 'D-Pad Right',
  16: 'Xbox Guide',
};

export const ACTION_DESCRIPTIONS: Record<GamepadAction, { label: string; desc: string; defaultButton: string }> = {
  callWhale: {
    label: 'Call Whale / Whistle',
    desc: 'Summons Oreo with a joyful whistle / response cry',
    defaultButton: 'Right Trigger (RT)',
  },
  swimAscend: {
    label: 'Swim Ascend / Up',
    desc: 'Swim upwards towards the water surface',
    defaultButton: 'A Button',
  },
  swimDescend: {
    label: 'Swim Descend / Dive',
    desc: 'Dive deeper into the oceanic trench',
    defaultButton: 'Left Trigger (LT)',
  },
  interact: {
    label: 'Interact / Confirm',
    desc: 'Confirm selection, pet Oreo, or interact with objects',
    defaultButton: 'A Button',
  },
  backOrClose: {
    label: 'Back / Close Modal',
    desc: 'Close the current modal, menu, or cancel dialog',
    defaultButton: 'B Button',
  },
  screenCall: {
    label: 'Screen Call (Nintendogs)',
    desc: 'Brings Oreo close up to the screen for petting and feeding',
    defaultButton: 'X Button',
  },
  cryStudio: {
    label: 'Open Cry Studio',
    desc: 'Opens the custom whale cry recording and upload studio',
    defaultButton: 'Y Button',
  },
  prevTab: {
    label: 'Previous Tab',
    desc: 'Cycle left to the previous HUD tab or category',
    defaultButton: 'Left Bumper (LB)',
  },
  nextTab: {
    label: 'Next Tab',
    desc: 'Cycle right to the next HUD tab or category',
    defaultButton: 'Right Bumper (RB)',
  },
  toggleResources: {
    label: 'Hide / Show Resources',
    desc: 'Collapses or expands the top-right economy and resource tab',
    defaultButton: 'View / Back Button',
  },
  toggleSettings: {
    label: 'Toggle Settings',
    desc: 'Opens or closes the Settings modal',
    defaultButton: 'Menu / Start Button',
  },
  sprintBoost: {
    label: 'Sprint Swim Boost',
    desc: 'Hold to swim with increased speed and hydrodynamic surge',
    defaultButton: 'Left Stick Click (L3)',
  },
  resetCamera: {
    label: 'Reset Camera Horizon',
    desc: 'Centers pitch and aligns camera level with water',
    defaultButton: 'Right Stick Click (R3)',
  },
};

const STORAGE_KEY = 'whale_cove_gamepad_settings';

export interface GamepadLiveState {
  connected: boolean;
  gamepadId: string;
  isXbox: boolean;
  // Sticks
  moveX: number; // -1 to 1 (left/right)
  moveZ: number; // -1 to 1 (forward/backward)
  moveY: number; // -1 to 1 (up/down from triggers/buttons)
  lookYaw: number; // delta yaw per second
  lookPitch: number; // delta pitch per second
  sprint: boolean;
  // Raw buttons pressed map
  buttonsDown: boolean[];
}

class GamepadService {
  private config: GamepadConfig;
  private prevButtonStates: boolean[] = [];
  private activeGamepadIndex: number | null = null;
  private listeners: Set<(state: GamepadLiveState) => void> = new Set();
  private actionListeners: Set<(action: GamepadAction) => void> = new Set();
  private remappingAction: GamepadAction | null = null;
  private onRemappedCallback: ((action: GamepadAction, buttonIndex: number) => void) | null = null;
  private pollAnimId: number | null = null;

  // Cached live state
  private liveState: GamepadLiveState = {
    connected: false,
    gamepadId: '',
    isXbox: false,
    moveX: 0,
    moveZ: 0,
    moveY: 0,
    lookYaw: 0,
    lookPitch: 0,
    sprint: false,
    buttonsDown: new Array(18).fill(false),
  };

  constructor() {
    this.config = this.loadConfig();
    this.initEvents();
    this.startPolling();
  }

  private loadConfig(): GamepadConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          controllerMode: parsed.controllerMode !== undefined ? parsed.controllerMode : true,
          deadzone: typeof parsed.deadzone === 'number' ? parsed.deadzone : 0.12,
          lookSensitivity: typeof parsed.lookSensitivity === 'number' ? parsed.lookSensitivity : 1.0,
          invertY: !!parsed.invertY,
          mapping: { ...DEFAULT_GAMEPAD_MAPPING, ...(parsed.mapping || {}) },
        };
      }
    } catch {
      // ignore
    }
    return {
      controllerMode: true,
      deadzone: 0.12,
      lookSensitivity: 1.0,
      invertY: false,
      mapping: { ...DEFAULT_GAMEPAD_MAPPING },
    };
  }

  private saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // ignore
    }
  }

  private initEvents() {
    if (typeof window === 'undefined') return;

    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      console.log(`[GamepadService] Connected: ${e.gamepad.id} at index ${e.gamepad.index}`);
      this.activeGamepadIndex = e.gamepad.index;
      this.updateLiveState();
    });

    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      console.log(`[GamepadService] Disconnected: ${e.gamepad.id}`);
      if (this.activeGamepadIndex === e.gamepad.index) {
        this.activeGamepadIndex = null;
      }
      this.updateLiveState();
    });
  }

  private startPolling() {
    const loop = () => {
      this.poll();
      this.pollAnimId = requestAnimationFrame(loop);
    };
    this.pollAnimId = requestAnimationFrame(loop);
  }

  private applyDeadzone(val: number, deadzone: number): number {
    if (Math.abs(val) < deadzone) return 0;
    const sign = Math.sign(val);
    return sign * ((Math.abs(val) - deadzone) / (1 - deadzone));
  }

  private poll() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    let gp: Gamepad | null = null;

    if (this.activeGamepadIndex !== null && gamepads[this.activeGamepadIndex]) {
      gp = gamepads[this.activeGamepadIndex];
    } else {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i]!.connected) {
          gp = gamepads[i];
          this.activeGamepadIndex = i;
          break;
        }
      }
    }

    if (!gp || !this.config.controllerMode) {
      if (this.liveState.connected) {
        this.liveState.connected = false;
        this.liveState.moveX = 0;
        this.liveState.moveZ = 0;
        this.liveState.moveY = 0;
        this.liveState.lookYaw = 0;
        this.liveState.lookPitch = 0;
        this.liveState.sprint = false;
        this.notifyListeners();
      }
      return;
    }

    const deadzone = this.config.deadzone;
    const sensitivity = this.config.lookSensitivity;
    const invertY = this.config.invertY ? -1 : 1;

    // Standard Gamepad Sticks
    // Axis 0: Left Stick X (-1 left, 1 right)
    // Axis 1: Left Stick Y (-1 up/forward, 1 down/backward)
    // Axis 2: Right Stick X (-1 left, 1 right)
    // Axis 3: Right Stick Y (-1 up, 1 down)
    const rawLeftX = gp.axes[0] || 0;
    const rawLeftY = gp.axes[1] || 0;
    const rawRightX = gp.axes[2] || 0;
    const rawRightY = gp.axes[3] || 0;

    const filteredLeftX = this.applyDeadzone(rawLeftX, deadzone);
    const filteredLeftY = this.applyDeadzone(rawLeftY, deadzone);
    const filteredRightX = this.applyDeadzone(rawRightX, deadzone);
    const filteredRightY = this.applyDeadzone(rawRightY, deadzone);

    // D-Pad navigation (buttons 12: Up, 13: Down, 14: Left, 15: Right)
    let dpadX = 0;
    let dpadZ = 0;
    if (gp.buttons[14]?.pressed) dpadX -= 1;
    if (gp.buttons[15]?.pressed) dpadX += 1;
    if (gp.buttons[12]?.pressed) dpadZ -= 1;
    if (gp.buttons[13]?.pressed) dpadZ += 1;

    const moveX = Math.abs(filteredLeftX) > 0.01 ? filteredLeftX : dpadX;
    const moveZ = Math.abs(filteredLeftY) > 0.01 ? filteredLeftY : dpadZ;

    // Check button states
    const curButtons = gp.buttons.map((b) => b.pressed || b.value > 0.35);

    // If currently in Remap mode, catch the first pressed button
    if (this.remappingAction) {
      for (let i = 0; i < curButtons.length; i++) {
        if (curButtons[i] && !this.prevButtonStates[i]) {
          const action = this.remappingAction;
          this.config.mapping[action] = i;
          this.saveConfig();
          const cb = this.onRemappedCallback;
          this.remappingAction = null;
          this.onRemappedCallback = null;
          cb?.(action, i);
          break;
        }
      }
    }

    // Up / Down movement via mapped buttons
    let moveY = 0;
    if (curButtons[this.config.mapping.swimAscend]) moveY += 1;
    if (curButtons[this.config.mapping.swimDescend]) moveY -= 1;

    // Sprint check (L3 or mapped sprint)
    const sprint = curButtons[this.config.mapping.sprintBoost] || false;

    // Looking rotation speed
    // Right stick X changes yaw, right stick Y changes pitch
    const lookYaw = -filteredRightX * 2.2 * sensitivity;
    const lookPitch = -filteredRightY * 1.8 * sensitivity * invertY;

    // Detect single-press (edge-triggered) action events
    const actions: GamepadAction[] = [
      'callWhale',
      'interact',
      'backOrClose',
      'screenCall',
      'cryStudio',
      'prevTab',
      'nextTab',
      'toggleResources',
      'toggleSettings',
      'resetCamera',
    ];

    for (const action of actions) {
      const btnIdx = this.config.mapping[action];
      if (btnIdx !== undefined && btnIdx < curButtons.length) {
        const isDown = curButtons[btnIdx];
        const wasDown = this.prevButtonStates[btnIdx] || false;
        if (isDown && !wasDown) {
          this.notifyActionListeners(action);
        }
      }
    }

    // Special: D-pad left/right also trigger prevTab/nextTab if not already mapped
    if (curButtons[14] && !this.prevButtonStates[14] && this.config.mapping.prevTab !== 14) {
      this.notifyActionListeners('prevTab');
    }
    if (curButtons[15] && !this.prevButtonStates[15] && this.config.mapping.nextTab !== 15) {
      this.notifyActionListeners('nextTab');
    }

    this.prevButtonStates = [...curButtons];

    const isXbox =
      gp.id.toLowerCase().includes('xbox') ||
      gp.id.toLowerCase().includes('x-box') ||
      gp.id.toLowerCase().includes('xinput') ||
      gp.mapping === 'standard';

    this.liveState = {
      connected: true,
      gamepadId: gp.id,
      isXbox,
      moveX,
      moveZ,
      moveY,
      lookYaw,
      lookPitch,
      sprint,
      buttonsDown: curButtons,
    };

    this.notifyListeners();
  }

  private updateLiveState() {
    this.poll();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.liveState));
  }

  private notifyActionListeners(action: GamepadAction) {
    this.actionListeners.forEach((listener) => listener(action));
  }

  // Public API
  public getLiveState(): GamepadLiveState {
    return this.liveState;
  }

  public getConfig(): GamepadConfig {
    return { ...this.config, mapping: { ...this.config.mapping } };
  }

  public setControllerMode(enabled: boolean) {
    this.config.controllerMode = enabled;
    this.saveConfig();
    this.notifyListeners();
  }

  public setDeadzone(deadzone: number) {
    this.config.deadzone = Math.max(0.02, Math.min(0.4, deadzone));
    this.saveConfig();
  }

  public setLookSensitivity(sensitivity: number) {
    this.config.lookSensitivity = Math.max(0.2, Math.min(3.5, sensitivity));
    this.saveConfig();
  }

  public setInvertY(invert: boolean) {
    this.config.invertY = invert;
    this.saveConfig();
  }

  public remapAction(action: GamepadAction, buttonIndex: number) {
    this.config.mapping[action] = buttonIndex;
    this.saveConfig();
  }

  public startListeningForRemap(
    action: GamepadAction,
    callback: (action: GamepadAction, buttonIndex: number) => void
  ) {
    this.remappingAction = action;
    this.onRemappedCallback = callback;
  }

  public cancelRemap() {
    this.remappingAction = null;
    this.onRemappedCallback = null;
  }

  public getRemappingAction(): GamepadAction | null {
    return this.remappingAction;
  }

  public resetToDefaults() {
    this.config.mapping = { ...DEFAULT_GAMEPAD_MAPPING };
    this.config.deadzone = 0.12;
    this.config.lookSensitivity = 1.0;
    this.config.invertY = false;
    this.saveConfig();
  }

  public subscribe(listener: (state: GamepadLiveState) => void): () => void {
    this.listeners.add(listener);
    listener(this.liveState);
    return () => this.listeners.delete(listener);
  }

  public onAction(listener: (action: GamepadAction) => void): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }
}

export const gamepadService = new GamepadService();
