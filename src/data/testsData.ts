import { TestInfo } from '../types/cadat';

export const CADAT_TESTS: TestInfo[] = [
  {
    id: 'test1',
    number: 1,
    name: 'Complex Reaction Time Test',
    shortName: 'Reaction Time',
    description: 'Measures split-second psychomotor visual reaction time and coordination under signal stimulus.',
    keysUsed: ['L', 'Y (Yellow)', 'R (Red)', 'G (Green)'],
    instructionPhotoRef: 'Test 1: Complex Reaction Time Test',
    rules: [
      'Press and hold the L key to arm the test.',
      'A colored signal disc (Yellow 🟡, Red 🔴, or Green 🟢) will be displayed on screen after a variable delay.',
      'Immediately press the same coloured key on the keypad/keyboard (Y for Yellow, R for Red, G for Green).',
      'Then immediately press the L key again to register the reaction time.',
      'Stay alert! Avoid premature key presses before the signal appears.'
    ],
  },
  {
    id: 'test2',
    number: 2,
    name: 'Form Perception Test',
    shortName: 'Form Perception',
    description: 'Measures rapid perceptual speed, visual discrimination, and peripheral orientation detection.',
    keysUsed: ['1', '2', '3', '4', '5'],
    instructionPhotoRef: 'Test 2: Form Perception Test',
    rules: [
      'As soon as each question appears, 5 figures will be displayed (often for a fraction of a second).',
      'Four of the figures are identical in shape and orientation.',
      'One figure is different from the other four (e.g. inverted arrow, different notch, or rotated).',
      'Identify the number (1 to 5) of the different figure.',
      'Immediately press that number on the keyboard or keypad.'
    ],
  },
  {
    id: 'test3',
    number: 3,
    name: 'Test of Concentration (4-Dots)',
    shortName: '4-Dots Concentration',
    description: 'Measures sustained selective attention, visual scanning accuracy, and error inhibition.',
    keysUsed: ['↑ (Mark 4 Dots)', '↓ (Unmark)', '→ (Next Box)', '← (Previous Box)'],
    instructionPhotoRef: 'Test 3: Test of concentration',
    rules: [
      'A matrix grid of dot patterns will be presented, containing boxes with 3, 4, or 5 dots.',
      'Your task is to identify and mark only groups with EXACTLY 4 DOTS.',
      'Use the UP (↑) arrow key to mark a 4-dots group (or tap on mobile).',
      'Use the DOWN (↓) arrow key to unmark if you made a mistake.',
      'Press the RIGHT (→) arrow key to move forward to the next group of dots.',
      'Use the LEFT (←) arrow key to move back to the previous group.',
      'Be fast and accurate! Incorrect marks carry negative penalties.'
    ],
  },
  {
    id: 'test4',
    number: 4,
    name: 'Speed Perception Test (Loco & Tunnel)',
    shortName: 'Speed Perception',
    description: 'Measures spatial-temporal velocity estimation and mental extrapolation of moving trains in blind zones.',
    keysUsed: ['H (Start Loco)', 'L (Stop Loco at Tunnel Exit)'],
    instructionPhotoRef: 'Test 4: Speed Perception Test',
    rules: [
      'Press H to start the Locomotive on the track.',
      'Observe the speed of the loco as it approaches the tunnel.',
      'The loco enters a dark tunnel and completely disappears from view.',
      'Mentally track its movement inside the tunnel at that constant speed.',
      'Press L at the exact moment the front of the loco emerges at the end of the tunnel.',
      'Your score is based on timing precision in milliseconds.'
    ],
  },
  {
    id: 'test5',
    number: 5,
    name: 'Same Colour & Sequence Test',
    shortName: 'Color & Sequence',
    description: 'Measures divided vigilance, dual-task cognitive monitoring, and pattern sequence memory.',
    keysUsed: ['L (Five Same Colour)', 'H (Yellow -> Red -> Green Sequence)'],
    instructionPhotoRef: 'Test 5: Same Colour & Sequence Test',
    rules: [
      'In this test, two simultaneous events must be monitored on the signal board:',
      '1. If there are any FIVE lights of the SAME COLOUR on screen, immediately press L.',
      '2. Also observe the blinking light whose colour and position changes.',
      '3. If that blinking light sequences through YELLOW 🟡 → RED 🔴 → GREEN 🟢 in order, immediately press H.',
      'Balance your attention between scanning the whole field and tracking the sequence!'
    ],
  },
];
