import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Volume2,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  Heart,
  Music,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { gamepadService, GamepadLiveState } from '../services/gamepadService';

interface XboxTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallWhale: () => void;
  onToggleScreenCall: () => void;
  onToggleResources: () => void;
  isNintendogsMode?: boolean;
}

interface TutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  controllerFocus: string; // e.g. "Left Stick (LS)"
  icon: string;
  instructions: string[];
  xboxButtons: {
    label: string;
    action: string;
    color: string;
    isPrimary?: boolean;
  }[];
  practiceHint: string;
  successConditionText: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    stepNumber: 1,
    title: 'Welcome to Xbox Controller Mode!',
    subtitle: 'Plug in your Xbox controller and dive into Whale Cove',
    controllerFocus: 'Chromebook USB / Bluetooth',
    icon: '🎮',
    instructions: [
      'Plug your Xbox One, Series X/S, or Xbox 360 controller into your Chromebook using a USB cable, or pair via Bluetooth.',
      'Chrome and Linux will automatically detect your standard controller layout.',
      'Watch the live connection indicator below. Once connected, your controller is ready to swim!',
    ],
    xboxButtons: [
      { label: 'LS', action: 'Left Thumbstick', color: 'bg-sky-600' },
      { label: 'RS', action: 'Right Thumbstick', color: 'bg-sky-600' },
      { label: 'RT', action: 'Right Trigger', color: 'bg-emerald-600', isPrimary: true },
      { label: 'A', action: 'Confirm / Up', color: 'bg-emerald-500' },
    ],
    practiceHint: 'Verify that your controller is detected in the status bar below.',
    successConditionText: 'Controller Connected & Ready',
  },
  {
    id: 'movement',
    stepNumber: 2,
    title: 'Swimming & Gliding (Movement)',
    subtitle: 'Explore the oceanic cove with your Left Thumbstick',
    controllerFocus: 'Left Thumbstick (LS)',
    icon: '🌊',
    instructions: [
      'Push the Left Thumbstick (LS) Forward to swim straight into the blue ocean.',
      'Pull Back to swim backward, or tilt Left and Right to strafe smoothly.',
      'Click the Left Stick (L3) anytime while swimming to activate a fast Hydrodynamic Sprint Boost!',
    ],
    xboxButtons: [
      { label: 'LS Up/Down', action: 'Swim Forward / Backward', color: 'bg-sky-600', isPrimary: true },
      { label: 'LS Left/Right', action: 'Strafe Side-to-Side', color: 'bg-sky-600', isPrimary: true },
      { label: 'L3 Click', action: 'Hold for Sprint Boost', color: 'bg-indigo-600' },
    ],
    practiceHint: 'Gently move your Left Stick now — watch the joystick circle react in real time!',
    successConditionText: 'Move the Left Thumbstick to practice',
  },
  {
    id: 'looking',
    stepNumber: 3,
    title: 'Camera & Looking Around',
    subtitle: 'Observe majestic marine life with your Right Thumbstick',
    controllerFocus: 'Right Thumbstick (RS)',
    icon: '👀',
    instructions: [
      'Push the Right Thumbstick (RS) Left or Right to rotate your camera yaw around the cove.',
      'Push Up or Down to look at the water surface sunbeams or deep seabed trenches.',
      'Click the Right Stick (R3) anytime to instantly level and reset your camera horizon!',
    ],
    xboxButtons: [
      { label: 'RS Pan', action: 'Rotate 360° Camera View', color: 'bg-sky-600', isPrimary: true },
      { label: 'RS Tilt', action: 'Pitch Up / Down', color: 'bg-sky-600', isPrimary: true },
      { label: 'R3 Click', action: 'Reset Horizon Level', color: 'bg-indigo-600' },
    ],
    practiceHint: 'Move your Right Stick to practice looking around.',
    successConditionText: 'Rotate the Right Thumbstick to practice',
  },
  {
    id: 'vertical',
    stepNumber: 4,
    title: 'Ascending & Diving (Vertical Swim)',
    subtitle: 'Control your ocean depth with A and Left Trigger (LT)',
    controllerFocus: 'A Button & Left Trigger (LT)',
    icon: '🫧',
    instructions: [
      'Press the green A Button to swim upward towards the glistening ocean surface.',
      'Squeeze the Left Trigger (LT) to dive deeper into underwater caverns and kelp forests.',
      'Combining forward movement with LT allows for realistic oceanic gliding dives.',
    ],
    xboxButtons: [
      { label: 'A', action: 'Swim Up (Ascend)', color: 'bg-emerald-500', isPrimary: true },
      { label: 'LT', action: 'Dive Deep (Descend)', color: 'bg-cyan-600', isPrimary: true },
    ],
    practiceHint: 'Try pressing the A button or pulling LT to test vertical swimming.',
    successConditionText: 'Press A to swim up or LT to dive',
  },
  {
    id: 'call_whale',
    stepNumber: 5,
    title: 'Calling Oreo (Whale Whistle)',
    subtitle: 'Your whale companion is always one trigger pull away',
    controllerFocus: 'Right Trigger (RT)',
    icon: '🐋',
    instructions: [
      'The Right Trigger (RT) is your special Whistle Summon trigger.',
      'Squeeze the Right Trigger (RT) anytime while exploring.',
      'Oreo will hear your whistle, chime back with a happy melodic whale song, and eagerly swim right to your side with playful fin wagging!',
    ],
    xboxButtons: [
      { label: 'RT', action: 'Whistle & Summon Oreo 🐋', color: 'bg-emerald-600', isPrimary: true },
    ],
    practiceHint: 'Pull your Right Trigger (RT) now to whistle to Oreo!',
    successConditionText: 'Pull Right Trigger (RT) to summon Oreo',
  },
  {
    id: 'screen_call',
    stepNumber: 6,
    title: 'Nintendogs Mode & Petting',
    subtitle: 'Bring Oreo right up to the screen for close-up care',
    controllerFocus: 'X Button & A Button',
    icon: '🐾',
    instructions: [
      'Press the blue X Button to trigger Nintendogs Screen Call Mode.',
      'Oreo will swim right up to the screen glass, tilting his head to follow your movements!',
      'Press the A Button (or touch the glass) to stroke and pet Oreo. You will hear gentle whale purrs and see heart bubbles rise!',
      'Press X again whenever you are ready to let Oreo swim freely.',
    ],
    xboxButtons: [
      { label: 'X', action: 'Screen Call (Nintendogs)', color: 'bg-blue-500', isPrimary: true },
      { label: 'A', action: 'Pet & Stroke Oreo 💕', color: 'bg-emerald-500', isPrimary: true },
    ],
    practiceHint: 'Press X to summon Oreo to the glass, or A to pet him.',
    successConditionText: 'Press X to test Nintendogs screen call',
  },
  {
    id: 'tab_navigation',
    stepNumber: 7,
    title: 'Choosing Tabs & Menus',
    subtitle: 'Cycle tabs with LB, RB and the D-Pad',
    controllerFocus: 'Left & Right Bumpers (LB / RB) & D-Pad',
    icon: '📑',
    instructions: [
      'Press Right Bumper (RB) or D-Pad Right to cycle forward through tabs (Housing, College, Therapy, Dex, 3D Models, Roster, Cry Studio, Settings).',
      'Press Left Bumper (LB) or D-Pad Left to cycle backward.',
      'Press the red B Button anytime to close any open menu and return immediately to the water.',
    ],
    xboxButtons: [
      { label: 'LB', action: 'Previous Tab', color: 'bg-indigo-600', isPrimary: true },
      { label: 'RB', action: 'Next Tab', color: 'bg-indigo-600', isPrimary: true },
      { label: 'D-Pad', action: 'Navigate Left / Right', color: 'bg-slate-700' },
      { label: 'B', action: 'Close Menu / Back', color: 'bg-rose-500', isPrimary: true },
    ],
    practiceHint: 'Press LB or RB to cycle between menu tabs!',
    successConditionText: 'Press LB or RB to test tab cycling',
  },
  {
    id: 'hide_resources',
    stepNumber: 8,
    title: 'Hideable Resource Bar',
    subtitle: 'Enjoy clean cinematic views with the View button',
    controllerFocus: 'View / Back Button (Two Squares)',
    icon: '👁️',
    instructions: [
      'Want an unobstructed, cinematic ocean view? Press the View / Back Button (the small button with two overlapping squares).',
      'This instantly collapses the top-right economy and resource box into a compact pill.',
      'Press the View / Back Button again anytime to restore the full resource grid with Coins, Meat, Driftwood, and Flutes.',
    ],
    xboxButtons: [
      { label: 'View', action: 'Hide / Expand Resources', color: 'bg-amber-600', isPrimary: true },
    ],
    practiceHint: 'Press the View button to collapse or expand the resource bar.',
    successConditionText: 'Press View to toggle resource bar',
  },
  {
    id: 'settings_remap',
    stepNumber: 9,
    title: 'Settings & Custom Remapping',
    subtitle: 'Fine-tune your controls or remap any button',
    controllerFocus: 'Menu / Start Button (Three Lines)',
    icon: '⚙️',
    instructions: [
      'Press the Menu / Start Button (three horizontal lines) to open Settings.',
      'In Settings, you can customize Stick Deadzone, Look Sensitivity, and Invert Y-axis.',
      'Click Remap on any action, then press any button on your Xbox controller to assign it to your personal preference!',
      'You are now fully graduated and ready to explore Whale Cove!',
    ],
    xboxButtons: [
      { label: 'Menu', action: 'Open / Close Settings', color: 'bg-slate-700', isPrimary: true },
      { label: 'Y', action: 'Open Cry Studio 🎙️', color: 'bg-amber-500' },
      { label: 'A', action: 'Finish Tutorial 🎉', color: 'bg-emerald-500', isPrimary: true },
    ],
    practiceHint: 'Press Finish to start your oceanic adventure!',
    successConditionText: 'You are ready to swim!',
  },
];

export const XboxTutorialModal: React.FC<XboxTutorialModalProps> = ({
  isOpen,
  onClose,
  onCallWhale,
  onToggleScreenCall,
  onToggleResources,
  isNintendogsMode = false,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [gamepadState, setGamepadState] = useState<GamepadLiveState>(gamepadService.getLiveState());
  const [stepPracticed, setStepPracticed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const unsub = gamepadService.subscribe((state) => {
      setGamepadState(state);
    });
    return () => unsub();
  }, []);

  // Listen for controller inputs to mark practice as completed in real time
  useEffect(() => {
    if (!isOpen) return;

    const currentStep = TUTORIAL_STEPS[currentStepIdx];
    if (!currentStep) return;

    // Movement step detection
    if (currentStep.id === 'movement') {
      if (Math.abs(gamepadState.moveX) > 0.25 || Math.abs(gamepadState.moveZ) > 0.25) {
        if (!stepPracticed[currentStepIdx]) {
          soundManager.playBubble();
          setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
        }
      }
    }

    // Looking step detection
    if (currentStep.id === 'looking') {
      if (Math.abs(gamepadState.lookYaw) > 0.25 || Math.abs(gamepadState.lookPitch) > 0.25) {
        if (!stepPracticed[currentStepIdx]) {
          soundManager.playBubble();
          setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
        }
      }
    }

    // Vertical swim step detection (A or LT)
    if (currentStep.id === 'vertical') {
      if (gamepadState.buttonsDown[0] || gamepadState.buttonsDown[6]) {
        if (!stepPracticed[currentStepIdx]) {
          soundManager.playBubble();
          setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
        }
      }
    }
  }, [gamepadState, currentStepIdx, isOpen, stepPracticed]);

  // Action listeners while tutorial is open
  useEffect(() => {
    if (!isOpen) return;

    const unsub = gamepadService.onAction((action) => {
      const currentStep = TUTORIAL_STEPS[currentStepIdx];

      if (action === 'callWhale') {
        onCallWhale();
        if (currentStep.id === 'call_whale') {
          soundManager.playCatchSuccess();
          setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
        }
      } else if (action === 'screenCall') {
        onToggleScreenCall();
        if (currentStep.id === 'screen_call') {
          soundManager.playCuteCry();
          setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
        }
      } else if (action === 'toggleResources') {
        onToggleResources();
        if (currentStep.id === 'hide_resources') {
          soundManager.playClick();
          setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
        }
      } else if (action === 'nextTab' || action === 'prevTab') {
        if (currentStep.id === 'tab_navigation') {
          soundManager.playBubble();
          setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
        }
      } else if (action === 'backOrClose') {
        if (currentStepIdx > 0) {
          handlePrev();
        } else {
          onClose();
        }
      } else if (action === 'interact') {
        if (currentStep.id === 'welcome' || currentStep.id === 'settings_remap') {
          handleNext();
        }
      }
    });

    return () => unsub();
  }, [currentStepIdx, isOpen, onCallWhale, onToggleScreenCall, onToggleResources, onClose]);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIdx];
  const isLastStep = currentStepIdx === TUTORIAL_STEPS.length - 1;
  const isPracticed = stepPracticed[currentStepIdx] || false;

  const handleNext = () => {
    soundManager.playClick();
    if (isLastStep) {
      soundManager.playCatchSuccess();
      onClose();
    } else {
      setCurrentStepIdx((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    soundManager.playClick();
    setCurrentStepIdx((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-emerald-400 rounded-3xl shadow-2xl shadow-emerald-950/80 overflow-hidden text-white flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
              <Gamepad2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-emerald-300">Xbox Controller Beginner Tutorial</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  Step {currentStep.stepNumber} of {TUTORIAL_STEPS.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Slow walk-through for Chromebook & USB/Bluetooth</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Exit Tutorial"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
            style={{ width: `${((currentStepIdx + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto max-h-[68vh] space-y-5">
          {/* Step Title Header */}
          <div className="flex items-start gap-4">
            <div className="text-4xl select-none">{currentStep.icon}</div>
            <div className="flex-1">
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Focus: {currentStep.controllerFocus}
              </div>
              <h4 className="text-xl font-bold text-white mt-0.5">{currentStep.title}</h4>
              <p className="text-sm text-slate-300 mt-1">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Instructions List */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Instructions:
            </span>
            {currentStep.instructions.map((inst, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                <span className="text-emerald-400 font-bold mt-0.5">●</span>
                <span>{inst}</span>
              </div>
            ))}
          </div>

          {/* Button Highlights for this step */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Buttons Used in this Step:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentStep.xboxButtons.map((btn, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                    btn.isPrimary
                      ? 'bg-slate-900 border-emerald-500/60 shadow-md shadow-emerald-950'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold font-mono text-white shadow-sm ${btn.color}`}
                  >
                    {btn.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{btn.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Controller Interactive Practice Box */}
          <div
            className={`border rounded-2xl p-4 transition-all ${
              isPracticed
                ? 'bg-emerald-950/40 border-emerald-500/70 shadow-lg shadow-emerald-950/50'
                : 'bg-slate-950/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <span>🎮 LIVE XBOX CONTROLLER DETECTOR</span>
              </span>

              {isPracticed ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/60 px-2.5 py-0.5 rounded-full animate-in fade-in">
                  <CheckCircle2 size={14} />
                  <span>Practice Action Detected!</span>
                </span>
              ) : (
                <span className="text-xs text-amber-400 animate-pulse font-mono">Waiting for your input...</span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-3">{currentStep.practiceHint}</p>

            {/* Live Controller Axis / Trigger Visualizer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-center">
              <div
                className={`p-2 rounded-xl border ${
                  Math.abs(gamepadState.moveX) > 0.1 || Math.abs(gamepadState.moveZ) > 0.1
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>Left Stick (LS)</div>
                <div className="font-bold text-white text-xs mt-0.5">
                  X:{gamepadState.moveX.toFixed(2)} Y:{gamepadState.moveZ.toFixed(2)}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  Math.abs(gamepadState.lookYaw) > 0.1 || Math.abs(gamepadState.lookPitch) > 0.1
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>Right Stick (RS)</div>
                <div className="font-bold text-white text-xs mt-0.5">
                  Yaw:{gamepadState.lookYaw.toFixed(1)}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  gamepadState.buttonsDown[7]
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-300 scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>Right Trigger (RT)</div>
                <div className="font-bold text-xs mt-0.5">
                  {gamepadState.buttonsDown[7] ? 'SQUEEZED 🐋' : 'Idle'}
                </div>
              </div>

              <div
                className={`p-2 rounded-xl border ${
                  gamepadState.buttonsDown[0]
                    ? 'bg-green-500 text-slate-950 font-bold border-green-300 scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>A Button</div>
                <div className="font-bold text-xs mt-0.5">{gamepadState.buttonsDown[0] ? 'PRESSED 💖' : 'Idle'}</div>
              </div>
            </div>

            {/* Quick Interactive Actions for Mouse/Touch clickers as backup */}
            {currentStep.id === 'call_whale' && (
              <button
                onClick={() => {
                  onCallWhale();
                  soundManager.playCatchSuccess();
                  setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
                }}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5"
              >
                <span>🐋 Click here to Test Whistle Summon (or squeeze RT on Xbox)</span>
              </button>
            )}

            {currentStep.id === 'screen_call' && (
              <button
                onClick={() => {
                  onToggleScreenCall();
                  soundManager.playCuteCry();
                  setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
                }}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-1.5"
              >
                <span>🐾 Click here to Toggle Nintendogs Screen Call (or press X on Xbox)</span>
              </button>
            )}

            {currentStep.id === 'hide_resources' && (
              <button
                onClick={() => {
                  onToggleResources();
                  soundManager.playClick();
                  setStepPracticed((prev) => ({ ...prev, [currentStepIdx]: true }));
                }}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition flex items-center justify-center gap-1.5"
              >
                <span>👁️ Click here to Toggle Resource Bar (or press View on Xbox)</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              currentStepIdx === 0
                ? 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-900'
                : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Previous Step</span>
          </button>

          {/* Indicator dots */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  soundManager.playClick();
                  setCurrentStepIdx(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentStepIdx
                    ? 'bg-emerald-400 w-5'
                    : stepPracticed[idx]
                    ? 'bg-emerald-600/60'
                    : 'bg-slate-700'
                }`}
                title={`Go to Step ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/60 transition transform hover:scale-105 active:scale-95"
          >
            <span>{isLastStep ? 'Finish & Swim! 🌊' : 'Next Step'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
