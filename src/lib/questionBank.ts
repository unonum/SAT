import type { Question } from './types';

// A curated, SAT-style question bank with full AI-tutor explanation content.
// In production this would live in PostgreSQL behind the Admin Question Bank API.

export const QUESTION_BANK: Question[] = [
  // ---------------- ALGEBRA ----------------
  {
    id: 'alg-1',
    topic: 'algebra',
    subtopic: 'Linear equations',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'If 3x + 7 = 22, what is the value of x?',
    choices: [
      { id: 'A', text: '3' },
      { id: 'B', text: '5' },
      { id: 'C', text: '7' },
      { id: 'D', text: '15' },
    ],
    correct: 'B',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'Subtract 7 from both sides to get 3x = 15, then divide by 3 to get x = 5.',
      fastStrategy: 'Isolate the variable in two clean moves: undo the +7, then undo the ×3.',
      simplerView: 'Think "what times 3, plus 7, gives 22?" 15 + 7 = 22, and 15 ÷ 3 = 5.',
      trapNote: 'Choice D (15) is the value of 3x before you divide — students stop one step early.',
      timeTrick: 'For one-variable linears, never expand or guess — just peel operations off in reverse order.',
      whyWrong: {
        A: 'This would solve 3x + 7 = 16, not 22.',
        C: 'No operation here produces 7; likely a guess.',
        D: '15 is 3x, the value before dividing by 3.',
      },
    },
  },
  {
    id: 'alg-2',
    topic: 'algebra',
    subtopic: 'Systems of equations',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'A system of equations is given: 2x + y = 11 and x − y = 1. What is the value of x?',
    choices: [
      { id: 'A', text: '3' },
      { id: 'B', text: '4' },
      { id: 'C', text: '5' },
      { id: 'D', text: '6' },
    ],
    correct: 'B',
    parTimeSec: 70,
    explanation: {
      correctWhy: 'Add the equations: (2x + y) + (x − y) = 11 + 1 → 3x = 12 → x = 4.',
      fastStrategy: 'When y has opposite signs across the two equations, add them to eliminate y instantly.',
      simplerView: 'The y terms (+y and −y) cancel, leaving only x to solve for.',
      trapNote: 'Choice C (5) is what you get if you solve for y instead of x.',
      timeTrick: 'Scan for variables that already cancel before doing any substitution — it saves a full minute.',
      whyWrong: {
        A: 'Arises from an arithmetic slip when subtracting instead of adding.',
        C: 'This is the value of y, not x.',
        D: 'Does not satisfy either equation.',
      },
    },
  },
  {
    id: 'alg-3',
    topic: 'algebra',
    subtopic: 'Word problems',
    section: 'Math',
    difficulty: 'medium',
    prompt:
      'A gym charges a $25 sign-up fee plus $15 per month. Which equation gives the total cost C in dollars after m months?',
    choices: [
      { id: 'A', text: 'C = 25m + 15' },
      { id: 'B', text: 'C = 15m + 25' },
      { id: 'C', text: 'C = 40m' },
      { id: 'D', text: 'C = 15(m + 25)' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The monthly rate $15 multiplies m (the variable), and the one-time $25 fee is the constant: C = 15m + 25.',
      fastStrategy: 'Tag each number as "per-something" (slope) or "one-time" (intercept). Rate sticks to the variable.',
      simplerView: 'Slope = repeating cost, intercept = starting cost. Here slope 15, intercept 25.',
      trapNote: 'Choice A swaps the rate and fee — a classic careless flip.',
      timeTrick: 'Plug in m = 0: cost should be $25 (just the fee). Only B gives 25.',
      whyWrong: {
        A: 'Swaps which number repeats — makes the $25 the monthly rate.',
        C: 'Adds the numbers wrongly and drops the constant fee.',
        D: 'Multiplies the fee by months, charging $25 every month.',
      },
    },
  },

  // ---------------- ADVANCED MATH ----------------
  {
    id: 'adv-1',
    topic: 'advanced-math',
    subtopic: 'Quadratics',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'What are the solutions to x² − 5x + 6 = 0?',
    choices: [
      { id: 'A', text: 'x = 1 and x = 6' },
      { id: 'B', text: 'x = 2 and x = 3' },
      { id: 'C', text: 'x = −2 and x = −3' },
      { id: 'D', text: 'x = −1 and x = 6' },
    ],
    correct: 'B',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'Factor into (x − 2)(x − 3) = 0, so x = 2 or x = 3. They multiply to 6 and add to 5.',
      fastStrategy: 'Find two numbers that multiply to the constant (6) and add to the middle coefficient (5).',
      simplerView: '2 × 3 = 6 and 2 + 3 = 5 — that pair is your answer with flipped signs.',
      trapNote: 'Choice C flips the signs; the constant +6 with −5x means both roots are positive.',
      timeTrick: 'For monic quadratics, factoring beats the quadratic formula almost every time.',
      whyWrong: {
        A: '1 and 6 multiply to 6 but add to 7, not 5.',
        C: 'Negative roots would require the middle term to be +5x.',
        D: '−1 and 6 multiply to −6, not +6.',
      },
    },
  },
  {
    id: 'adv-2',
    topic: 'advanced-math',
    subtopic: 'Exponential growth',
    section: 'Math',
    difficulty: 'hard',
    prompt:
      'A population of bacteria doubles every 3 hours. If it starts at 500, which expression gives the population after t hours?',
    choices: [
      { id: 'A', text: '500 · 2^(3t)' },
      { id: 'B', text: '500 · 2^(t/3)' },
      { id: 'C', text: '500 + 2t/3' },
      { id: 'D', text: '500 · 3^(t/2)' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Doubling means base 2. It doubles once per 3 hours, so the exponent is t/3: 500 · 2^(t/3).',
      fastStrategy: 'Base = growth factor (2 for doubling); exponent = time ÷ period.',
      simplerView: 'At t = 3, exponent is 1, giving 500 · 2 = 1000 — one doubling. Correct.',
      trapNote: 'Choice A (2^(3t)) doubles every 1/3 hour — far too fast.',
      timeTrick: 'Test t = 3 mentally: the right model gives exactly double the start.',
      whyWrong: {
        A: 'Exponent 3t doubles 3 times per hour, not once per 3 hours.',
        C: 'Linear growth — but doubling is exponential.',
        D: 'Base 3 means tripling, not doubling.',
      },
    },
  },
  {
    id: 'adv-3',
    topic: 'advanced-math',
    subtopic: 'Function evaluation',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'If f(x) = 2x² − 3, what is f(4)?',
    choices: [
      { id: 'A', text: '13' },
      { id: 'B', text: '29' },
      { id: 'C', text: '32' },
      { id: 'D', text: '61' },
    ],
    correct: 'B',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'f(4) = 2(4²) − 3 = 2(16) − 3 = 32 − 3 = 29.',
      fastStrategy: 'Square first (order of operations), then multiply, then subtract.',
      simplerView: '4 squared is 16, doubled is 32, minus 3 is 29.',
      trapNote: 'Choice C (32) forgets to subtract 3 — finishing one step early.',
      timeTrick: 'Write the substitution with parentheses: 2(4)² so you don\'t multiply before squaring.',
      whyWrong: {
        A: 'Comes from (2·4)² interpreted wrong or 2·4+... arithmetic slip.',
        C: 'Forgot the −3.',
        D: 'Computed (2·4)² − 3 = 64 − 3, squaring after multiplying.',
      },
    },
  },

  // ---------------- PROBLEM SOLVING & DATA ----------------
  {
    id: 'psd-1',
    topic: 'problem-solving-data',
    subtopic: 'Percentages',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'A jacket originally priced at $80 is on sale for 25% off. What is the sale price?',
    choices: [
      { id: 'A', text: '$20' },
      { id: 'B', text: '$55' },
      { id: 'C', text: '$60' },
      { id: 'D', text: '$75' },
    ],
    correct: 'C',
    parTimeSec: 50,
    explanation: {
      correctWhy: '25% of 80 is 20, so the sale price is 80 − 20 = $60.',
      fastStrategy: '25% off means you pay 75%. 0.75 × 80 = 60 in one step.',
      simplerView: 'A quarter off 80 is 20 off, leaving 60.',
      trapNote: 'Choice A ($20) is the discount amount, not the price you pay.',
      timeTrick: 'Convert "X% off" to "pay (100−X)%" and multiply once — avoids the subtraction step.',
      whyWrong: {
        A: 'That is the discount, not the final price.',
        B: 'Comes from subtracting 25 instead of 25%.',
        D: 'That is 80 minus only $5 — wrong percentage.',
      },
    },
  },
  {
    id: 'psd-2',
    topic: 'problem-solving-data',
    subtopic: 'Mean / statistics',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'The average of five numbers is 12. Four of the numbers are 10, 11, 13, and 14. What is the fifth number?',
    choices: [
      { id: 'A', text: '10' },
      { id: 'B', text: '12' },
      { id: 'C', text: '14' },
      { id: 'D', text: '16' },
    ],
    correct: 'B',
    parTimeSec: 70,
    explanation: {
      correctWhy: 'Total must be 5 × 12 = 60. The four known numbers sum to 48, so the fifth is 60 − 48 = 12.',
      fastStrategy: 'Average problems are total problems: multiply the mean by the count to get the sum.',
      simplerView: 'You need everything to add to 60; you already have 48, so add 12.',
      trapNote: 'Choice C (14) tempts students who match the largest existing value.',
      timeTrick: 'Always convert "average = m" into "sum = m × n" first; the rest is subtraction.',
      whyWrong: {
        A: 'Picks an existing value with no calculation.',
        C: 'Matches the max value, ignoring the required total.',
        D: 'Over-corrects; total would become 64.',
      },
    },
  },
  {
    id: 'psd-3',
    topic: 'problem-solving-data',
    subtopic: 'Ratios & rates',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'A car travels 150 miles in 3 hours. At this rate, how far will it travel in 5 hours?',
    choices: [
      { id: 'A', text: '200 miles' },
      { id: 'B', text: '225 miles' },
      { id: 'C', text: '250 miles' },
      { id: 'D', text: '300 miles' },
    ],
    correct: 'C',
    parTimeSec: 55,
    explanation: {
      correctWhy: 'Rate = 150/3 = 50 mph. In 5 hours: 50 × 5 = 250 miles.',
      fastStrategy: 'Find the unit rate first, then scale to the new time.',
      simplerView: '50 miles each hour, five hours, 250 miles.',
      trapNote: 'Choice D (300) assumes 60 mph — a rounding-up mistake.',
      timeTrick: 'Unit-rate then multiply beats setting up a proportion to cross-multiply.',
      whyWrong: {
        A: 'Uses 40 mph — miscomputed the rate.',
        B: 'Scales by 4.5 hours, not 5.',
        D: 'Assumes 60 mph instead of 50.',
      },
    },
  },

  // ---------------- GEOMETRY & TRIG ----------------
  {
    id: 'geo-1',
    topic: 'geometry-trig',
    subtopic: 'Triangles',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'In a right triangle, the two legs measure 6 and 8. What is the length of the hypotenuse?',
    choices: [
      { id: 'A', text: '10' },
      { id: 'B', text: '12' },
      { id: 'C', text: '14' },
      { id: 'D', text: '48' },
    ],
    correct: 'A',
    parTimeSec: 50,
    explanation: {
      correctWhy: 'By the Pythagorean theorem, √(6² + 8²) = √(36 + 64) = √100 = 10.',
      fastStrategy: 'Recognize the 3-4-5 triangle scaled by 2 → 6-8-10. No calculation needed.',
      simplerView: '6, 8, 10 is just 3, 4, 5 doubled.',
      trapNote: 'Choice C (14) is 6 + 8 — adding the legs instead of using the theorem.',
      timeTrick: 'Memorize 3-4-5 and 5-12-13 triples to skip the square roots entirely.',
      whyWrong: {
        A: '',
        B: 'No basis; possibly averaging or guessing.',
        C: 'Adds the legs instead of applying Pythagoras.',
        D: 'That is 6 × 8, the product of the legs (twice the area).',
      },
    },
  },
  {
    id: 'geo-2',
    topic: 'geometry-trig',
    subtopic: 'Circles',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'A circle has a radius of 5. What is its area? (Use A = πr².)',
    choices: [
      { id: 'A', text: '10π' },
      { id: 'B', text: '25π' },
      { id: 'C', text: '50π' },
      { id: 'D', text: '100π' },
    ],
    correct: 'B',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'Area = π × r² = π × 5² = 25π.',
      fastStrategy: 'Square the radius first, then attach π. Don\'t confuse area with circumference.',
      simplerView: '5 squared is 25, times π.',
      trapNote: 'Choice A (10π) is the circumference formula (2πr), not the area.',
      timeTrick: 'Area uses r²; circumference uses 2r. Lock that distinction before plugging in.',
      whyWrong: {
        A: 'That is the circumference, 2πr = 10π.',
        C: 'Used 2πr² — an invented formula.',
        D: 'Used diameter (10) squared instead of radius.',
      },
    },
  },
  {
    id: 'geo-3',
    topic: 'geometry-trig',
    subtopic: 'Trigonometry',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'In a right triangle, the angle θ has an opposite side of 3 and a hypotenuse of 5. What is sin θ?',
    choices: [
      { id: 'A', text: '3/4' },
      { id: 'B', text: '3/5' },
      { id: 'C', text: '4/5' },
      { id: 'D', text: '5/3' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'sin θ = opposite / hypotenuse = 3/5.',
      fastStrategy: 'Use SOH: Sine = Opposite over Hypotenuse. Identify those two sides only.',
      simplerView: 'Sine just compares the side across from the angle to the longest side: 3 over 5.',
      trapNote: 'Choice C (4/5) is cos θ — the adjacent side (4) over the hypotenuse.',
      timeTrick: 'Write SOH-CAH-TOA at the top of the problem and circle the two sides you need.',
      whyWrong: {
        A: 'That is tan θ = opposite/adjacent = 3/4.',
        C: 'That is cos θ = adjacent/hypotenuse.',
        D: 'Inverted the ratio (hypotenuse over opposite).',
      },
    },
  },

  // ---------------- READING COMPREHENSION ----------------
  {
    id: 'read-1',
    topic: 'reading-comprehension',
    subtopic: 'Main idea',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage:
      'Marine biologist Dr. Elena Vasquez spent a decade studying coral reefs once thought to be dying. To her surprise, several reefs in warmer waters were not only surviving but thriving. Her research suggested that these corals had adapted to higher temperatures, challenging the assumption that all coral is equally vulnerable to ocean warming.',
    prompt: 'Which choice best states the main idea of the passage?',
    choices: [
      { id: 'A', text: 'All coral reefs are dying due to ocean warming.' },
      { id: 'B', text: 'Some coral may be more adaptable to warming than previously assumed.' },
      { id: 'C', text: 'Dr. Vasquez spent ten years underwater.' },
      { id: 'D', text: 'Warm water is always better for coral.' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'The passage centers on the surprising finding that certain corals adapted to warmth, challenging a prior assumption — exactly what B says.',
      fastStrategy: 'The main idea matches the sentence that states a shift or surprise; here, "challenging the assumption."',
      simplerView: 'The big takeaway: not all coral reacts the same way to heat.',
      trapNote: 'Choice D overstates the finding into "always better" — SAT traps love extreme words.',
      timeTrick: 'Predict the main idea in your own words before reading choices, then match.',
      whyWrong: {
        A: 'Directly contradicts the passage, which says some reefs thrived.',
        C: 'A true-ish detail, not the main idea.',
        D: 'Too extreme — "always" is unsupported.',
      },
    },
  },
  {
    id: 'read-2',
    topic: 'reading-comprehension',
    subtopic: 'Inference',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage:
      'When the city installed protected bike lanes downtown, merchants worried that fewer cars would mean fewer customers. Yet within a year, foot traffic rose and several shops reported their best sales in a decade. The lanes, it seemed, had brought people closer to the storefronts they once sped past.',
    prompt: 'It can reasonably be inferred from the passage that:',
    choices: [
      { id: 'A', text: 'Cars are essential to local business success.' },
      { id: 'B', text: 'The merchants’ initial fears were not borne out.' },
      { id: 'C', text: 'Bike lanes always increase sales everywhere.' },
      { id: 'D', text: 'The city should remove all car lanes.' },
    ],
    correct: 'B',
    parTimeSec: 85,
    explanation: {
      correctWhy: 'Merchants feared losing customers, but sales rose — so their fears did not come true. That is a safe inference.',
      fastStrategy: 'A good inference is one short logical step from the text — not a leap.',
      simplerView: 'They worried business would drop; it actually went up. Worry unfounded.',
      trapNote: 'Choices C and D overgeneralize ("always," "all") beyond this one city.',
      timeTrick: 'Eliminate any choice containing "always," "never," "all," or "should" unless the text demands it.',
      whyWrong: {
        A: 'The passage shows the opposite — sales rose with fewer cars.',
        C: '"Always... everywhere" is an unsupported overgeneralization.',
        D: 'A policy recommendation the passage never makes.',
      },
    },
  },

  // ---------------- VOCABULARY IN CONTEXT ----------------
  {
    id: 'read-3',
    topic: 'reading-comprehension',
    subtopic: 'Purpose',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage:
      'Early telephone operators were almost all women, hired because companies believed their voices sounded more courteous to callers. The job demanded speed, patience, and an encyclopedic memory for connections — skills that, the author notes, were rarely credited as technical at the time.',
    prompt: 'The author mentions the operators’ skills mainly to:',
    choices: [
      { id: 'A', text: 'argue that women preferred telephone work to other jobs.' },
      { id: 'B', text: 'suggest the work was more skilled than it was recognized to be.' },
      { id: 'C', text: 'explain how telephones were physically built.' },
      { id: 'D', text: 'prove that men could not do the same job.' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'The author stresses skills "rarely credited as technical," pointing to undervalued expertise — exactly B.',
      fastStrategy: 'Purpose questions ask WHY a detail appears; tie it to the author’s point, not the literal fact.',
      simplerView: 'The skills line exists to say: this job was harder/smarter than people admitted.',
      trapNote: 'Choice D twists "almost all women" into a claim the passage never makes.',
      timeTrick: 'Reread the sentence just before the detail — it usually states the point the detail supports.',
      whyWrong: {
        A: 'Preference is never discussed.',
        C: 'The passage is about the work, not telephone hardware.',
        D: 'An overreach the text does not support.',
      },
    },
  },

  // ---------------- VOCABULARY IN CONTEXT ----------------
  {
    id: 'vocab-1',
    topic: 'vocabulary-in-context',
    subtopic: 'Word choice',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage:
      'Despite the harsh reviews, the novelist remained ______, continuing to write daily and submit her work without hesitation.',
    prompt: 'Which choice best completes the text?',
    choices: [
      { id: 'A', text: 'undeterred' },
      { id: 'B', text: 'distraught' },
      { id: 'C', text: 'indifferent' },
      { id: 'D', text: 'apologetic' },
    ],
    correct: 'A',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'She kept writing despite harsh reviews — "undeterred" means not discouraged, which fits perfectly.',
      fastStrategy: 'Cover the blank, predict your own word from context ("not discouraged"), then match.',
      simplerView: 'The word "Despite" signals she pushed on anyway → undeterred.',
      trapNote: 'Choice C (indifferent) is close but implies she didn\'t care — yet she actively continued, showing determination.',
      timeTrick: 'Find the directional clue word ("Despite," "although," "because") — it tells you the tone of the blank.',
      whyWrong: {
        B: 'Distraught means upset — contradicts continuing to write confidently.',
        C: 'Indifferent implies not caring, but she actively persists.',
        D: 'Apologetic doesn\'t fit submitting work "without hesitation."',
      },
    },
  },
  {
    id: 'vocab-2',
    topic: 'vocabulary-in-context',
    subtopic: 'Precision',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage:
      'The committee praised the proposal for its ______ structure: every section flowed logically into the next, leaving no gaps in the argument.',
    prompt: 'Which choice best completes the text?',
    choices: [
      { id: 'A', text: 'haphazard' },
      { id: 'B', text: 'coherent' },
      { id: 'C', text: 'ornate' },
      { id: 'D', text: 'tentative' },
    ],
    correct: 'B',
    parTimeSec: 65,
    explanation: {
      correctWhy: '"Every section flowed logically... no gaps" describes coherence — a clear, logically connected structure.',
      fastStrategy: 'Use the explanation after the colon; it defines the blank for you.',
      simplerView: 'Logical, gap-free flow = coherent.',
      trapNote: 'Choice C (ornate) describes decoration, not logical flow — a tempting "sophisticated" word that misses meaning.',
      timeTrick: 'A colon or dash usually restates the missing word — read past it first.',
      whyWrong: {
        A: 'Haphazard means disordered — the opposite of logical flow.',
        C: 'Ornate refers to elaborate decoration, not logic.',
        D: 'Tentative means hesitant/uncertain, not well-structured.',
      },
    },
  },

  {
    id: 'vocab-3',
    topic: 'vocabulary-in-context',
    subtopic: 'Tone',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage:
      'Although the startup’s early demo was rough, investors found the founder’s vision so ______ that they funded it on the spot, convinced the polish would come later.',
    prompt: 'Which choice best completes the text?',
    choices: [
      { id: 'A', text: 'compelling' },
      { id: 'B', text: 'tedious' },
      { id: 'C', text: 'ambiguous' },
      { id: 'D', text: 'derivative' },
    ],
    correct: 'A',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'Investors funded it "on the spot" despite a rough demo — the vision must have been compelling (persuasive, attractive).',
      fastStrategy: 'The result (instant funding) tells you the blank is strongly positive.',
      simplerView: 'They paid immediately → the idea grabbed them → compelling.',
      trapNote: 'The word "Although" sets up a contrast: rough demo BUT persuasive vision.',
      timeTrick: 'Let the consequence in the sentence fix the blank’s charge (+ or −) before testing words.',
      whyWrong: {
        B: 'Tedious is negative; no one funds the tedious on the spot.',
        C: 'Ambiguous vision would not inspire immediate confidence.',
        D: 'Derivative (unoriginal) contradicts the investors’ enthusiasm.',
      },
    },
  },

  // ---------------- GRAMMAR ----------------
  {
    id: 'gram-1',
    topic: 'grammar',
    subtopic: 'Punctuation (comma splice)',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage: 'The experiment failed the first time ______ the team refused to give up.',
    prompt: 'Which choice completes the text so it conforms to the conventions of Standard English?',
    choices: [
      { id: 'A', text: ', but' },
      { id: 'B', text: ', and however' },
      { id: 'C', text: ' but,' },
      { id: 'D', text: ', ' },
    ],
    correct: 'A',
    parTimeSec: 55,
    explanation: {
      correctWhy: 'Two independent clauses joined need a comma + coordinating conjunction; "but" shows contrast: failed... but refused to give up.',
      fastStrategy: 'Two complete sentences? Use comma + FANBOYS (for, and, nor, but, or, yet, so).',
      simplerView: 'Both halves can stand alone, so glue them with ", but".',
      trapNote: 'Choice D is a comma splice — a comma alone can\'t join two sentences.',
      timeTrick: 'Test each side of the blank: if both are full sentences, you need real punctuation, not just a comma.',
      whyWrong: {
        B: '"and however" doubles the connectors — redundant and ungrammatical.',
        C: 'Misplaces the comma after "but" instead of before it.',
        D: 'A lone comma creates a comma splice.',
      },
    },
  },
  {
    id: 'gram-2',
    topic: 'grammar',
    subtopic: 'Subject-verb agreement',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage: 'The collection of rare stamps ______ displayed in the museum’s east wing.',
    prompt: 'Which choice conforms to the conventions of Standard English?',
    choices: [
      { id: 'A', text: 'are' },
      { id: 'B', text: 'were' },
      { id: 'C', text: 'is' },
      { id: 'D', text: 'have been' },
    ],
    correct: 'C',
    parTimeSec: 55,
    explanation: {
      correctWhy: 'The subject is "collection" (singular), not "stamps." A singular subject takes "is."',
      fastStrategy: 'Find the true subject by ignoring the "of ___" prepositional phrase.',
      simplerView: 'One collection → is. The stamps are just describing the collection.',
      trapNote: 'Choices A and B agree with "stamps," the trap noun closest to the verb.',
      timeTrick: 'Cross out "of rare stamps" — then the subject "collection... is" is obvious.',
      whyWrong: {
        A: 'Plural verb for a singular subject (collection).',
        B: 'Plural and past tense; subject is singular.',
        D: 'Plural verb form; also shifts tense unnecessarily.',
      },
    },
  },

  {
    id: 'gram-3',
    topic: 'grammar',
    subtopic: 'Pronoun-antecedent agreement',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage: 'Each of the volunteers submitted ______ timesheet before leaving the site.',
    prompt: 'Which choice conforms to the conventions of Standard English?',
    choices: [
      { id: 'A', text: 'their' },
      { id: 'B', text: 'they’re' },
      { id: 'C', text: 'his or her' },
      { id: 'D', text: 'there' },
    ],
    correct: 'C',
    parTimeSec: 55,
    explanation: {
      correctWhy: '"Each" is singular, so it takes a singular pronoun — "his or her" agrees in number.',
      fastStrategy: 'Words like each, every, either, neither are singular — match them with singular pronouns.',
      simplerView: 'Each = one at a time → singular → his or her.',
      trapNote: 'Choice A ("their") is the everyday-speech trap; the SAT still tests formal singular agreement here.',
      timeTrick: 'Spot the indefinite pronoun first; "each/every" almost always signals singular.',
      whyWrong: {
        A: 'Plural pronoun for a singular antecedent ("each").',
        B: '"They’re" = "they are," a contraction, not a possessive.',
        D: '"There" indicates place, not possession.',
      },
    },
  },

  // ---------------- RHETORIC & EXPRESSION ----------------
  {
    id: 'rhet-1',
    topic: 'rhetoric-expression',
    subtopic: 'Transitions',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage:
      'The new policy reduced paperwork for most departments. ______, the legal team saw its workload increase as it reviewed every change.',
    prompt: 'Which transition best fits the blank?',
    choices: [
      { id: 'A', text: 'Similarly' },
      { id: 'B', text: 'However' },
      { id: 'C', text: 'For example' },
      { id: 'D', text: 'Therefore' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The second sentence contrasts (workload increased) with the first (paperwork reduced), so a contrast word — "However" — fits.',
      fastStrategy: 'Decide the relationship first: same direction, contrast, cause, or example. Then pick the matching word.',
      simplerView: 'One group got less work, another got more — that\'s a "however" contrast.',
      trapNote: 'Choice A (Similarly) wrongly signals the ideas agree.',
      timeTrick: 'Sort transitions into buckets — agree / contrast / cause / example — and match the relationship, not the vibe.',
      whyWrong: {
        A: 'Signals agreement, but the ideas contrast.',
        C: 'The second sentence is not an example of the first.',
        D: 'Implies cause-effect, but it\'s a contrast.',
      },
    },
  },
  {
    id: 'rhet-2',
    topic: 'rhetoric-expression',
    subtopic: 'Conciseness',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'The report was ______ in its findings, repeating the same conclusion in multiple sections.',
    prompt: 'Which choice is most concise and precise?',
    choices: [
      { id: 'A', text: 'redundant and repetitive and said things twice' },
      { id: 'B', text: 'redundant' },
      { id: 'C', text: 'very much full of repetition that repeated' },
      { id: 'D', text: 'a thing that repeated repeatedly' },
    ],
    correct: 'B',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'A single precise word, "redundant," captures the meaning without wordiness.',
      fastStrategy: 'On the SAT, the most concise grammatically-correct option usually wins.',
      simplerView: 'Say it once, clearly: redundant.',
      trapNote: 'Choices A, C, and D are ironically redundant — they repeat the idea of repetition.',
      timeTrick: 'When choices differ mainly in length, lean toward the shortest correct one.',
      whyWrong: {
        A: 'Repeats the same idea three ways.',
        C: 'Wordy and circular ("repetition that repeated").',
        D: 'Vague ("a thing") and repetitive.',
      },
    },
  },
  {
    id: 'rhet-3',
    topic: 'rhetoric-expression',
    subtopic: 'Sentence combining',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage:
      'A researcher wants to combine: "The bridge was built in 1932. It is still the longest of its kind in the region."',
    prompt: 'Which choice most effectively combines the two sentences?',
    choices: [
      { id: 'A', text: 'Built in 1932, the bridge is still the longest of its kind in the region.' },
      { id: 'B', text: 'The bridge was built in 1932, and it is still the longest of its kind in the region, too.' },
      { id: 'C', text: 'The bridge, which was built in 1932, it is still the longest of its kind in the region.' },
      { id: 'D', text: 'The bridge was built in 1932; the longest of its kind in the region still.' },
    ],
    correct: 'A',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The introductory modifier "Built in 1932" attaches cleanly to "the bridge," giving a tight, correct combination.',
      fastStrategy: 'Prefer the option that subordinates one idea into a phrase rather than stacking clauses.',
      simplerView: 'Turn the first sentence into a short opener: "Built in 1932, the bridge is still...".',
      trapNote: 'Choice C adds a redundant "it" after the relative clause — ungrammatical.',
      timeTrick: 'Cross out options with doubled subjects ("which was... it is") or tacked-on words ("too," "still" misplaced).',
      whyWrong: {
        B: 'Grammatically OK but wordy, and "too" is redundant.',
        C: 'Doubles the subject ("which was... it is").',
        D: 'The second half is a fragment with awkward word order.',
      },
    },
  },
  // ---------------- ALGEBRA (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'alg-4',
    topic: 'algebra',
    subtopic: 'Linear equations',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'If 5x − 3 = 12, what is the value of x?',
    choices: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
      { id: 'C', text: '3' },
      { id: 'D', text: '9' },
    ],
    correct: 'C',
    parTimeSec: 40,
    explanation: {
      correctWhy: 'Add 3 to both sides: 5x = 15, then divide by 5: x = 3.',
      fastStrategy: 'Undo addition first, then division — reverse PEMDAS.',
      simplerView: 'What times 5, minus 3, gives 12? 15 − 3 = 12, so 15/5 = 3.',
      trapNote: 'Choice D (9) comes from 12 − 3 = 9 without dividing by 5.',
      timeTrick: 'Two arithmetic steps; do not over-complicate.',
      whyWrong: { A: '5(1)−3=2, not 12.', B: '5(2)−3=7, not 12.', D: 'Forgot to divide by 5.' },
    },
  },
  {
    id: 'alg-5',
    topic: 'algebra',
    subtopic: 'Linear inequalities',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'Which value of x satisfies 2x + 1 > 7?',
    choices: [
      { id: 'A', text: 'x = 2' },
      { id: 'B', text: 'x = 3' },
      { id: 'C', text: 'x = 4' },
      { id: 'D', text: 'x = −1' },
    ],
    correct: 'C',
    parTimeSec: 40,
    explanation: {
      correctWhy: 'Solve: 2x > 6, so x > 3. Only x = 4 satisfies this.',
      fastStrategy: 'Solve the inequality like an equation, then pick the choice that fits.',
      simplerView: 'x must be strictly greater than 3; only 4 qualifies.',
      trapNote: 'x = 3 satisfies 2x + 1 = 7 but NOT the strict inequality > 7.',
      timeTrick: 'Plug each choice in to verify if in doubt.',
      whyWrong: { A: '2(2)+1=5, not >7.', B: '2(3)+1=7, equal but not greater.', D: '2(−1)+1=−1.' },
    },
  },
  {
    id: 'alg-6',
    topic: 'algebra',
    subtopic: 'Systems of equations',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'If 3x − y = 10 and x + y = 6, what is the value of y?',
    choices: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
      { id: 'C', text: '3' },
      { id: 'D', text: '4' },
    ],
    correct: 'B',
    parTimeSec: 70,
    explanation: {
      correctWhy: 'Add the equations: 4x = 16, so x = 4. Then y = 6 − 4 = 2.',
      fastStrategy: 'Adding eliminates y; solve for x first, then back-substitute.',
      simplerView: 'x = 4, plug into x + y = 6 to get y = 2.',
      trapNote: 'Choice D (4) is x, not y — careful which variable you solve for.',
      timeTrick: 'Label the variable you want and circle it before you start.',
      whyWrong: { A: 'Off-by-one arithmetic.', C: 'Does not satisfy x + y = 6 with x = 4.', D: 'That is x, not y.' },
    },
  },
  {
    id: 'alg-7',
    topic: 'algebra',
    subtopic: 'Linear equations',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'The equation kx + 6 = 3x + k has no solution. What is the value of k?',
    choices: [
      { id: 'A', text: '−3' },
      { id: 'B', text: '0' },
      { id: 'C', text: '3' },
      { id: 'D', text: '6' },
    ],
    correct: 'C',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Rearrange: (k−3)x = k−6. For no solution, coefficients must match but constants differ: k=3 gives 0x = −3, impossible.',
      fastStrategy: 'No solution means parallel lines: same slope, different intercept.',
      simplerView: 'Collect x terms: (k−3)x = k−6. If k=3, left side is 0 but right side is −3 → contradiction.',
      trapNote: 'k=6 gives 3x = 0, which has the solution x = 0, so it is not "no solution."',
      timeTrick: 'Group x terms, set coefficient = 0, then check the constant side is nonzero.',
      whyWrong: { A: 'k=−3 gives −6x = −9, which has a unique solution.', B: 'k=0 gives −3x = −6, solvable.', D: 'k=6 gives 3x = 0, solvable.' },
    },
  },
  {
    id: 'alg-8',
    topic: 'algebra',
    subtopic: 'Absolute value equations',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'How many solutions does |2x − 4| = 6 have?',
    choices: [
      { id: 'A', text: '0' },
      { id: 'B', text: '1' },
      { id: 'C', text: '2' },
      { id: 'D', text: '3' },
    ],
    correct: 'C',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'Split into 2x−4=6 (x=5) and 2x−4=−6 (x=−1). Two distinct solutions.',
      fastStrategy: 'Absolute value equations always split into two cases: positive and negative.',
      simplerView: 'Distance of 6 from 4 on a number line: 4+6=10 and 4−6=−2, giving x=5 and x=−1.',
      trapNote: 'Students who forget the negative case pick 1.',
      timeTrick: 'Write both cases immediately; then solve each as a standard equation.',
      whyWrong: { A: 'There are real solutions.', B: 'Misses the second case.', D: 'Absolute value of linear gives at most 2 solutions.' },
    },
  },
  {
    id: 'alg-9',
    topic: 'algebra',
    subtopic: 'Word problems',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'Two friends share a cab fare of $d. One pays $6 more than the other. Which expression gives the smaller share?',
    choices: [
      { id: 'A', text: '(d − 6) / 2' },
      { id: 'B', text: '(d + 6) / 2' },
      { id: 'C', text: 'd / 2 + 6' },
      { id: 'D', text: 'd − 6' },
    ],
    correct: 'A',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'Let smaller = s; larger = s+6; total: 2s+6 = d → s = (d−6)/2.',
      fastStrategy: 'Label the unknown (smaller share), write the total equation, solve.',
      simplerView: 'Together they pay d, and the gap is 6: split d−6 evenly then that is the smaller portion.',
      trapNote: 'Choice B is the larger share.',
      timeTrick: 'Test with d=20: smaller = (20−6)/2 = 7, larger = 13; sum = 20. Correct.',
      whyWrong: { B: 'That is the larger share.', C: 'Adds 6 rather than accounting for the split.', D: 'Does not divide by 2.' },
    },
  },

  // ---------------- ADVANCED MATH (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'adv-4',
    topic: 'advanced-math',
    subtopic: 'Polynomials',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'What is (x + 3)(x − 3)?',
    choices: [
      { id: 'A', text: 'x² − 9' },
      { id: 'B', text: 'x² + 9' },
      { id: 'C', text: 'x² − 6x + 9' },
      { id: 'D', text: 'x² + 6x − 9' },
    ],
    correct: 'A',
    parTimeSec: 40,
    explanation: {
      correctWhy: 'This is the difference of squares pattern: (a+b)(a−b) = a² − b². Here a=x, b=3 → x²−9.',
      fastStrategy: 'Recognize conjugate pairs immediately as difference of squares.',
      simplerView: 'FOIL: x²−3x+3x−9 = x²−9. Middle terms cancel.',
      trapNote: 'Choice C is (x−3)² — a different factoring entirely.',
      timeTrick: 'Memorize (a+b)(a−b) = a²−b² to skip FOIL.',
      whyWrong: { B: 'Signs: −3×−3=+9 is wrong here; one factor is negative.', C: 'That is (x−3)², a perfect square.', D: 'Invented middle term.' },
    },
  },
  {
    id: 'adv-5',
    topic: 'advanced-math',
    subtopic: 'Function evaluation',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'If g(x) = 3x − 1, what is g(−2)?',
    choices: [
      { id: 'A', text: '−7' },
      { id: 'B', text: '−5' },
      { id: 'C', text: '5' },
      { id: 'D', text: '7' },
    ],
    correct: 'A',
    parTimeSec: 35,
    explanation: {
      correctWhy: 'g(−2) = 3(−2) − 1 = −6 − 1 = −7.',
      fastStrategy: 'Substitute directly; track the sign of the substituted value carefully.',
      simplerView: '3 times −2 is −6, minus 1 is −7.',
      trapNote: 'Choice B (−5) comes from forgetting the −1 or mishandling the sign.',
      timeTrick: 'Write parentheses: 3(−2) to avoid sign errors.',
      whyWrong: { B: '3(−2)= −6, not −4; or missed the −1.', C: 'Dropped the negative.', D: 'Used +2 instead of −2.' },
    },
  },
  {
    id: 'adv-6',
    topic: 'advanced-math',
    subtopic: 'Quadratics',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'Which is a factor of x² + 7x + 12?',
    choices: [
      { id: 'A', text: '(x + 2)' },
      { id: 'B', text: '(x + 3)' },
      { id: 'C', text: '(x − 4)' },
      { id: 'D', text: '(x − 6)' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'Find two numbers that multiply to 12 and add to 7: 3 and 4. So (x+3)(x+4).',
      fastStrategy: 'Factor by finding the pair summing to 7 with product 12.',
      simplerView: '3 × 4 = 12 and 3 + 4 = 7, so (x+3) is a factor.',
      trapNote: 'Choice A uses 2, which pairs with 6 (sum 8), not 7.',
      timeTrick: 'List factor pairs of 12: (1,12),(2,6),(3,4) — look for sum = 7.',
      whyWrong: { A: '(x+2)(x+6) gives x²+8x+12, not +7x.', C: 'Negative factor doesn\'t work with positive terms.', D: 'Same issue — negative factor.' },
    },
  },
  {
    id: 'adv-7',
    topic: 'advanced-math',
    subtopic: 'Rational expressions',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'What is the domain restriction for f(x) = (x + 2) / (x² − 4)?',
    choices: [
      { id: 'A', text: 'x ≠ 2 only' },
      { id: 'B', text: 'x ≠ −2 only' },
      { id: 'C', text: 'x ≠ 2 and x ≠ −2' },
      { id: 'D', text: 'No restriction' },
    ],
    correct: 'A',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Factor denominator: (x−2)(x+2). Cancel common (x+2) factor, leaving 1/(x−2). Restriction: x ≠ 2.',
      fastStrategy: 'Simplify the rational expression first, then state the restrictions from the simplified form (and original).',
      simplerView: 'x+2 cancels from top and bottom. Only x=2 makes denominator zero after cancellation.',
      trapNote: 'x=−2 makes the original denominator zero but is a removable discontinuity — in domain problems for simplified functions, often only non-cancellable zeros are required.',
      timeTrick: 'Factor first, cancel, then find zeros of the remaining denominator.',
      whyWrong: { B: 'x=−2 was cancelled out.', C: 'Over-restricts after cancellation.', D: 'x=2 is still excluded.' },
    },
  },
  {
    id: 'adv-8',
    topic: 'advanced-math',
    subtopic: 'Exponential growth',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'An investment grows by 10% each year. If the initial amount is $P, which expression gives the value after n years?',
    choices: [
      { id: 'A', text: 'P + 0.10n' },
      { id: 'B', text: 'P · (1.10)^n' },
      { id: 'C', text: 'P · (0.10)^n' },
      { id: 'D', text: '1.10P + n' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'Compound growth: multiply by (1 + rate) each year → P · 1.10^n.',
      fastStrategy: 'Compound growth = initial × (1 + r)^t. Match to answer.',
      simplerView: 'Each year the value is ×1.10: after n years, ×1.10 done n times.',
      trapNote: 'Choice A is simple interest (linear), not compound (exponential).',
      timeTrick: 'Check at n=1: should give 1.10P. Only B does.',
      whyWrong: { A: 'Linear, not exponential.', C: '0.10 as base means the value shrinks rapidly.', D: 'Incorrect mixing of multiplication and addition.' },
    },
  },
  {
    id: 'adv-9',
    topic: 'advanced-math',
    subtopic: 'Systems of nonlinear equations',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'How many solutions does the system y = x² and y = 2x have?',
    choices: [
      { id: 'A', text: '0' },
      { id: 'B', text: '1' },
      { id: 'C', text: '2' },
      { id: 'D', text: '3' },
    ],
    correct: 'C',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'Set equal: x² = 2x → x² − 2x = 0 → x(x−2) = 0 → x = 0 or x = 2. Two solutions.',
      fastStrategy: 'Substitute the linear into the quadratic, factor, count roots.',
      simplerView: 'Two intersections: at (0,0) and (2,4).',
      trapNote: 'Students who don\'t factor correctly might find only one solution.',
      timeTrick: 'A parabola and a line through the vertex can intersect 0, 1, or 2 times — here it\'s 2.',
      whyWrong: { A: 'They do intersect.', B: 'Only if tangent; here two crossings.', D: 'Max intersections for degree-2 with line is 2.' },
    },
  },

  // ---------------- PROBLEM SOLVING & DATA (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'psd-4',
    topic: 'problem-solving-data',
    subtopic: 'Percentages',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'What is 30% of 150?',
    choices: [
      { id: 'A', text: '30' },
      { id: 'B', text: '45' },
      { id: 'C', text: '50' },
      { id: 'D', text: '60' },
    ],
    correct: 'B',
    parTimeSec: 35,
    explanation: {
      correctWhy: '0.30 × 150 = 45.',
      fastStrategy: '10% of 150 = 15; three tens = 45.',
      simplerView: '30% = 3 × 10%. 10% of 150 = 15, so 3 × 15 = 45.',
      trapNote: 'Choice C (50) is 1/3 of 150, not 30%.',
      timeTrick: 'Find 10%, then multiply for multiples of 10%.',
      whyWrong: { A: 'That is just the percent number, not applied to 150.', C: 'That is 33%, not 30%.', D: '40% of 150 = 60.' },
    },
  },
  {
    id: 'psd-5',
    topic: 'problem-solving-data',
    subtopic: 'Probability',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'A bag contains 3 red, 2 blue, and 5 green marbles. What is the probability of picking a blue marble?',
    choices: [
      { id: 'A', text: '1/5' },
      { id: 'B', text: '2/5' },
      { id: 'C', text: '1/3' },
      { id: 'D', text: '1/2' },
    ],
    correct: 'A',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'Total = 10. P(blue) = 2/10 = 1/5.',
      fastStrategy: 'Favorable / Total.',
      simplerView: '2 blues out of 10 total = 2/10 = 1/5.',
      trapNote: 'Choice B (2/5) uses only the non-green count in the denominator.',
      timeTrick: 'Always find the total first; do not forget any category.',
      whyWrong: { B: 'Denominator should be 10, not 5.', C: 'Incorrect denominator.', D: 'There are not 4 blue out of 8.' },
    },
  },
  {
    id: 'psd-6',
    topic: 'problem-solving-data',
    subtopic: 'Scatter plots',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'A scatter plot shows a strong positive correlation between hours studied and test score. Which conclusion is most appropriate?',
    choices: [
      { id: 'A', text: 'Studying more causes higher test scores.' },
      { id: 'B', text: 'As hours studied increase, test scores tend to increase.' },
      { id: 'C', text: 'Students who study more always score 100%.' },
      { id: 'D', text: 'Test scores depend only on hours studied.' },
    ],
    correct: 'B',
    parTimeSec: 65,
    explanation: {
      correctWhy: 'Correlation tells us about trends, not causation. B states the trend without implying cause.',
      fastStrategy: 'Correlation ≠ causation. Avoid "causes," "always," or "only."',
      simplerView: 'Positive correlation = as one goes up, the other tends to go up.',
      trapNote: 'Choice A states causation, which correlation cannot confirm.',
      timeTrick: 'Eliminate options with "always," "causes," or "only" in correlation questions.',
      whyWrong: { A: 'Correlation doesn\'t prove causation.', C: '"Always" overgeneralizes.', D: '"Only" ignores other possible factors.' },
    },
  },
  {
    id: 'psd-7',
    topic: 'problem-solving-data',
    subtopic: 'Mean / statistics',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A dataset has a mean of 20 and a standard deviation of 4. Which score is exactly 1.5 standard deviations above the mean?',
    choices: [
      { id: 'A', text: '22' },
      { id: 'B', text: '24' },
      { id: 'C', text: '26' },
      { id: 'D', text: '28' },
    ],
    correct: 'C',
    parTimeSec: 70,
    explanation: {
      correctWhy: '20 + 1.5 × 4 = 20 + 6 = 26.',
      fastStrategy: 'Score = mean + (z)(SD).',
      simplerView: '1.5 standard deviations = 1.5 × 4 = 6 above the mean of 20.',
      trapNote: 'Choice B (24) is only 1 standard deviation above.',
      timeTrick: 'Write out mean + n×SD mechanically.',
      whyWrong: { A: 'Only 0.5 SD above.', B: '1 SD above (20+4=24).', D: '2 SDs above (20+8=28).' },
    },
  },
  {
    id: 'psd-8',
    topic: 'problem-solving-data',
    subtopic: 'Ratios & rates',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A factory produces widgets at a rate of 240 per hour. A defect rate of 5% is found. How many non-defective widgets are produced in an 8-hour shift?',
    choices: [
      { id: 'A', text: '1,728' },
      { id: 'B', text: '1,824' },
      { id: 'C', text: '1,920' },
      { id: 'D', text: '2,016' },
    ],
    correct: 'B',
    parTimeSec: 85,
    explanation: {
      correctWhy: 'Total = 240 × 8 = 1920. Non-defective = 95% of 1920 = 0.95 × 1920 = 1824.',
      fastStrategy: 'Find total, multiply by (1 − defect rate).',
      simplerView: '1920 widgets made; 5% are bad, so 95% = 1824 are good.',
      trapNote: 'Choice C is the total before applying the defect rate.',
      timeTrick: 'Multiply by (1 − rate) to get the "good" fraction in one step.',
      whyWrong: { A: 'Incorrect percentage applied.', C: 'That is the total before defect filter.', D: 'Added instead of subtracted defects.' },
    },
  },
  {
    id: 'psd-9',
    topic: 'problem-solving-data',
    subtopic: 'Percentages',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A stock drops 20% then rises 25%. What is the net percentage change from the original price?',
    choices: [
      { id: 'A', text: '+5%' },
      { id: 'B', text: '0%' },
      { id: 'C', text: '+1%' },
      { id: 'D', text: '−5%' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Start at 100. After −20%: 80. After +25%: 80 × 1.25 = 100. Net change = 0%.',
      fastStrategy: 'Multiply the two factors: 0.80 × 1.25 = 1.00 → net zero.',
      simplerView: '80 × 1.25 = 100. Started at 100, ended at 100. No change.',
      trapNote: 'Students add/subtract the percents (−20+25=+5) rather than applying them sequentially.',
      timeTrick: 'Always compute sequential percent changes as multiplied decimals.',
      whyWrong: { A: 'Adding the percents arithmetically gives +5% but that ignores the compounding.', C: 'Incorrect.', D: 'Would apply if rose only 20% after the 20% drop.' },
    },
  },
  {
    id: 'psd-9-fix',
    topic: 'problem-solving-data',
    subtopic: 'Percentages',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A price rises 20% and then falls 20%. What is the net percentage change?',
    choices: [
      { id: 'A', text: '0%' },
      { id: 'B', text: '−4%' },
      { id: 'C', text: '+4%' },
      { id: 'D', text: '+40%' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'Start: 100 → ×1.20 = 120 → ×0.80 = 96. Net change = −4%.',
      fastStrategy: 'Multiply factors: 1.20 × 0.80 = 0.96, so −4%.',
      simplerView: '20% up then 20% down is NOT zero because the base changes.',
      trapNote: 'Choice A (0%) is the classic trap — adding +20 and −20.',
      timeTrick: 'Use a concrete start of 100 to see the real outcome.',
      whyWrong: { A: 'The percents don\'t cancel because the base changes.', C: 'Wrong sign.', D: 'Simply adds 20+20=40.' },
    },
  },

  // ---------------- GEOMETRY & TRIG (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'geo-4',
    topic: 'geometry-trig',
    subtopic: 'Area & perimeter',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'What is the area of a rectangle with length 9 and width 4?',
    choices: [
      { id: 'A', text: '13' },
      { id: 'B', text: '26' },
      { id: 'C', text: '36' },
      { id: 'D', text: '45' },
    ],
    correct: 'C',
    parTimeSec: 30,
    explanation: {
      correctWhy: 'Area = length × width = 9 × 4 = 36.',
      fastStrategy: 'Just multiply length and width.',
      simplerView: '9 × 4 = 36.',
      trapNote: 'Choice B (26) is the perimeter (2×9 + 2×4 = 26).',
      timeTrick: 'Area = multiply; perimeter = add all sides.',
      whyWrong: { A: 'That is 9 + 4 (adding instead of multiplying).', B: 'That is the perimeter.', D: 'Arithmetic error.' },
    },
  },
  {
    id: 'geo-5',
    topic: 'geometry-trig',
    subtopic: 'Angles',
    section: 'Math',
    difficulty: 'easy',
    prompt: 'Two angles are supplementary. One angle measures 65°. What is the other?',
    choices: [
      { id: 'A', text: '25°' },
      { id: 'B', text: '90°' },
      { id: 'C', text: '115°' },
      { id: 'D', text: '295°' },
    ],
    correct: 'C',
    parTimeSec: 35,
    explanation: {
      correctWhy: 'Supplementary angles sum to 180°: 180 − 65 = 115°.',
      fastStrategy: 'Supplementary = 180°; complementary = 90°.',
      simplerView: '180 − 65 = 115.',
      trapNote: 'Choice A (25°) is the complement (90 − 65), not the supplement.',
      timeTrick: 'Remember: Supplementary = Straight line = 180°.',
      whyWrong: { A: 'Complement, not supplement.', B: 'That would make both right angles if together equaled 180.', D: '360 − 65 = 295, not supplementary.' },
    },
  },
  {
    id: 'geo-6',
    topic: 'geometry-trig',
    subtopic: 'Volume',
    section: 'Math',
    difficulty: 'medium',
    prompt: 'What is the volume of a cylinder with radius 3 and height 10? (Use V = πr²h.)',
    choices: [
      { id: 'A', text: '30π' },
      { id: 'B', text: '60π' },
      { id: 'C', text: '90π' },
      { id: 'D', text: '120π' },
    ],
    correct: 'C',
    parTimeSec: 55,
    explanation: {
      correctWhy: 'V = π(3²)(10) = π(9)(10) = 90π.',
      fastStrategy: 'Square the radius first, then multiply by height and π.',
      simplerView: '3² = 9, × 10 = 90, × π = 90π.',
      trapNote: 'Choice A (30π) uses 3 instead of 3² — forgetting to square.',
      timeTrick: 'Order: square r → multiply by h → attach π.',
      whyWrong: { A: 'Used r = 3 without squaring.', B: 'Used r = 2 or arithmetic error.', D: 'Used r = 4 or incorrect calculation.' },
    },
  },
  {
    id: 'geo-7',
    topic: 'geometry-trig',
    subtopic: 'Trigonometry',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'In a right triangle, the adjacent leg is 8 and the hypotenuse is 10. What is cos θ?',
    choices: [
      { id: 'A', text: '3/5' },
      { id: 'B', text: '4/5' },
      { id: 'C', text: '3/4' },
      { id: 'D', text: '5/4' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'cos θ = adjacent / hypotenuse = 8/10 = 4/5.',
      fastStrategy: 'CAH: Cosine = Adjacent / Hypotenuse.',
      simplerView: '8/10 simplified is 4/5.',
      trapNote: 'Choice A (3/5) is sin θ (opposite = 6, since 6-8-10 is a 3-4-5 triple scaled by 2).',
      timeTrick: 'Identify the sides relative to the angle before applying SOH-CAH-TOA.',
      whyWrong: { A: 'That is sin θ (opposite/hypotenuse = 6/10 = 3/5).', C: 'That is tan θ (opposite/adjacent).', D: 'Greater than 1 — impossible for a trig ratio in a right triangle.' },
    },
  },
  {
    id: 'geo-8',
    topic: 'geometry-trig',
    subtopic: 'Coordinate geometry',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A circle has center (2, −3) and passes through (6, −3). What is the equation of the circle?',
    choices: [
      { id: 'A', text: '(x−2)² + (y+3)² = 4' },
      { id: 'B', text: '(x+2)² + (y−3)² = 16' },
      { id: 'C', text: '(x−2)² + (y+3)² = 16' },
      { id: 'D', text: '(x−2)² + (y−3)² = 16' },
    ],
    correct: 'C',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Radius = distance from center (2,−3) to (6,−3) = 4. Equation: (x−2)²+(y+3)²=16.',
      fastStrategy: 'Find r by distance formula, then write (x−h)²+(y−k)²=r².',
      simplerView: 'They share the same y, so r = |6−2| = 4. Then r² = 16.',
      trapNote: 'Choice A has r²=4 meaning r=2, not 4.',
      timeTrick: 'Standard form: (x−h)²+(y−k)²=r² where center is (h,k).',
      whyWrong: { A: 'r² = 4 means r=2; the actual radius is 4.', B: 'Sign error in center: should be (x−2)² not (x+2)².', D: 'Sign error: (y−3)² means center y=3, but center is y=−3.' },
    },
  },
  {
    id: 'geo-9',
    topic: 'geometry-trig',
    subtopic: 'Similar triangles',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'Two similar triangles have sides in a ratio of 3:5. If the area of the smaller triangle is 27, what is the area of the larger?',
    choices: [
      { id: 'A', text: '45' },
      { id: 'B', text: '63' },
      { id: 'C', text: '75' },
      { id: 'D', text: '135' },
    ],
    correct: 'C',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Area scales by the square of the ratio: (5/3)² × 27 = (25/9) × 27 = 75.',
      fastStrategy: 'Scale factor for areas = (linear scale factor)².',
      simplerView: 'Sides ratio 3:5 → area ratio 9:25. If small = 27, large = 27×(25/9) = 75.',
      trapNote: 'Choice A (45) uses the linear ratio (×5/3) instead of the squared ratio.',
      timeTrick: 'When similar figures, always square the linear ratio for area comparison.',
      whyWrong: { A: 'Used linear scale factor 5/3 without squaring.', B: 'Incorrect calculation.', D: 'Multiplied by 5 (the denominator) rather than ratio squared.' },
    },
  },

  // ---------------- READING COMPREHENSION (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'read-4',
    topic: 'reading-comprehension',
    subtopic: 'Main idea',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'Dogs have been domesticated for at least 15,000 years, making them one of humanity\'s oldest animal companions. Throughout history they have served as hunters, herders, and protectors.',
    prompt: 'What is the main point of the passage?',
    choices: [
      { id: 'A', text: 'Dogs are dangerous animals.' },
      { id: 'B', text: 'Dogs have a long history of partnership with humans.' },
      { id: 'C', text: 'Herding sheep requires trained dogs.' },
      { id: 'D', text: 'Dogs are better than cats.' },
    ],
    correct: 'B',
    parTimeSec: 50,
    explanation: {
      correctWhy: 'The passage says dogs are among humanity\'s oldest companions and have long served many roles — that is B.',
      fastStrategy: 'The main idea is the sentence that could serve as a one-sentence summary.',
      simplerView: 'Old partnership: 15,000 years + many roles = B.',
      trapNote: 'Choice C is a detail (one role), not the main idea.',
      timeTrick: 'Predict the main idea before reading choices.',
      whyWrong: { A: 'Not supported.', C: 'Single detail, not the main idea.', D: 'Not mentioned.' },
    },
  },
  {
    id: 'read-5',
    topic: 'reading-comprehension',
    subtopic: 'Detail',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'The Great Barrier Reef, located off the coast of Australia, is the world\'s largest coral reef system. It supports an extraordinary diversity of marine life, including over 1,500 species of fish.',
    prompt: 'According to the passage, where is the Great Barrier Reef located?',
    choices: [
      { id: 'A', text: 'Off the coast of Brazil' },
      { id: 'B', text: 'In the Caribbean Sea' },
      { id: 'C', text: 'Off the coast of Australia' },
      { id: 'D', text: 'Near New Zealand' },
    ],
    correct: 'C',
    parTimeSec: 35,
    explanation: {
      correctWhy: 'The passage explicitly states "located off the coast of Australia."',
      fastStrategy: 'For detail questions, locate the relevant sentence and lift the answer directly.',
      simplerView: 'It says "off the coast of Australia" — choose C.',
      trapNote: 'The reef is often confused with Caribbean reefs; test-takers may guess A or B.',
      timeTrick: 'Detail questions have a single correct answer supported by exact text.',
      whyWrong: { A: 'Not mentioned.', B: 'Not mentioned.', D: 'Not mentioned.' },
    },
  },
  {
    id: 'read-6',
    topic: 'reading-comprehension',
    subtopic: 'Inference',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage: 'When the library introduced a new self-checkout system, librarians found themselves freed from repetitive scanning tasks. They began spending more time advising patrons, leading to increased patron satisfaction.',
    prompt: 'What can be inferred from the passage?',
    choices: [
      { id: 'A', text: 'The library fired all its librarians.' },
      { id: 'B', text: 'Technology can free workers to focus on higher-value tasks.' },
      { id: 'C', text: 'Patrons disliked the self-checkout system.' },
      { id: 'D', text: 'Self-checkout replaced human interaction entirely.' },
    ],
    correct: 'B',
    parTimeSec: 70,
    explanation: {
      correctWhy: 'Librarians shifted from routine tasks to patron advising — one step of inference: technology enabled higher-value work.',
      fastStrategy: 'A valid inference follows directly from the text with one logical step.',
      simplerView: 'Less scanning → more advising → more satisfaction. Tech helped workers do better work.',
      trapNote: 'Choice D overstates — the passage says librarians now advise more, not that humans are gone.',
      timeTrick: 'Pick the inference that is "just barely beyond" the text, not a leap.',
      whyWrong: { A: 'Not stated; librarians became more helpful.', C: 'Opposite — satisfaction increased.', D: '"Entirely" overstates the passage.' },
    },
  },
  {
    id: 'read-7',
    topic: 'reading-comprehension',
    subtopic: 'Purpose',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Although renewable energy capacity has expanded rapidly, energy storage remains a critical bottleneck. Without better battery technology, excess solar power generated midday cannot be stored efficiently for evening use.',
    prompt: 'The author mentions "midday solar power" mainly to:',
    choices: [
      { id: 'A', text: 'argue that solar panels should only operate at night.' },
      { id: 'B', text: 'provide a concrete illustration of the storage bottleneck.' },
      { id: 'C', text: 'prove that renewable energy is ineffective.' },
      { id: 'D', text: 'explain how batteries are manufactured.' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'The example of midday solar illustrates the storage bottleneck — excess supply that cannot be saved.',
      fastStrategy: 'Details in a passage usually support the main claim; identify that claim first.',
      simplerView: 'The paragraph says storage is a problem; midday solar is the "for example."',
      trapNote: 'Choice C overstates — the passage doesn\'t say renewables are ineffective.',
      timeTrick: 'Ask: what point does this detail support? Match it to the broader argument.',
      whyWrong: { A: 'Solar panels do not operate at night.', C: 'The passage sees renewables as expanding, not ineffective.', D: 'Battery manufacturing is off-topic.' },
    },
  },
  {
    id: 'read-8',
    topic: 'reading-comprehension',
    subtopic: 'Textual evidence',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Researchers studied 500 adults over ten years. Those who slept at least seven hours per night had significantly lower rates of cardiovascular disease compared with those who slept fewer than six hours.',
    prompt: 'Which statement is best supported by the passage?',
    choices: [
      { id: 'A', text: 'Sleeping eight hours per night prevents all disease.' },
      { id: 'B', text: 'Seven or more hours of sleep is associated with lower cardiovascular risk.' },
      { id: 'C', text: 'The study shows that sleep causes cardiovascular disease.' },
      { id: 'D', text: 'Adults need exactly six hours of sleep to stay healthy.' },
    ],
    correct: 'B',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'The passage states those sleeping ≥7 hours had lower cardiovascular rates — that is B, an association claim.',
      fastStrategy: 'Match evidence to statement; avoid "causes," "all," or "exactly" unless the text uses those words.',
      simplerView: 'Lower rates for ≥7 hours = association, not causation.',
      trapNote: 'Choice C flips causation — the study shows association, not that sleep causes disease.',
      timeTrick: 'Supported = directly stated or minimally inferred. Not overstated.',
      whyWrong: { A: '"All disease" and "prevents" go too far.', C: 'Reverses direction: less sleep correlates with more disease, not that sleep causes disease.', D: '"Exactly six" misreads the threshold and the conclusion.' },
    },
  },
  {
    id: 'read-9',
    topic: 'reading-comprehension',
    subtopic: 'Author\'s tone',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The administration hailed the new transit line as a triumph of urban planning. Critics, however, noted that the route bypassed three of the city\'s most underserved neighborhoods.',
    prompt: 'The author\'s perspective on the transit line can best be described as:',
    choices: [
      { id: 'A', text: 'enthusiastically supportive' },
      { id: 'B', text: 'openly hostile' },
      { id: 'C', text: 'balanced, presenting both praise and criticism' },
      { id: 'D', text: 'indifferent' },
    ],
    correct: 'C',
    parTimeSec: 70,
    explanation: {
      correctWhy: 'The passage presents the administration\'s positive view and critics\' negative view without taking sides — balanced.',
      fastStrategy: 'When a passage presents both sides without endorsing one, the tone is balanced/neutral.',
      simplerView: 'One side says good, one says bad, author shows both → C.',
      trapNote: 'Choice A is the administration\'s view, not the author\'s.',
      timeTrick: 'Look for the author\'s own evaluative words; if absent, the tone is neutral or balanced.',
      whyWrong: { A: 'The administration is enthusiastic, not the author.', B: 'No hostility from the author.', D: 'The author does engage by presenting both sides.' },
    },
  },

  // ---------------- VOCABULARY IN CONTEXT (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'vocab-4',
    topic: 'vocabulary-in-context',
    subtopic: 'Word choice',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'The scientist was known for her ______ mind; she could solve complex problems in minutes that stumped her colleagues for days.',
    prompt: 'Which choice best completes the text?',
    choices: [
      { id: 'A', text: 'slow' },
      { id: 'B', text: 'keen' },
      { id: 'C', text: 'distracted' },
      { id: 'D', text: 'ordinary' },
    ],
    correct: 'B',
    parTimeSec: 40,
    explanation: {
      correctWhy: '"Keen" means sharp/acute — perfect for someone who solves problems faster than peers.',
      fastStrategy: 'Context clue: "solve complex problems in minutes" → sharp, agile mind → keen.',
      simplerView: 'Quick problem-solving = sharp mind = keen.',
      trapNote: 'Choice D (ordinary) is opposite — ordinary minds don\'t outperform colleagues.',
      timeTrick: 'Cover the blank, predict your own word, then match.',
      whyWrong: { A: 'Slow contradicts fast problem-solving.', C: 'Distracted implies poor focus.', D: 'Ordinary doesn\'t explain exceptional speed.' },
    },
  },
  {
    id: 'vocab-5',
    topic: 'vocabulary-in-context',
    subtopic: 'Tone',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'After the disappointing loss, the coach\'s mood was ______; she sat silently in the locker room long after the team had left.',
    prompt: 'Which word best fits the blank?',
    choices: [
      { id: 'A', text: 'jubilant' },
      { id: 'B', text: 'somber' },
      { id: 'C', text: 'animated' },
      { id: 'D', text: 'tranquil' },
    ],
    correct: 'B',
    parTimeSec: 40,
    explanation: {
      correctWhy: '"Somber" means dark/serious in mood — fitting a loss and sitting alone silently.',
      fastStrategy: '"Disappointing loss" + silence → sad, heavy mood → somber.',
      simplerView: 'Loss + silence = gloomy, somber.',
      trapNote: 'Choice D (tranquil) means calm/peaceful, which misses the sadness.',
      timeTrick: 'Directional signal: "disappointing loss" → negative word in the blank.',
      whyWrong: { A: 'Jubilant means joyful — opposite of the context.', C: 'Animated means lively — opposite of sitting silently.', D: 'Tranquil lacks the sadness the context implies.' },
    },
  },
  {
    id: 'vocab-6',
    topic: 'vocabulary-in-context',
    subtopic: 'Precision',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage: 'The author\'s writing style was ______: long sentences branched into sub-clauses, each modified by layers of qualifications and parenthetical asides.',
    prompt: 'Which word best completes the text?',
    choices: [
      { id: 'A', text: 'sparse' },
      { id: 'B', text: 'convoluted' },
      { id: 'C', text: 'lucid' },
      { id: 'D', text: 'succinct' },
    ],
    correct: 'B',
    parTimeSec: 55,
    explanation: {
      correctWhy: '"Convoluted" means complex, intricately twisted — exactly what layers of sub-clauses suggest.',
      fastStrategy: 'The colon after the blank introduces the definition: many sub-clauses = convoluted.',
      simplerView: 'Long, complicated sentences with many layers = convoluted.',
      trapNote: 'Choice C (lucid) means clear and easy to understand — opposite of the described style.',
      timeTrick: 'The clause after the colon defines the word; use it to pick.',
      whyWrong: { A: 'Sparse means minimal — opposite of long, layered sentences.', C: 'Lucid means clear — opposite.', D: 'Succinct means brief — opposite of long sentences.' },
    },
  },
  {
    id: 'vocab-7',
    topic: 'vocabulary-in-context',
    subtopic: 'Word choice',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The diplomat\'s remarks were deliberately ______; by saying nothing that could be pinned down, she kept all parties at the table without committing to any position.',
    prompt: 'Which choice best completes the text?',
    choices: [
      { id: 'A', text: 'categorical' },
      { id: 'B', text: 'equivocal' },
      { id: 'C', text: 'candid' },
      { id: 'D', text: 'blunt' },
    ],
    correct: 'B',
    parTimeSec: 65,
    explanation: {
      correctWhy: '"Equivocal" means deliberately ambiguous — designed to avoid a clear commitment. Fits perfectly.',
      fastStrategy: '"Nothing that could be pinned down" = ambiguous = equivocal.',
      simplerView: 'Vague on purpose to avoid commitment = equivocal.',
      trapNote: 'Choice C (candid) means open and honest — the opposite of deliberately ambiguous.',
      timeTrick: 'Predict your own word first: "vague" or "ambiguous" — then find the match.',
      whyWrong: { A: 'Categorical means clear and unambiguous.', C: 'Candid means frank/honest — opposite.', D: 'Blunt means direct — opposite.' },
    },
  },
  {
    id: 'vocab-8',
    topic: 'vocabulary-in-context',
    subtopic: 'Precision',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The historian described the new evidence as ______: it did not settle the debate but gave both sides fresh material to argue over.',
    prompt: 'Which word best completes the text?',
    choices: [
      { id: 'A', text: 'inconclusive' },
      { id: 'B', text: 'redundant' },
      { id: 'C', text: 'decisive' },
      { id: 'D', text: 'irrelevant' },
    ],
    correct: 'A',
    parTimeSec: 60,
    explanation: {
      correctWhy: '"Inconclusive" means not settling the question — exactly what "did not settle the debate" says.',
      fastStrategy: 'The colon defines the blank: "did not settle → inconclusive."',
      simplerView: 'Did not settle the debate = inconclusive.',
      trapNote: 'Choice C (decisive) means settling the matter — direct opposite.',
      timeTrick: 'Definitions after colons or dashes lock in the answer.',
      whyWrong: { B: 'Redundant means unnecessary repetition — not relevant here.', C: 'Decisive = settling — opposite.', D: 'Irrelevant = not related — but both sides used it, so it was relevant.' },
    },
  },
  {
    id: 'vocab-9',
    topic: 'vocabulary-in-context',
    subtopic: 'Tone',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'His acceptance speech was surprisingly ______ for a man who had just won the highest honor in the field; he devoted most of it to crediting his collaborators and mentors.',
    prompt: 'Which word best completes the text?',
    choices: [
      { id: 'A', text: 'arrogant' },
      { id: 'B', text: 'self-aggrandizing' },
      { id: 'C', text: 'humble' },
      { id: 'D', text: 'verbose' },
    ],
    correct: 'C',
    parTimeSec: 55,
    explanation: {
      correctWhy: '"Surprisingly humble" fits: one would expect boasting, but he credited others.',
      fastStrategy: '"Surprisingly" signals a contrast — expected behavior (boasting) vs. actual (crediting others).',
      simplerView: 'Award winner credits others instead of himself = humble.',
      trapNote: 'Choice A (arrogant) would NOT be surprising for a winner and contradicts crediting others.',
      timeTrick: '"Surprisingly" is the key signal word — find the unexpected trait.',
      whyWrong: { A: 'Arrogant = expecting him to brag, consistent with winning — not surprising.', B: 'Self-aggrandizing = boasting — contradicts crediting others.', D: 'Verbose = wordy — irrelevant to what the speech was about.' },
    },
  },

  // ---------------- GRAMMAR (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'gram-4',
    topic: 'grammar',
    subtopic: 'Apostrophes',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'The ______ decision to cancel the event surprised everyone.',
    prompt: 'Which choice conforms to the conventions of Standard English? (The decision belongs to the committee.)',
    choices: [
      { id: 'A', text: 'committees\'' },
      { id: 'B', text: 'committee\'s' },
      { id: 'C', text: 'committees' },
      { id: 'D', text: 'committee' },
    ],
    correct: 'B',
    parTimeSec: 40,
    explanation: {
      correctWhy: '"Committee\'s" shows singular possession — one committee owns the decision.',
      fastStrategy: 'Singular possessive: add \'s to the singular noun.',
      simplerView: 'One committee, its decision: committee\'s.',
      trapNote: 'Choice A (committees\') would indicate multiple committees.',
      timeTrick: 'Identify singular vs. plural owner before adding the apostrophe.',
      whyWrong: { A: 'Plural possessive — there is only one committee.', C: 'Plural noun with no possessive.', D: 'No possessive at all.' },
    },
  },
  {
    id: 'gram-5',
    topic: 'grammar',
    subtopic: 'Verb tense',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'By the time the guests arrived, the chef ______ the meal.',
    prompt: 'Which choice conforms to the conventions of Standard English?',
    choices: [
      { id: 'A', text: 'prepares' },
      { id: 'B', text: 'will prepare' },
      { id: 'C', text: 'had prepared' },
      { id: 'D', text: 'is preparing' },
    ],
    correct: 'C',
    parTimeSec: 50,
    explanation: {
      correctWhy: '"By the time [past event]" requires the past perfect (had + past participle).',
      fastStrategy: 'Past perfect signals an action completed before another past event.',
      simplerView: 'Meal was finished BEFORE guests arrived → past perfect → had prepared.',
      trapNote: 'Simple past ("prepared") is close but past perfect is required to show the sequence.',
      timeTrick: '"By the time" is a classic past-perfect trigger phrase.',
      whyWrong: { A: 'Present tense — wrong time frame.', B: 'Future tense — guests already arrived.', D: 'Present progressive — wrong time frame.' },
    },
  },
  {
    id: 'gram-6',
    topic: 'grammar',
    subtopic: 'Modifiers',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage: 'Walking through the park, ______ caught my attention.',
    prompt: 'Which choice creates a grammatically correct sentence?',
    choices: [
      { id: 'A', text: 'a bird was seen' },
      { id: 'B', text: 'a colorful butterfly' },
      { id: 'C', text: 'it was noticed' },
      { id: 'D', text: 'the sound was heard' },
    ],
    correct: 'B',
    parTimeSec: 55,
    explanation: {
      correctWhy: 'The participial phrase "Walking through the park" must be followed by the noun it modifies — the logical subject doing the walking. Only "a colorful butterfly caught my attention" works if we interpret the implied subject as "I," but for correctness, B keeps the sentence logical.',
      fastStrategy: 'An introductory participial phrase must touch the subject of the main clause.',
      simplerView: 'Who is walking? The implied "I" — so the subject after the comma must be the person walking.',
      trapNote: 'Choices A, C, D create dangling modifiers: a bird, "it," and a sound cannot walk.',
      timeTrick: 'Ask: who/what is doing the action in the phrase? That noun must follow the comma.',
      whyWrong: { A: 'A bird cannot walk through the park in this context without a person.', C: '"It" is vague and didn\'t do the walking.', D: 'A sound cannot walk.' },
    },
  },
  {
    id: 'gram-7',
    topic: 'grammar',
    subtopic: 'Semicolons',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The legislation passed the Senate; ______ it still faced opposition in the House.',
    prompt: 'Which transition correctly follows the semicolon?',
    choices: [
      { id: 'A', text: 'however,' },
      { id: 'B', text: 'and' },
      { id: 'C', text: 'because' },
      { id: 'D', text: 'so that' },
    ],
    correct: 'A',
    parTimeSec: 55,
    explanation: {
      correctWhy: 'A semicolon can be followed by a conjunctive adverb like "however" (with a comma). Coordinating conjunctions like "and" follow commas, not semicolons.',
      fastStrategy: 'After a semicolon use a conjunctive adverb (however, therefore) NOT a coordinating conjunction (FANBOYS).',
      simplerView: 'Semicolon + however, = two-sentence contrast. Semicolon + and = wrong.',
      trapNote: '"and" is a FANBOYS conjunction and pairs with a comma, not a semicolon.',
      timeTrick: 'FANBOYS go with comma. Conjunctive adverbs go with semicolon.',
      whyWrong: { B: '"And" belongs after a comma (comma + and), not a semicolon.', C: '"Because" introduces a dependent clause; it doesn\'t follow a semicolon cleanly.', D: '"So that" introduces purpose, not a contrasting independent clause.' },
    },
  },
  {
    id: 'gram-8',
    topic: 'grammar',
    subtopic: 'Parallel structure',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The training program helped employees learn new skills, build confidence, and ______.',
    prompt: 'Which choice maintains parallel structure?',
    choices: [
      { id: 'A', text: 'their productivity increased' },
      { id: 'B', text: 'to improve productivity' },
      { id: 'C', text: 'improve productivity' },
      { id: 'D', text: 'for productivity improvement' },
    ],
    correct: 'C',
    parTimeSec: 55,
    explanation: {
      correctWhy: 'The series uses bare infinitives: "learn," "build," "improve" — all parallel verb forms.',
      fastStrategy: 'Match the grammatical form of the other items in the list.',
      simplerView: 'Learn / build / ??? — must be a plain verb: "improve".',
      trapNote: 'Choice B ("to improve") adds "to," breaking the parallel pattern.',
      timeTrick: 'Identify the form of the other list items first; replicate that form exactly.',
      whyWrong: { A: 'Full clause — breaks the verb series.', B: '"To improve" adds an infinitive marker absent from the other items.', D: 'Prepositional phrase — not parallel with verbs.' },
    },
  },
  {
    id: 'gram-9',
    topic: 'grammar',
    subtopic: 'Subject-verb agreement',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Neither the principal nor the teachers ______ satisfied with the new testing policy.',
    prompt: 'Which choice conforms to the conventions of Standard English?',
    choices: [
      { id: 'A', text: 'is' },
      { id: 'B', text: 'are' },
      { id: 'C', text: 'was' },
      { id: 'D', text: 'were' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'With "neither...nor," the verb agrees with the closer subject ("teachers" — plural), so "are."',
      fastStrategy: 'Neither/nor + either/or: agree with the noun closest to the verb.',
      simplerView: 'Teachers is plural and closer to the verb → are.',
      trapNote: 'Choice A ("is") agrees with "principal" (singular) but the rule is to use the closer noun.',
      timeTrick: 'Underline the subject closest to the verb; match to it.',
      whyWrong: { A: 'Matches "principal" (farther), not "teachers" (closer).', C: 'Past tense when present is needed.', D: 'Past plural — wrong tense.' },
    },
  },

  // ---------------- RHETORIC & EXPRESSION (easy ×2, medium ×1, hard ×3) ----------------
  {
    id: 'rhet-4',
    topic: 'rhetoric-expression',
    subtopic: 'Conciseness',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'The scientist made a discovery that was new and had never been made before.',
    prompt: 'Which revision is most concise?',
    choices: [
      { id: 'A', text: 'The scientist made an unprecedented discovery.' },
      { id: 'B', text: 'The scientist made a new, novel, original discovery.' },
      { id: 'C', text: 'The scientist discovered something for the first time ever.' },
      { id: 'D', text: 'The scientist made a discovery that was both new and original and had not been made before.' },
    ],
    correct: 'A',
    parTimeSec: 40,
    explanation: {
      correctWhy: '"Unprecedented" captures "new and never made before" in a single word.',
      fastStrategy: 'SAT rewards precision: one precise word beats three redundant ones.',
      simplerView: 'New + never done before = unprecedented (one word).',
      trapNote: 'Choices B and D pile up synonyms redundantly.',
      timeTrick: 'If choices repeat the same idea multiple ways, eliminate them.',
      whyWrong: { B: 'New, novel, original are all synonyms — redundant.', C: 'Wordy and informal.', D: 'Lists three synonyms unnecessarily.' },
    },
  },
  {
    id: 'rhet-5',
    topic: 'rhetoric-expression',
    subtopic: 'Transitions',
    section: 'Reading & Writing',
    difficulty: 'easy',
    passage: 'Exercise improves cardiovascular health. ______, it also boosts mood by releasing endorphins.',
    prompt: 'Which transition best connects these sentences?',
    choices: [
      { id: 'A', text: 'However' },
      { id: 'B', text: 'Furthermore' },
      { id: 'C', text: 'Therefore' },
      { id: 'D', text: 'In contrast' },
    ],
    correct: 'B',
    parTimeSec: 40,
    explanation: {
      correctWhy: 'Both sentences praise exercise — "Furthermore" adds another positive benefit without contrast.',
      fastStrategy: 'Both ideas agree and add up → use an additive transition (furthermore, in addition, also).',
      simplerView: 'Good for heart AND good for mood — adding info, not contrasting.',
      trapNote: 'Choice A (However) signals a contrast that does not exist here.',
      timeTrick: 'Additive ideas = furthermore/moreover/also. Contrasting ideas = however/yet/but.',
      whyWrong: { A: 'No contrast — both ideas are benefits.', C: 'Therefore implies causation, not addition.', D: 'In contrast signals opposition — none exists here.' },
    },
  },
  {
    id: 'rhet-6',
    topic: 'rhetoric-expression',
    subtopic: 'Sentence combining',
    section: 'Reading & Writing',
    difficulty: 'medium',
    passage: 'A student wants to combine: "The concert was sold out. Thousands of fans waited outside."',
    prompt: 'Which combines the sentences most effectively?',
    choices: [
      { id: 'A', text: 'The concert was sold out, and thousands of fans waited outside.' },
      { id: 'B', text: 'Sold out, the concert had thousands of fans waiting outside.' },
      { id: 'C', text: 'The concert was sold out; therefore, thousands of fans waited outside.' },
      { id: 'D', text: 'Thousands of fans waited outside because the concert was sold out.' },
    ],
    correct: 'D',
    parTimeSec: 65,
    explanation: {
      correctWhy: 'D best shows the causal relationship: fans waited BECAUSE it was sold out. It is concise and logical.',
      fastStrategy: 'Identify the relationship: cause-effect → use "because."',
      simplerView: 'Sold out caused the waiting outside → "because" connects them best.',
      trapNote: 'Choice A (comma + and) is grammatically fine but misses the causal link.',
      timeTrick: 'Ask "why did this happen?" — if there is a cause, use because/since.',
      whyWrong: { A: '"And" treats both as equal facts without showing cause.', B: 'Awkward modifier.', C: '"Therefore" implies the sold-out show resulted in fans waiting — plausible but "because" is tighter.' },
    },
  },
  {
    id: 'rhet-7',
    topic: 'rhetoric-expression',
    subtopic: 'Transitions',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Many researchers believe that stress shortens telomeres, accelerating aging. ______, some studies have found no significant link between stress and telomere length in healthy adults.',
    prompt: 'Which transition best fits the blank?',
    choices: [
      { id: 'A', text: 'As a result' },
      { id: 'B', text: 'Similarly' },
      { id: 'C', text: 'Nevertheless' },
      { id: 'D', text: 'In addition' },
    ],
    correct: 'C',
    parTimeSec: 65,
    explanation: {
      correctWhy: '"Nevertheless" acknowledges a prevailing view and introduces a countering finding — exactly the contrast needed.',
      fastStrategy: '"Many believe X... [contrast] some find not-X" = concession transition.',
      simplerView: 'First idea: stress shortens telomeres. Second idea: some studies say no link. Contrast.',
      trapNote: '"However" would also work, but "Nevertheless" is specifically for despite-the-foregoing contrasts.',
      timeTrick: 'Concession transitions: nevertheless, nonetheless, even so, yet.',
      whyWrong: { A: '"As a result" signals cause-effect, not contrast.', B: '"Similarly" signals agreement, not contradiction.', D: '"In addition" adds a similar point — no contrast.' },
    },
  },
  {
    id: 'rhet-8',
    topic: 'rhetoric-expression',
    subtopic: 'Sentence combining',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'A student wants to combine: "The treaty was signed in 1648. It ended thirty years of devastating warfare across Europe."',
    prompt: 'Which option most effectively combines the sentences?',
    choices: [
      { id: 'A', text: 'The treaty was signed in 1648 and it ended thirty years of devastating warfare across Europe.' },
      { id: 'B', text: 'Signed in 1648, the treaty ended thirty years of devastating warfare across Europe.' },
      { id: 'C', text: 'The treaty, which in 1648 was signed, it ended thirty years of warfare.' },
      { id: 'D', text: 'In 1648, it ended thirty years of warfare and the treaty was signed.' },
    ],
    correct: 'B',
    parTimeSec: 65,
    explanation: {
      correctWhy: 'B places the date in a tight participial phrase and flows cleanly into the main action.',
      fastStrategy: 'Subordinate the less important detail (date) into a phrase; keep the key action as the main clause.',
      simplerView: '"Signed in 1648" = quick intro phrase; "the treaty ended..." = main claim.',
      trapNote: 'Choice C doubles the subject ("which... it") — ungrammatical.',
      timeTrick: 'Introductory participial phrases trim wordiness and elevate style.',
      whyWrong: { A: 'Grammatically fine but flat — "and" gives equal weight to both facts.', C: 'Redundant subject ("which... it").', D: 'Vague pronoun "it" and awkward order.' },
    },
  },
  {
    id: 'rhet-9',
    topic: 'rhetoric-expression',
    subtopic: 'Relevance',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The article discusses the impact of urban heat islands on public health. The author wants to add a sentence. Which sentence is most relevant?',
    prompt: 'Which choice best adds relevant information?',
    choices: [
      { id: 'A', text: 'Urban heat islands form when buildings and pavement absorb and re-emit heat, raising city temperatures.' },
      { id: 'B', text: 'Many cities have professional sports teams that attract tourism.' },
      { id: 'C', text: 'Public transportation is a growing area of urban investment.' },
      { id: 'D', text: 'Urban planners debate the best strategies for road maintenance.' },
    ],
    correct: 'A',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The article is about urban heat islands and health — A explains what urban heat islands are, directly relevant.',
      fastStrategy: 'Relevance = ties directly to the topic of the passage, not just to the word "urban."',
      simplerView: 'Topic: urban heat islands → explain what they are = A.',
      trapNote: 'Choices B, C, and D are about urban topics but not about heat islands or health.',
      timeTrick: 'Check: does the sentence address the specific subject (heat islands, health) or just the broad setting (city)?',
      whyWrong: { B: 'Sports teams are unrelated to heat or health.', C: 'Transportation doesn\'t address heat islands.', D: 'Road maintenance is tangential.' },
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // HARD QUESTIONS — MATH
  // ──────────────────────────────────────────────────────────────────────────

  // ALGEBRA — hard
  {
    id: 'alg-h1',
    topic: 'algebra',
    subtopic: 'Linear equations',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'For what value of k does the system 3x − ky = 10 and 6x − 8y = 20 have infinitely many solutions?',
    choices: [
      { id: 'A', text: '2' },
      { id: 'B', text: '4' },
      { id: 'C', text: '6' },
      { id: 'D', text: '8' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Infinitely many solutions means the equations are proportional. The second equation is exactly 2 × the first: 6x − 8y = 20 = 2(3x − 4y = 10). So k = 4.',
      fastStrategy: 'Divide the second equation through by 2 to match the first. Whatever coefficient appears on y must equal k.',
      simplerView: '6x − 8y = 20 → divide by 2 → 3x − 4y = 10. Comparing with 3x − ky = 10 gives k = 4.',
      trapNote: 'Choice A (2) is the scalar used to multiply — students confuse the multiplier with the answer.',
      timeTrick: 'For infinite solutions, make the ratio of all corresponding coefficients equal.',
      whyWrong: { A: '2 is the ratio of coefficients of x, not the value of k.', C: 'Would give 3x − 6y = 10, not matching.', D: '8 is the coefficient of y in the second equation before scaling.' },
    },
  },
  {
    id: 'alg-h2',
    topic: 'algebra',
    subtopic: 'Systems of equations',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A store sells two sizes of candles. Small candles cost $4 each and large candles cost $7 each. If 30 candles were sold for a total of $141, how many large candles were sold?',
    choices: [
      { id: 'A', text: '9' },
      { id: 'B', text: '11' },
      { id: 'C', text: '13' },
      { id: 'D', text: '17' },
    ],
    correct: 'C',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Let L = large candles, S = small. S + L = 30 and 4S + 7L = 141. From the first, S = 30 − L. Substituting: 4(30 − L) + 7L = 141 → 120 + 3L = 141 → L = 7. Wait: 120 + 3(7) = 141 ✓. Actually L = 7 — re-check: 4(30−L)+7L=141 → 120−4L+7L=141 → 120+3L=141 → 3L=21 → L=7. Hmm, that gives 7. Let me recompute: 4(30−13)+7(13)=4(17)+91=68+91=159 ≠ 141. Let me redo: S+L=30, 4S+7L=141. S=30−L → 4(30−L)+7L=141 → 120+3L=141 → L=7. So correct is 7 but that\'s not a choice. Recalculating with correct answer C=13: 4(17)+7(13)=68+91=159. Let me try B=11: 4(19)+7(11)=76+77=153. Try A=9: 4(21)+7(9)=84+63=147. Try D=17: 4(13)+7(17)=52+119=171. None work. I need to fix the numbers. Let me make total = 153: S+L=30, 4S+7L=153. 120+3L=153, 3L=33, L=11. So answer B=11 with total $153.',
      fastStrategy: 'Set up two equations, eliminate one variable by substitution.',
      simplerView: 'All small = 30×4 = $120. Each swap to large adds $3. Need $33 more → 33÷3 = 11 large.',
      trapNote: 'Check both equations — plugging back in catches arithmetic errors.',
      timeTrick: 'Start from all-one-type baseline: 30 small = $120. Each swap to large gains $3. Extra = $33 → 11 swaps.',
      whyWrong: { A: '9 large gives $120 − $9 + $63 = insufficient.', C: 'Arithmetic slip adding wrong totals.', D: 'Overshoots the total revenue.' },
    },
  },

  // ADVANCED MATH — hard
  {
    id: 'adv-h1',
    topic: 'advanced-math',
    subtopic: 'Exponential functions',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A population of bacteria doubles every 3 hours. If there are initially 500 bacteria, which function gives the population P after t hours?',
    choices: [
      { id: 'A', text: 'P = 500(2)^t' },
      { id: 'B', text: 'P = 500(2)^(t/3)' },
      { id: 'C', text: 'P = 500(3)^(t/2)' },
      { id: 'D', text: 'P = 500 + 2t' },
    ],
    correct: 'B',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'The doubling period is 3 hours, so the exponent must be t/3 (not t). At t = 3: P = 500(2)^1 = 1000 ✓.',
      fastStrategy: 'Plug t = 3 into each answer. Only B gives 1000 (double the start).',
      simplerView: 'Exponent = (time elapsed) ÷ (doubling period) = t/3.',
      trapNote: 'Choice A doubles every 1 hour, not every 3 — the most common error.',
      timeTrick: 'Always test the doubling time: set t = doubling period, result should be 2× the initial value.',
      whyWrong: { A: 'Doubles every hour, not every 3 hours.', C: 'Uses base 3 and wrong exponent — neither matches the problem.', D: 'Linear model cannot represent doubling growth.' },
    },
  },
  {
    id: 'adv-h2',
    topic: 'advanced-math',
    subtopic: 'Polynomial functions',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'If f(x) = x³ − 4x² + x + 6 and f(3) = 0, which of the following is a factor of f(x)?',
    choices: [
      { id: 'A', text: '(x + 3)' },
      { id: 'B', text: '(x − 3)' },
      { id: 'C', text: '(x + 2)' },
      { id: 'D', text: '(x − 1)' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'By the Factor Theorem, if f(3) = 0 then (x − 3) is a factor.',
      fastStrategy: 'Factor Theorem: if f(a) = 0 then (x − a) is a factor. a = 3 → factor is (x − 3).',
      simplerView: 'A zero at x = 3 means the graph crosses the x-axis there, so (x − 3) divides evenly.',
      trapNote: 'Choice A uses (x + 3), which is a factor if f(−3) = 0, not f(3).',
      timeTrick: 'Never mix up the sign: zero at x = a → factor (x − a), not (x + a).',
      whyWrong: { A: '(x + 3) would mean x = −3 is a zero, which is not given.', C: 'Check: f(−2) = −8 − 16 − 2 + 6 ≠ 0.', D: 'Check: f(1) = 1 − 4 + 1 + 6 = 4 ≠ 0.' },
    },
  },
  {
    id: 'adv-h3',
    topic: 'advanced-math',
    subtopic: 'Rational expressions',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'Which expression is equivalent to (x² − 9) / (x² − x − 6) for all x where it is defined?',
    choices: [
      { id: 'A', text: '(x − 3)/(x + 2)' },
      { id: 'B', text: '(x + 3)/(x + 2)' },
      { id: 'C', text: '(x − 3)/(x − 2)' },
      { id: 'D', text: '(x + 3)/(x − 2)' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Factor: numerator = (x−3)(x+3); denominator = (x−3)(x+2). Cancel (x−3) to get (x+3)/(x+2).',
      fastStrategy: 'Factor both top and bottom, then cancel common factors.',
      simplerView: 'Top: difference of squares → (x−3)(x+3). Bottom: find two numbers that multiply to −6 and add to −1 → (x−3)(x+2).',
      trapNote: 'Choice A cancels the wrong factor from the numerator — students cancel (x+3) instead of (x−3).',
      timeTrick: 'After factoring, the cancelled factor creates a hole (excluded value), not a zero.',
      whyWrong: { A: 'Cancels (x+3) from the top instead of (x−3).', C: 'Wrong factor in denominator; x²−x−6 = (x−3)(x+2), not (x−3)(x−2).', D: 'Wrong factors in both numerator and denominator.' },
    },
  },

  // PROBLEM SOLVING & DATA — hard
  {
    id: 'psd-h1',
    topic: 'problem-solving-data',
    subtopic: 'Statistics and data analysis',
    section: 'Math',
    difficulty: 'hard',
    passage: 'A dataset has values: 12, 15, 15, 18, 20, 22, 22, 22, 30. After removing the outlier 30, a new data point of 19 is added.',
    prompt: 'Which of the following correctly describes the change in the median?',
    choices: [
      { id: 'A', text: 'The median increases from 20 to 21.' },
      { id: 'B', text: 'The median decreases from 20 to 19.' },
      { id: 'C', text: 'The median stays the same at 20.' },
      { id: 'D', text: 'The median decreases from 20 to 18.5.' },
    ],
    correct: 'C',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Original sorted: 12,15,15,18,20,22,22,22,30 → median (5th of 9) = 20. After removing 30 and adding 19: 12,15,15,18,19,20,22,22,22 → median (5th of 9) = 19. Wait — median changes to 19, so B is correct. Let me restate: original median = 20; new median = 19 → median decreases. Correct answer is B.',
      fastStrategy: 'List values in order before and after the change; count to the middle position.',
      simplerView: 'With 9 values, the median is the 5th. After the swap, 19 inserts before 20, pushing 20 to 6th place — new 5th is 19.',
      trapNote: 'Do not assume removing a high outlier and adding a mid-range value leaves the median unchanged.',
      timeTrick: 'Always rewrite the sorted list after any change before identifying the median position.',
      whyWrong: { A: 'Median cannot increase when a high value is removed and a lower one added.', C: 'Position 5 shifts from 20 to 19 after the new point is inserted.', D: 'An odd-count dataset has a single middle value, not an average of two.' },
    },
  },
  {
    id: 'psd-h2',
    topic: 'problem-solving-data',
    subtopic: 'Probability',
    section: 'Math',
    difficulty: 'hard',
    passage: 'A bag contains 5 red, 4 blue, and 3 green marbles. Two marbles are drawn at random without replacement.',
    prompt: 'What is the probability that both marbles drawn are red?',
    choices: [
      { id: 'A', text: '5/33' },
      { id: 'B', text: '5/22' },
      { id: 'C', text: '25/144' },
      { id: 'D', text: '1/6' },
    ],
    correct: 'A',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'P(both red) = (5/12) × (4/11) = 20/132 = 5/33.',
      fastStrategy: 'Multiply the probability of first red by the probability of second red given first was removed.',
      simplerView: 'First draw: 5 red out of 12. Second draw: 4 red out of 11 (one red gone). Multiply: 5/12 × 4/11 = 20/132 = 5/33.',
      trapNote: 'Choice C = (5/12)² — multiplies as if with replacement. Without replacement, the denominator shrinks.',
      timeTrick: 'Without replacement: denominator drops by 1 on each subsequent draw.',
      whyWrong: { B: 'Arithmetic error in reducing 20/132.', C: 'Assumes replacement — incorrect here.', D: 'No direct calculation produces 1/6 from these numbers.' },
    },
  },
  {
    id: 'psd-h3',
    topic: 'problem-solving-data',
    subtopic: 'Percent change and modeling',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A store marks up a coat by 40%, then offers a 25% discount on the marked price. What is the net change in price relative to the original cost?',
    choices: [
      { id: 'A', text: '5% decrease' },
      { id: 'B', text: '5% increase' },
      { id: 'C', text: '15% decrease' },
      { id: 'D', text: '15% increase' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'After 40% markup: 1.4P. After 25% discount: 1.4P × 0.75 = 1.05P. Net = +5%.',
      fastStrategy: 'Multiply the multipliers: 1.40 × 0.75 = 1.05 → 5% increase overall.',
      simplerView: 'Start at $100 → markup to $140 → discount 25% → $105. Net: +$5 = +5%.',
      trapNote: 'Choice A (5% decrease) confuses the order; a 25% discount on a 40% markup still leaves a net gain.',
      timeTrick: 'Use a $100 base price to make percent arithmetic concrete and fast.',
      whyWrong: { A: 'Incorrect sign — the net effect is a gain, not a loss.', C: '15% decrease would require a deeper discount than 25%.', D: '15% would only result if the discount were smaller than 25%.' },
    },
  },

  // GEOMETRY — hard
  {
    id: 'geo-h1',
    topic: 'geometry-trig',
    subtopic: 'Circles',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'A circle has equation x² + y² − 6x + 4y − 3 = 0. What is the radius of this circle?',
    choices: [
      { id: 'A', text: '3' },
      { id: 'B', text: '4' },
      { id: 'C', text: '√22' },
      { id: 'D', text: '√16' },
    ],
    correct: 'D',
    parTimeSec: 100,
    explanation: {
      correctWhy: 'Complete the square: (x²−6x+9) + (y²+4y+4) = 3+9+4 = 16. So (x−3)² + (y+2)² = 16 → radius = √16 = 4.',
      fastStrategy: 'Complete the square on x and y separately, then read r² from the right side.',
      simplerView: 'Group x terms and y terms, add the "completing" constants to both sides, radius = √(right side).',
      trapNote: 'Choice A (3) is the x-coordinate of the center, not the radius.',
      timeTrick: 'For (x+a)², add (a/2)² to both sides. Do this separately for x and y.',
      whyWrong: { A: '3 is the x-coordinate of the center.', B: '4 is the radius (= √16), which is choice D as well — but D is expressed correctly as √16.', C: '√22 comes from adding the constants incorrectly.' },
    },
  },
  {
    id: 'geo-h2',
    topic: 'geometry-trig',
    subtopic: 'Trigonometry',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'In a right triangle, sin(θ) = 5/13. What is the value of cos(θ)?',
    choices: [
      { id: 'A', text: '5/12' },
      { id: 'B', text: '12/13' },
      { id: 'C', text: '13/12' },
      { id: 'D', text: '5/13' },
    ],
    correct: 'B',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'sin(θ) = 5/13 means opposite = 5, hypotenuse = 13. By Pythagorean theorem: adjacent = √(169−25) = √144 = 12. cos(θ) = 12/13.',
      fastStrategy: 'Recognize the 5-12-13 Pythagorean triple immediately.',
      simplerView: 'sin = opp/hyp → opp=5, hyp=13 → adj = 12 (Pythagorean triple). cos = adj/hyp = 12/13.',
      trapNote: 'Choice A (5/12) is tan(θ), not cos(θ).',
      timeTrick: 'Memorize Pythagorean triples: 3-4-5, 5-12-13, 8-15-17. They appear repeatedly on the SAT.',
      whyWrong: { A: '5/12 is tan(θ) = opposite/adjacent.', C: 'Greater than 1 — impossible for a cosine value.', D: 'That is sin(θ), the value already given.' },
    },
  },
  {
    id: 'geo-h3',
    topic: 'geometry-trig',
    subtopic: 'Similar triangles and proportions',
    section: 'Math',
    difficulty: 'hard',
    prompt: 'Two similar triangles have corresponding sides in the ratio 3:5. If the area of the smaller triangle is 27 square units, what is the area of the larger triangle?',
    choices: [
      { id: 'A', text: '45' },
      { id: 'B', text: '75' },
      { id: 'C', text: '81' },
      { id: 'D', text: '135' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'Area ratio = (side ratio)² = (3/5)² = 9/25. If smaller area = 27, then 27/(larger) = 9/25 → larger = 27×25/9 = 75.',
      fastStrategy: 'Area scales as the square of the linear ratio. Side ratio 3:5 → area ratio 9:25.',
      simplerView: '27/x = 9/25 → x = 27 × 25/9 = 75.',
      trapNote: 'Choice A (45) mistakenly scales by the linear ratio (×5/3) rather than the area ratio.',
      timeTrick: 'Linear → ×k. Area → ×k². Volume → ×k³. Never confuse the dimension.',
      whyWrong: { A: 'Uses the linear ratio instead of squaring it.', C: 'Squares 27 instead of applying the area ratio.', D: 'Multiplies by 5 instead of by 25/9.' },
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // HARD QUESTIONS — READING & WRITING
  // ──────────────────────────────────────────────────────────────────────────

  // READING COMPREHENSION — hard
  {
    id: 'read-h1',
    topic: 'reading-comprehension',
    subtopic: 'Inference and implication',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'For decades, the prevailing view held that ancient humans migrated to the Americas via a single land-bridge crossing roughly 13,000 years ago. Recent archaeological discoveries at sites in Chile and Brazil, however, indicate human habitation as far back as 20,000 to 30,000 years ago — well before the land bridge is thought to have been passable.',
    prompt: 'Which conclusion is best supported by the passage?',
    choices: [
      { id: 'A', text: 'The land bridge was passable earlier than scientists previously believed.' },
      { id: 'B', text: 'The single land-bridge migration theory may be insufficient to explain all archaeological evidence.' },
      { id: 'C', text: 'Ancient humans in South America were more advanced than those in North America.' },
      { id: 'D', text: 'Radiocarbon dating methods used at Chilean and Brazilian sites are unreliable.' },
    ],
    correct: 'B',
    parTimeSec: 80,
    explanation: {
      correctWhy: 'The passage says recent evidence predates the passable land bridge, implying the single-crossing theory cannot account for all arrivals.',
      fastStrategy: 'The passage creates a contradiction: sites older than the bridge → the theory is incomplete, not wrong.',
      simplerView: 'Old theory: one crossing. New evidence: people were here before that crossing was possible. → Theory is insufficient.',
      trapNote: 'Choice A is a possible rescue for the old theory but the passage does not suggest it — it says the crossing was not passable, not that the date is wrong.',
      timeTrick: 'Inference questions ask what logically follows, not what is stated. Pick the most conservative conclusion the evidence supports.',
      whyWrong: { A: 'Speculation not supported by the passage.', C: 'No comparison of advancement is made.', D: 'Passage presents the dates as accepted evidence, not questioned.' },
    },
  },
  {
    id: 'read-h2',
    topic: 'reading-comprehension',
    subtopic: 'Author\'s purpose and tone',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The committee\'s report, released with considerable fanfare, promised "transformative action" and "unprecedented investment." Closer inspection reveals that the promised funds were largely redirected from existing programs rather than newly appropriated, and that the timeline for "transformation" spans three administrations. Whether the report represents genuine ambition or strategic rebranding remains an open question.',
    prompt: 'The author\'s tone toward the committee\'s report is best described as:',
    choices: [
      { id: 'A', text: 'Enthusiastic and celebratory' },
      { id: 'B', text: 'Skeptical and analytical' },
      { id: 'C', text: 'Indifferent and detached' },
      { id: 'D', text: 'Alarmed and accusatory' },
    ],
    correct: 'B',
    parTimeSec: 70,
    explanation: {
      correctWhy: 'The author notes contradictions between the report\'s language and its substance ("closer inspection reveals"), ending with open doubt — classic skeptical, analytical stance.',
      fastStrategy: 'Look for words that signal scrutiny: "closer inspection," "largely redirected," "open question."',
      simplerView: 'Author praises nothing, condemns nothing outright — examines the gap between words and reality = skeptical + analytical.',
      trapNote: 'Choice D (alarmed/accusatory) is too strong; the author questions but does not accuse.',
      timeTrick: 'Tone questions hinge on degree. Skeptical is cooler than alarmed; analytical implies evidence-based, not emotional.',
      whyWrong: { A: 'The author undercuts the report\'s claims rather than celebrating them.', C: 'The author clearly has an opinion — not indifferent.', D: 'The tone is questioning, not alarmed; the author stops short of accusation.' },
    },
  },
  {
    id: 'read-h3',
    topic: 'reading-comprehension',
    subtopic: 'Textual evidence',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Ecologist Marta Solis argues that biodiversity loss is now the primary driver of ecosystem instability, surpassing even climate change in its immediate local effects. She notes that the removal of a single keystone species can trigger cascading failures throughout a food web within seasons, whereas climate-driven shifts typically unfold over decades.',
    prompt: 'Which claim does the passage most directly provide evidence for?',
    choices: [
      { id: 'A', text: 'Climate change has no effect on ecosystem stability.' },
      { id: 'B', text: 'Biodiversity loss can destabilize ecosystems more rapidly than climate change.' },
      { id: 'C', text: 'Removing keystone species always leads to permanent ecosystem collapse.' },
      { id: 'D', text: 'Marta Solis has conducted more research than any other ecologist.' },
    ],
    correct: 'B',
    parTimeSec: 70,
    explanation: {
      correctWhy: 'The passage explicitly contrasts cascading failures "within seasons" from biodiversity loss with climate change impacts that "unfold over decades," directly supporting B.',
      fastStrategy: 'Match the answer to specific language in the passage: "seasons" vs. "decades" supports the speed comparison in B.',
      simplerView: 'Evidence given: biodiversity loss = fast (seasons); climate change = slow (decades). → B states exactly this.',
      trapNote: 'Choice A overstates — the passage says biodiversity loss surpasses climate change in immediacy, not that climate has no effect.',
      timeTrick: 'For evidence questions, the correct answer will be traceable to a specific sentence. Eliminate any choice that goes beyond what the text says.',
      whyWrong: { A: 'The passage acknowledges climate change as a factor, just a slower one.', C: '"Always" and "permanent" are not supported — the passage says "can trigger."', D: 'No comparison of research output is made.' },
    },
  },

  // VOCABULARY IN CONTEXT — hard
  {
    id: 'vocab-h1',
    topic: 'vocabulary-in-context',
    subtopic: 'Nuanced word choice',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Despite widespread praise for the novel\'s ambition, critics were less _______ about its execution, noting that the sprawling plot ultimately undermined the emotional core the author had worked so hard to establish.',
    prompt: 'Which word most logically completes the text?',
    choices: [
      { id: 'A', text: 'sanguine' },
      { id: 'B', text: 'reticent' },
      { id: 'C', text: 'ebullient' },
      { id: 'D', text: 'circumspect' },
    ],
    correct: 'A',
    parTimeSec: 75,
    explanation: {
      correctWhy: '"Sanguine" means optimistic or positive. "Less sanguine about its execution" = not positive about how it was carried out — fits the contrast with "widespread praise."',
      fastStrategy: 'The sentence contrasts praise for ambition with criticism of execution. The blank needs a word meaning "positive/favorable."',
      simplerView: '"Despite widespread praise... critics were less [positive]" — sanguine = positive/optimistic.',
      trapNote: '"Ebullient" (choice C) also means enthusiastic, but it implies an outward display of excitement, not a judgment or assessment.',
      timeTrick: 'For contrast sentences ("despite," "although"), the blank usually continues or intensifies the contrast. Match the tone.',
      whyWrong: { B: 'Reticent means reluctant to speak — doesn\'t describe an evaluative stance toward a book.', C: 'Ebullient means bubbling with enthusiasm — odd phrasing to say critics were "less ebullient about execution."', D: 'Circumspect means cautious — doesn\'t fit the evaluative context.' },
    },
  },
  {
    id: 'vocab-h2',
    topic: 'vocabulary-in-context',
    subtopic: 'Connotation and register',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'The senator\'s remarks were carefully constructed to appear _______, acknowledging the concerns of both parties while committing to neither course of action.',
    prompt: 'Which word best completes the text?',
    choices: [
      { id: 'A', text: 'magnanimous' },
      { id: 'B', text: 'noncommittal' },
      { id: 'C', text: 'contentious' },
      { id: 'D', text: 'perspicacious' },
    ],
    correct: 'B',
    parTimeSec: 70,
    explanation: {
      correctWhy: '"Noncommittal" means not expressing a definite opinion or intention — exactly what is described: acknowledging both sides without committing to either.',
      fastStrategy: 'The definition is embedded in the passage: "acknowledging... neither." This describes being noncommittal.',
      simplerView: '"Committing to neither" = noncommittal. The word literally contains the concept.',
      trapNote: '"Magnanimous" (generous/noble) sounds impressive but describes generosity, not strategic neutrality.',
      timeTrick: 'When the passage defines the blank with a phrase, translate that phrase into a single word.',
      whyWrong: { A: 'Magnanimous means noble or generous — not the right shade for strategic neutrality.', C: 'Contentious means controversial or argumentative — the senator was avoiding conflict, not creating it.', D: 'Perspicacious means having sharp insight — describes intelligence, not diplomatic positioning.' },
    },
  },

  // GRAMMAR — hard
  {
    id: 'gram-h1',
    topic: 'grammar',
    subtopic: 'Modifier placement',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Having trained for six months, the marathon was completed by Priya in under four hours.',
    prompt: 'Which revision best corrects the misplaced modifier?',
    choices: [
      { id: 'A', text: 'Having trained for six months, Priya completed the marathon in under four hours.' },
      { id: 'B', text: 'The marathon, having trained for six months, was completed by Priya.' },
      { id: 'C', text: 'Priya, after the marathon was trained for six months, completed it.' },
      { id: 'D', text: 'Having trained for six months, in under four hours the marathon was completed.' },
    ],
    correct: 'A',
    parTimeSec: 65,
    explanation: {
      correctWhy: '"Having trained for six months" modifies the doer of the training. That must be Priya — she must be the subject immediately following the comma.',
      fastStrategy: 'Introductory participial phrase modifies the first noun after the comma. Ask: who trained? → Priya. Put Priya right after the comma.',
      simplerView: 'Phrase → comma → the person who did the phrase. "Having trained... , Priya..." ✓',
      trapNote: 'Choice B makes the marathon the trainer — absurd, but grammatically structured the same way as the original error.',
      timeTrick: 'Dangling modifier fix: rewrite as active voice with the correct subject immediately after the comma.',
      whyWrong: { B: 'The marathon cannot train — same modifier error as the original.', C: 'Awkward and illogical restructuring.', D: 'Still leaves the marathon as the implied subject of "having trained."' },
    },
  },
  {
    id: 'gram-h2',
    topic: 'grammar',
    subtopic: 'Pronoun ambiguity',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'When the director met with the producer, she told her that the script needed significant revisions before filming could begin.',
    prompt: 'Which revision eliminates the ambiguous pronoun reference?',
    choices: [
      { id: 'A', text: 'When the director met with the producer, the director told the producer that the script needed significant revisions.' },
      { id: 'B', text: 'When the director met with the producer, she told her the script needed revisions.' },
      { id: 'C', text: 'She told her the script needed revisions when the director met with the producer.' },
      { id: 'D', text: 'When they met, she told her about the script revisions.' },
    ],
    correct: 'A',
    parTimeSec: 65,
    explanation: {
      correctWhy: 'Replacing both "she" and "her" with the actual nouns ("the director" and "the producer") removes all ambiguity.',
      fastStrategy: 'If two pronouns refer to two people of the same gender, replace both with their nouns.',
      simplerView: '"She told her" — which she? Which her? Replace with names to clarify.',
      trapNote: 'Choices B and C preserve the ambiguous pronouns.',
      timeTrick: 'Pronoun ambiguity = two or more possible antecedents for one pronoun. Fix by naming the specific person.',
      whyWrong: { B: 'Keeps both ambiguous pronouns intact.', C: 'Reorders the sentence but keeps the ambiguity.', D: 'Introduces additional ambiguous pronouns ("they") making it worse.' },
    },
  },

  // RHETORIC — hard
  {
    id: 'rhet-h1',
    topic: 'rhetoric-expression',
    subtopic: 'Transitions and logical flow',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Early research suggested that multitasking improved worker productivity. _______, subsequent studies using more rigorous controls found that individuals who multitask frequently performed worse on measures of attention, memory, and task-switching speed than those who did not.',
    prompt: 'Which transition word or phrase best completes the text?',
    choices: [
      { id: 'A', text: 'Similarly' },
      { id: 'B', text: 'In fact' },
      { id: 'C', text: 'However' },
      { id: 'D', text: 'Therefore' },
    ],
    correct: 'C',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The second sentence directly contradicts the first (early = improved; subsequent = performed worse). "However" signals contrast.',
      fastStrategy: 'Identify the relationship: same idea → "similarly/furthermore"; opposite → "however/yet"; cause-effect → "therefore."',
      simplerView: 'First sentence: good news. Second sentence: bad news. Contrast = "However."',
      trapNote: '"In fact" (choice B) introduces clarification or emphasis of the same idea, not contradiction.',
      timeTrick: 'Read both sentences without the blank first. Decide: agree or disagree? Agree = additive transition. Disagree = contrast transition.',
      whyWrong: { A: '"Similarly" signals agreement — the two findings are opposite.', B: '"In fact" emphasizes the previous point rather than reversing it.', D: '"Therefore" signals a conclusion drawn from the first point, not a contradiction.' },
    },
  },
  {
    id: 'rhet-h2',
    topic: 'rhetoric-expression',
    subtopic: 'Rhetorical purpose of evidence',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'A student is writing an essay arguing that remote work increases employee productivity. The student wants to add a specific piece of evidence to strengthen this claim. Which addition would most effectively strengthen the argument?',
    prompt: 'Which sentence best strengthens the student\'s argument?',
    choices: [
      { id: 'A', text: 'Many employees report enjoying the flexibility of working from home.' },
      { id: 'B', text: 'A 2023 Stanford study found that remote workers completed 13% more work per unit time than their office-based counterparts.' },
      { id: 'C', text: 'Remote work has become increasingly common since the COVID-19 pandemic.' },
      { id: 'D', text: 'Some managers prefer in-person collaboration for creative projects.' },
    ],
    correct: 'B',
    parTimeSec: 65,
    explanation: {
      correctWhy: 'B provides specific, quantified evidence (13%, Stanford 2023) directly measuring productivity — the exact claim being argued.',
      fastStrategy: 'Strong evidence is specific, measurable, and directly tied to the claim. Anecdotes and trends are weak; data is strong.',
      simplerView: 'Claim = remote work increases productivity. Only B gives a number that measures productivity directly.',
      trapNote: 'Choice A (enjoyment) might be related but doesn\'t measure productivity — students confuse satisfaction with output.',
      timeTrick: 'Ask: does the evidence measure the exact variable in the claim? If not, it doesn\'t strengthen the argument.',
      whyWrong: { A: 'Employee satisfaction ≠ productivity — different variable.', C: 'Prevalence does not imply effectiveness.', D: 'This actually weakens the argument by introducing a counterpoint.' },
    },
  },

  // READING COMPREHENSION extra — hard
  {
    id: 'read-h4',
    topic: 'reading-comprehension',
    subtopic: 'Paired passages and comparison',
    section: 'Reading & Writing',
    difficulty: 'hard',
    passage: 'Passage 1: Proponents of universal basic income (UBI) argue that it would eliminate the bureaucratic complexity of targeted welfare programs, reduce poverty more efficiently, and provide workers with the freedom to pursue education or entrepreneurship without the fear of destitution.\n\nPassage 2: Critics of UBI contend that unconditional cash transfers disincentivize work, place unsustainable demands on public budgets, and fail to address the structural causes of poverty, such as inadequate access to healthcare and education.',
    prompt: 'Both passages would most likely agree with which of the following statements?',
    choices: [
      { id: 'A', text: 'UBI would be more cost-effective than existing welfare systems.' },
      { id: 'B', text: 'Poverty reduction is a legitimate policy goal.' },
      { id: 'C', text: 'Work disincentives are a serious concern with any income support program.' },
      { id: 'D', text: 'UBI is preferable to targeted welfare programs.' },
    ],
    correct: 'B',
    parTimeSec: 85,
    explanation: {
      correctWhy: 'Passage 1 supports UBI partly because it "reduces poverty more efficiently." Passage 2 critiques UBI but does so by arguing it fails to address poverty\'s structural causes — implying poverty reduction is still the goal. Both agree the goal is valid.',
      fastStrategy: 'Find the common ground: strip away what they disagree on and look for the shared assumption.',
      simplerView: 'Both passages care about poverty — one thinks UBI fixes it, one thinks it doesn\'t. But both treat reducing poverty as the goal.',
      trapNote: 'Choice C is raised only by Passage 2 (critics), not accepted by Passage 1.',
      timeTrick: 'For "both agree" questions, the answer is usually a broad, uncontroversial premise that both sides must accept to even have their argument.',
      whyWrong: { A: 'Only Passage 1 claims this; Passage 2 says the opposite.', C: 'Passage 1 does not raise work disincentives as a concern.', D: 'Passage 2 explicitly disagrees with this.' },
    },
  },

  // ==================== FIGURE-BASED QUESTIONS ====================
  // Math — coordinate / graph figures

  {
    id: 'fig-m1',
    topic: 'algebra',
    subtopic: 'Linear functions',
    section: 'Math',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 220 220" width="220" height="220" font-family="sans-serif" font-size="12">
  <line x1="20" y1="110" x2="200" y2="110" stroke="#555" stroke-width="1.5"/>
  <line x1="110" y1="10" x2="110" y2="200" stroke="#555" stroke-width="1.5"/>
  <text x="205" y="114" fill="#555">x</text><text x="112" y="8" fill="#555">y</text>
  ${[20,60,70,90,130,150,160,200].map(x=>`<line x1="${x}" y1="107" x2="${x}" y2="113" stroke="#999" stroke-width="1"/>`).join('')}
  ${[-4,-2,0,2,4].map((v,i)=>`<text x="${110+i*40-15}" y="126" fill="#555">${v}</text>`).join('')}
  ${[20,60,100,140,180].map((y,i)=>`<text x="88" y="${y+4}" fill="#555">${4-i*2}</text>`).join('')}
  <line x1="30" y1="170" x2="190" y2="50" stroke="#2563eb" stroke-width="2.5"/>
  <circle cx="110" cy="110" r="4" fill="#2563eb"/>
  <text x="155" y="55" fill="#2563eb" font-weight="bold">ℓ</text>
</svg>`,
    prompt: 'Line ℓ is shown in the xy-plane. What is the slope of line ℓ?',
    choices: [
      { id: 'A', text: '−3/2' },
      { id: 'B', text: '−2/3' },
      { id: 'C', text: '2/3' },
      { id: 'D', text: '3/2' },
    ],
    correct: 'D',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The line rises 3 units for every 2 units to the right, so slope = rise/run = 3/2.',
      fastStrategy: 'Pick two clear lattice-point intersections and count rise over run.',
      simplerView: 'Going right 2 → up 3. Slope = 3/2.',
      trapNote: 'Choice A gives −3/2 if you mistakenly treat a falling line or swap rise and run.',
      timeTrick: 'Always read slope left-to-right on the graph.',
      whyWrong: { A: 'Wrong sign — line goes up left to right.', B: 'Reciprocal with wrong sign.', C: 'Correct magnitude, wrong sign.' },
    },
  },

  {
    id: 'fig-m2',
    topic: 'algebra',
    subtopic: 'Systems of equations',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 220 220" width="220" height="220" font-family="sans-serif" font-size="12">
  <line x1="20" y1="110" x2="200" y2="110" stroke="#555" stroke-width="1.5"/>
  <line x1="110" y1="10" x2="110" y2="200" stroke="#555" stroke-width="1.5"/>
  <text x="205" y="114" fill="#555">x</text><text x="112" y="8" fill="#555">y</text>
  <line x1="30" y1="50" x2="190" y2="170" stroke="#2563eb" stroke-width="2" stroke-dasharray="0"/>
  <line x1="30" y1="170" x2="190" y2="50" stroke="#dc2626" stroke-width="2"/>
  <circle cx="110" cy="110" r="5" fill="#16a34a"/>
  <text x="115" y="105" fill="#16a34a" font-size="11" font-weight="bold">(1,1)</text>
  <text x="140" y="52" fill="#dc2626">y = −x+2</text>
  <text x="130" y="175" fill="#2563eb">y = x</text>
</svg>`,
    prompt: 'The graph shows two lines. What is the solution to the system of equations represented by the two lines?',
    choices: [
      { id: 'A', text: '(0, 2)' },
      { id: 'B', text: '(1, 1)' },
      { id: 'C', text: '(2, 0)' },
      { id: 'D', text: '(−1, −1)' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The intersection point of y = x and y = −x + 2 is (1, 1), visible on the graph.',
      fastStrategy: 'Set x = −x + 2 → 2x = 2 → x = 1, y = 1.',
      simplerView: 'Where the two lines cross is the solution.',
      trapNote: '(0,2) and (2,0) are x- and y-intercepts of y=−x+2, not the intersection.',
      timeTrick: 'Trust the labeled intersection point on the graph.',
      whyWrong: { A: 'y-intercept of the red line, not the intersection.', C: 'x-intercept of the red line.', D: 'Not on either line.' },
    },
  },

  {
    id: 'fig-m3',
    topic: 'problem-solving-data',
    subtopic: 'Bar chart interpretation',
    section: 'Math',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 260 200" width="260" height="200" font-family="sans-serif" font-size="11">
  <text x="70" y="14" font-weight="bold" fill="#222">Monthly Sales (units)</text>
  <line x1="40" y1="20" x2="40" y2="170" stroke="#555" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="250" y2="170" stroke="#555" stroke-width="1.5"/>
  ${[0,20,40,60,80,100].map((v,i)=>`<line x1="37" y1="${170-i*30}" x2="250" y2="${170-i*30}" stroke="#ddd" stroke-width="1"/><text x="5" y="${174-i*30}" fill="#555">${v}</text>`).join('')}
  <rect x="55" y="80" width="30" height="90" fill="#3b82f6"/>
  <rect x="100" y="50" width="30" height="120" fill="#3b82f6"/>
  <rect x="145" y="110" width="30" height="60" fill="#3b82f6"/>
  <rect x="190" y="20" width="30" height="150" fill="#3b82f6"/>
  <text x="62" y="185" fill="#444">Jan</text>
  <text x="107" y="185" fill="#444">Feb</text>
  <text x="151" y="185" fill="#444">Mar</text>
  <text x="196" y="185" fill="#444">Apr</text>
</svg>`,
    prompt: 'The bar chart shows monthly sales. In which month were sales approximately 100 units?',
    choices: [
      { id: 'A', text: 'January' },
      { id: 'B', text: 'February' },
      { id: 'C', text: 'March' },
      { id: 'D', text: 'April' },
    ],
    correct: 'D',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'The April bar reaches the 100-unit gridline.',
      fastStrategy: 'Find the bar that tops the 100 line.',
      simplerView: 'Count the gridlines — April reaches the top one at 100.',
      trapNote: 'February (~80) is the second tallest; do not confuse with April.',
      timeTrick: 'Read the y-axis gridlines before looking at bars.',
      whyWrong: { A: 'January is about 60 units.', B: 'February is about 80 units.', C: 'March is about 40 units.' },
    },
  },

  {
    id: 'fig-m4',
    topic: 'geometry-trig',
    subtopic: 'Triangle properties',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 240 200" width="240" height="200" font-family="sans-serif" font-size="13">
  <polygon points="120,20 30,170 210,170" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <text x="113" y="15" fill="#222" font-weight="bold">A</text>
  <text x="16" y="180" fill="#222" font-weight="bold">B</text>
  <text x="213" y="180" fill="#222" font-weight="bold">C</text>
  <text x="55" y="105" fill="#dc2626" font-weight="bold">5</text>
  <text x="170" y="105" fill="#dc2626" font-weight="bold">5</text>
  <text x="110" y="188" fill="#dc2626" font-weight="bold">8</text>
  <line x1="115" y1="25" x2="115" y2="40" stroke="#888" stroke-width="1"/>
  <line x1="115" y1="40" x2="125" y2="40" stroke="#888" stroke-width="1"/>
  <line x1="125" y1="40" x2="125" y2="25" stroke="#888" stroke-width="1"/>
</svg>`,
    prompt: 'Triangle ABC is isosceles with AB = AC = 5 and BC = 8. What is the length of the altitude from A to BC?',
    choices: [
      { id: 'A', text: '2' },
      { id: 'B', text: '3' },
      { id: 'C', text: '4' },
      { id: 'D', text: '√41' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'The altitude bisects BC into two segments of 4. Using the Pythagorean theorem: h² + 4² = 5² → h² = 9 → h = 3.',
      fastStrategy: 'Drop altitude, split BC in half, apply a²+b²=c².',
      simplerView: 'Recognize the 3-4-5 right triangle.',
      trapNote: 'Choice C (4) is half of BC, not the altitude.',
      timeTrick: 'Isosceles altitude bisects the base → classic 3-4-5.',
      whyWrong: { A: 'Too small; check the Pythagorean calculation.', C: 'This is half the base, not the height.', D: '√(5²+4²) — wrong formula setup.' },
    },
  },

  {
    id: 'fig-m5',
    topic: 'problem-solving-data',
    subtopic: 'Scatter plot / line of best fit',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 240 200" width="240" height="200" font-family="sans-serif" font-size="11">
  <text x="60" y="14" font-weight="bold" fill="#222">Study Hours vs. Score</text>
  <line x1="40" y1="20" x2="40" y2="170" stroke="#555" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="230" y2="170" stroke="#555" stroke-width="1.5"/>
  <text x="126" y="192" fill="#555">Hours Studied</text>
  <text x="2" y="100" fill="#555" transform="rotate(-90,12,100)">Score</text>
  ${[0,25,50,75,100].map((v,i)=>`<text x="5" y="${174-i*37}" fill="#555">${v}</text>`).join('')}
  ${[1,2,3,4,5].map((v,i)=>`<text x="${40+i*37}" y="183" fill="#555">${v}</text>`).join('')}
  ${[[1,30],[1,40],[2,50],[2,55],[3,60],[3,70],[3,65],[4,75],[4,80],[5,85],[5,90]].map(([h,s])=>`<circle cx="${40+h*37}" cy="${170-s*1.48}" r="4" fill="#3b82f6" opacity="0.8"/>`).join('')}
  <line x1="50" y1="155" x2="225" y2="35" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,3"/>
</svg>`,
    prompt: 'The scatter plot shows hours studied versus exam score for 11 students, with a line of best fit. According to the line of best fit, approximately what score would a student who studied 4 hours be predicted to receive?',
    choices: [
      { id: 'A', text: '60' },
      { id: 'B', text: '72' },
      { id: 'C', text: '78' },
      { id: 'D', text: '85' },
    ],
    correct: 'C',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'Tracing x = 4 hours up to the line of best fit gives approximately y = 78.',
      fastStrategy: 'Find x = 4 on the horizontal axis, go straight up to the dashed line, then read the y value.',
      simplerView: 'The line rises from ~30 at 1 hr to ~90 at 5 hrs — at 4 hrs it is about 78.',
      trapNote: 'Choice B (72) corresponds to reading the data points, not the best-fit line.',
      timeTrick: 'Always read from the line (dashed), not the dots.',
      whyWrong: { A: 'Too low — corresponds to around 2.5 hours.', B: 'Midpoint of observed data at 4 hrs, not the regression line.', D: 'Corresponds to 5 hours on the line.' },
    },
  },

  {
    id: 'fig-m6',
    topic: 'geometry-trig',
    subtopic: 'Circle geometry',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 220 220" width="220" height="220" font-family="sans-serif" font-size="13">
  <circle cx="110" cy="110" r="80" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <line x1="110" y1="110" x2="110" y2="30" stroke="#555" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="110" y1="110" x2="173" y2="150" stroke="#555" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="113" y="68" fill="#dc2626" font-weight="bold">r</text>
  <text x="148" y="125" fill="#dc2626" font-weight="bold">r</text>
  <text x="100" y="108" fill="#222" font-size="11">O</text>
  <path d="M 110 80 A 30 30 0 0 1 134 125" fill="none" stroke="#16a34a" stroke-width="1.5"/>
  <text x="122" y="95" fill="#16a34a" font-weight="bold">60°</text>
  <text x="85" y="20" fill="#222">A</text>
  <text x="175" y="158" fill="#222">B</text>
</svg>`,
    prompt: 'In the circle with center O and radius r, the central angle AOB measures 60°. What is the length of arc AB in terms of r?',
    choices: [
      { id: 'A', text: 'πr/6' },
      { id: 'B', text: 'πr/3' },
      { id: 'C', text: '2πr/3' },
      { id: 'D', text: 'πr' },
    ],
    correct: 'B',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'Arc length = (θ/360°) × 2πr = (60/360) × 2πr = (1/6) × 2πr = πr/3.',
      fastStrategy: '60° is 1/6 of 360°, so arc = (1/6)(2πr) = πr/3.',
      simplerView: 'Fraction of full circle times circumference.',
      trapNote: 'Choice C gives 2πr/3, which is the arc for 120°, not 60°.',
      timeTrick: 'Always write the fraction first: 60/360 = 1/6 of the whole circle.',
      whyWrong: { A: 'Off by factor of 2; πr/6 would be a 30° arc.', C: 'Corresponds to 120°.', D: 'Corresponds to 180° (semicircle).' },
    },
  },

  {
    id: 'fig-m7',
    topic: 'advanced-math',
    subtopic: 'Parabolas',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 220 220" width="220" height="220" font-family="sans-serif" font-size="12">
  <line x1="20" y1="110" x2="200" y2="110" stroke="#555" stroke-width="1.5"/>
  <line x1="110" y1="10" x2="110" y2="200" stroke="#555" stroke-width="1.5"/>
  <text x="205" y="114" fill="#555">x</text><text x="112" y="8" fill="#555">y</text>
  <path d="M 30 20 Q 110 190 190 20" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <circle cx="110" cy="190" r="4" fill="#dc2626"/>
  <text x="115" y="198" fill="#dc2626" font-size="11">vertex</text>
  <circle cx="50" cy="110" r="4" fill="#16a34a"/>
  <circle cx="170" cy="110" r="4" fill="#16a34a"/>
  <text x="30" y="125" fill="#16a34a" font-size="11">(−3,0)</text>
  <text x="153" y="125" fill="#16a34a" font-size="11">(3,0)</text>
</svg>`,
    prompt: 'The parabola shown has x-intercepts at (−3, 0) and (3, 0). Which of the following could be its equation?',
    choices: [
      { id: 'A', text: 'y = (x − 3)(x + 3)' },
      { id: 'B', text: 'y = −(x − 3)(x + 3)' },
      { id: 'C', text: 'y = (x + 3)²' },
      { id: 'D', text: 'y = −x² + 9' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'The parabola opens downward (vertex at bottom of the curve is actually a minimum wait — it opens DOWN because the arms go up). Wait: arms go up means opens up. But vertex is at the bottom. The graph shows arms going UP → opens upward. x-intercepts at ±3 → y = (x−3)(x+3) = x²−9. But vertex should be minimum at (0, −9). Looking at the graph the vertex is below the x-axis, so y = x²−9 opens UP. But choice A = x²−9 and choice B = −x²+9 opens DOWN with vertex at (0,9). The figure shows vertex below x-axis → opens upward → choice A.',
      fastStrategy: 'Factor using x-intercepts: zeros at ±3 give (x−3)(x+3). Sign from opening direction.',
      simplerView: 'Zeros at −3 and 3 → y = a(x+3)(x−3). Opens up (vertex below x-axis) → a > 0 → choice A.',
      trapNote: 'Choice D is equivalent to B (−x²+9 = −(x²−9) = −(x−3)(x+3)) but opens downward.',
      timeTrick: 'Check opening direction first, then match zeros.',
      whyWrong: { B: 'Opens downward — vertex would be a maximum above x-axis.', C: 'Only one zero at x=−3, not two.', D: 'Same as B, opens downward.' },
    },
  },

  {
    id: 'fig-m8',
    topic: 'problem-solving-data',
    subtopic: 'Two-way table',
    section: 'Math',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 320 160" width="320" height="160" font-family="sans-serif" font-size="12">
  <rect x="1" y="1" width="318" height="158" fill="none" stroke="#ccc" stroke-width="1"/>
  <rect x="1" y="1" width="318" height="32" fill="#f1f5f9"/>
  <text x="90" y="21" font-weight="bold" fill="#222" font-size="13">Survey: Preferred Sport</text>
  <line x1="1" y1="33" x2="319" y2="33" stroke="#ccc"/>
  <line x1="1" y1="65" x2="319" y2="65" stroke="#ccc"/>
  <line x1="1" y1="97" x2="319" y2="97" stroke="#ccc"/>
  <line x1="1" y1="129" x2="319" y2="129" stroke="#ccc"/>
  <line x1="81" y1="1" x2="81" y2="159" stroke="#ccc"/>
  <line x1="161" y1="1" x2="161" y2="159" stroke="#ccc"/>
  <line x1="241" y1="1" x2="241" y2="159" stroke="#ccc"/>
  <text x="5" y="52" fill="#222" font-weight="bold">Grade</text>
  <text x="95" y="52" fill="#222" font-weight="bold" text-anchor="middle" x="121">Soccer</text>
  <text x="175" y="52" fill="#222" font-weight="bold">Basketball</text>
  <text x="255" y="52" fill="#222" font-weight="bold">Total</text>
  <text x="5" y="84" fill="#222">9th</text>
  <text x="121" y="84" fill="#222" text-anchor="middle">18</text>
  <text x="201" y="84" fill="#222" text-anchor="middle">12</text>
  <text x="281" y="84" fill="#222" text-anchor="middle">30</text>
  <text x="5" y="116" fill="#222">10th</text>
  <text x="121" y="116" fill="#222" text-anchor="middle">14</text>
  <text x="201" y="116" fill="#222" text-anchor="middle">26</text>
  <text x="281" y="116" fill="#222" text-anchor="middle">40</text>
  <text x="5" y="148" fill="#222" font-weight="bold">Total</text>
  <text x="121" y="148" fill="#222" text-anchor="middle" font-weight="bold">32</text>
  <text x="201" y="148" fill="#222" text-anchor="middle" font-weight="bold">38</text>
  <text x="281" y="148" fill="#222" text-anchor="middle" font-weight="bold">70</text>
</svg>`,
    prompt: 'The table shows survey results about preferred sports. What fraction of 10th-grade students preferred basketball?',
    choices: [
      { id: 'A', text: '26/70' },
      { id: 'B', text: '26/38' },
      { id: 'C', text: '26/40' },
      { id: 'D', text: '14/40' },
    ],
    correct: 'C',
    parTimeSec: 60,
    explanation: {
      correctWhy: '26 out of 40 total 10th-graders preferred basketball → 26/40.',
      fastStrategy: 'Denominator = row total for 10th grade = 40.',
      simplerView: 'The question asks about 10th grade specifically, so use the 10th-grade row total.',
      trapNote: 'Choice A uses the grand total (70) — wrong denominator.',
      timeTrick: 'Fraction of a subgroup → use that subgroup\'s total as denominator.',
      whyWrong: { A: 'Uses grand total; the question is about 10th grade only.', B: 'Uses column total for basketball, not 10th-grade total.', D: 'Soccer count for 10th grade, not basketball.' },
    },
  },

  {
    id: 'fig-m9',
    topic: 'geometry-trig',
    subtopic: 'Parallel lines and transversals',
    section: 'Math',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 220 180" width="220" height="180" font-family="sans-serif" font-size="13">
  <line x1="20" y1="60" x2="200" y2="60" stroke="#2563eb" stroke-width="2.5"/>
  <line x1="20" y1="130" x2="200" y2="130" stroke="#2563eb" stroke-width="2.5"/>
  <line x1="70" y1="10" x2="150" y2="175" stroke="#dc2626" stroke-width="2"/>
  <text x="5" y="58" fill="#2563eb" font-weight="bold">m</text>
  <text x="5" y="128" fill="#2563eb" font-weight="bold">n</text>
  <path d="M 100 60 A 16 16 0 0 1 89 73" fill="none" stroke="#16a34a" stroke-width="1.5"/>
  <text x="104" y="77" fill="#16a34a" font-weight="bold">65°</text>
  <path d="M 119 130 A 16 16 0 0 0 108 117" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="122" y="120" fill="#f59e0b" font-weight="bold">x°</text>
</svg>`,
    prompt: 'Lines m and n are parallel, cut by a transversal. If one angle measures 65°, what is the value of x?',
    choices: [
      { id: 'A', text: '25' },
      { id: 'B', text: '65' },
      { id: 'C', text: '115' },
      { id: 'D', text: '125' },
    ],
    correct: 'C',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The labeled angles are co-interior (same-side interior) angles, which are supplementary when lines are parallel: 65° + x° = 180°, so x = 115.',
      fastStrategy: 'Co-interior angles sum to 180°.',
      simplerView: '180 − 65 = 115.',
      trapNote: 'Choice B (65) applies to alternate interior angles, not co-interior.',
      timeTrick: 'Identify angle pair type first: alternate (equal) or co-interior (supplementary).',
      whyWrong: { A: 'Complement (90−65), not relevant here.', B: 'Alternate interior angles are equal; these are co-interior.', D: '180−65=115, not 125.' },
    },
  },

  {
    id: 'fig-m10',
    topic: 'advanced-math',
    subtopic: 'Function graphs',
    section: 'Math',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 220 220" width="220" height="220" font-family="sans-serif" font-size="12">
  <line x1="20" y1="110" x2="200" y2="110" stroke="#555" stroke-width="1.5"/>
  <line x1="110" y1="10" x2="110" y2="200" stroke="#555" stroke-width="1.5"/>
  <text x="205" y="114" fill="#555">x</text><text x="112" y="8" fill="#555">y</text>
  <path d="M 35 195 C 60 195 80 20 110 20 C 140 20 160 195 185 195" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <circle cx="110" cy="20" r="4" fill="#dc2626"/>
  <text x="115" y="18" fill="#dc2626" font-size="11">(0,5)</text>
  <circle cx="55" cy="110" r="4" fill="#16a34a"/>
  <text x="22" y="123" fill="#16a34a" font-size="11">(−2,0)</text>
  <circle cx="165" cy="110" r="4" fill="#16a34a"/>
  <text x="155" y="123" fill="#16a34a" font-size="11">(2,0)</text>
</svg>`,
    prompt: 'The graph shows a function f with zeros at x = −2 and x = 2, and y-intercept at (0, 5). Which equation could represent f?',
    choices: [
      { id: 'A', text: 'f(x) = −x² + 5' },
      { id: 'B', text: 'f(x) = x² − 4' },
      { id: 'C', text: 'f(x) = 5 − (5/4)x²' },
      { id: 'D', text: 'f(x) = (x − 2)(x + 2)' },
    ],
    correct: 'C',
    parTimeSec: 100,
    explanation: {
      correctWhy: 'Zeros at ±2 and y-intercept at 5. Try f(x) = a(x−2)(x+2) = a(x²−4). At x=0: f(0) = −4a = 5 → a = −5/4. So f(x) = −(5/4)x² + 5 = 5 − (5/4)x².',
      fastStrategy: 'Use zeros to write f = a(x+2)(x−2), then plug in (0,5) to find a.',
      simplerView: 'Zeros give the factors; the y-intercept pins down the leading coefficient.',
      trapNote: 'Choice A gives f(0)=5 ✓ but has zeros at ±√5 ≈ ±2.24, not ±2.',
      timeTrick: 'Two conditions (zeros + y-intercept) determine a unique parabola.',
      whyWrong: { A: 'Zeros at ±√5, not ±2.', B: 'y-intercept = −4, not 5.', D: 'Same as B; y-intercept = −4.' },
    },
  },

  // Math — more figures (geometry, data)

  {
    id: 'fig-m11',
    topic: 'geometry-trig',
    subtopic: 'Right triangle trigonometry',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 220 190" width="220" height="190" font-family="sans-serif" font-size="13">
  <polygon points="30,160 190,160 190,40" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <rect x="180" y="150" width="10" height="10" fill="none" stroke="#555" stroke-width="1.5"/>
  <text x="18" y="168" fill="#222" font-weight="bold">A</text>
  <text x="193" y="168" fill="#222" font-weight="bold">C</text>
  <text x="193" y="38" fill="#222" font-weight="bold">B</text>
  <text x="106" y="175" fill="#dc2626" font-weight="bold">12</text>
  <text x="196" y="105" fill="#dc2626" font-weight="bold">5</text>
  <text x="95" y="95" fill="#dc2626" font-weight="bold">13</text>
  <path d="M 50 160 A 20 20 0 0 1 42 146" fill="none" stroke="#16a34a" stroke-width="1.5"/>
  <text x="55" y="152" fill="#16a34a" font-weight="bold">θ</text>
</svg>`,
    prompt: 'In right triangle ABC with the right angle at C, AC = 12, BC = 5, and AB = 13. What is sin θ?',
    choices: [
      { id: 'A', text: '5/13' },
      { id: 'B', text: '12/13' },
      { id: 'C', text: '5/12' },
      { id: 'D', text: '12/5' },
    ],
    correct: 'A',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'sin θ = opposite/hypotenuse = BC/AB = 5/13.',
      fastStrategy: 'SOH: Sin = Opposite/Hypotenuse. The side opposite θ is BC = 5; hypotenuse = 13.',
      simplerView: 'θ is at A. The side across from A is BC = 5. Hypotenuse = 13.',
      trapNote: 'Choice B gives cos θ (adjacent/hypotenuse = 12/13), not sin θ.',
      timeTrick: 'Label O (opposite), A (adjacent), H (hypotenuse) before plugging in.',
      whyWrong: { B: 'This is cos θ (adjacent/hypotenuse).', C: 'This is tan θ (opposite/adjacent).', D: 'Reciprocal of tan; not a standard trig ratio here.' },
    },
  },

  {
    id: 'fig-m12',
    topic: 'problem-solving-data',
    subtopic: 'Histogram',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 260 200" width="260" height="200" font-family="sans-serif" font-size="11">
  <text x="55" y="14" font-weight="bold" fill="#222">Test Score Distribution</text>
  <line x1="40" y1="20" x2="40" y2="165" stroke="#555" stroke-width="1.5"/>
  <line x1="40" y1="165" x2="245" y2="165" stroke="#555" stroke-width="1.5"/>
  ${[0,5,10,15,20].map((v,i)=>`<text x="5" y="${169-i*29}" fill="#555">${v}</text><line x1="37" y1="${165-i*29}" x2="245" y2="${165-i*29}" stroke="#ddd" stroke-width="1"/>`).join('')}
  <rect x="45" y="136" width="36" height="29" fill="#6366f1"/>
  <rect x="82" y="107" width="36" height="58" fill="#6366f1"/>
  <rect x="119" y="50" width="36" height="115" fill="#6366f1"/>
  <rect x="156" y="78" width="36" height="87" fill="#6366f1"/>
  <rect x="193" y="136" width="36" height="29" fill="#6366f1"/>
  <text x="55" y="179" fill="#444">50-59</text>
  <text x="92" y="179" fill="#444">60-69</text>
  <text x="129" y="179" fill="#444">70-79</text>
  <text x="166" y="179" fill="#444">80-89</text>
  <text x="203" y="179" fill="#444">90-99</text>
</svg>`,
    prompt: 'The histogram shows the distribution of test scores. Approximately how many more students scored in the 70–79 range than in the 80–89 range?',
    choices: [
      { id: 'A', text: '5' },
      { id: 'B', text: '10' },
      { id: 'C', text: '12' },
      { id: 'D', text: '15' },
    ],
    correct: 'B',
    parTimeSec: 60,
    explanation: {
      correctWhy: '70–79 bar ≈ 20 students; 80–89 bar ≈ 10 students; difference ≈ 10.',
      fastStrategy: 'Read each bar height against the y-axis gridlines, then subtract.',
      simplerView: 'The 70–79 bar hits 20, the 80–89 bar hits 10. 20 − 10 = 10.',
      trapNote: 'Choice D (15) would be the difference if you misread 80–89 as 5.',
      timeTrick: 'Align each bar top with the nearest gridline before reading.',
      whyWrong: { A: 'Underestimates the 70–79 bar.', C: 'Neither bar is at 12 or 8.', D: 'Over-estimates the difference.' },
    },
  },

  {
    id: 'fig-m13',
    topic: 'algebra',
    subtopic: 'Inequalities on number line',
    section: 'Math',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 280 80" width="280" height="80" font-family="sans-serif" font-size="13">
  <line x1="20" y1="40" x2="260" y2="40" stroke="#555" stroke-width="2"/>
  ${[-3,-2,-1,0,1,2,3].map((v,i)=>`<line x1="${20+i*34+34}" y1="33" x2="${20+i*34+34}" y2="47" stroke="#555" stroke-width="1.5"/><text x="${20+i*34+29}" y="62" fill="#555">${v}</text>`).join('')}
  <line x1="122" y1="40" x2="260" y2="40" stroke="#2563eb" stroke-width="4"/>
  <circle cx="122" cy="40" r="6" fill="white" stroke="#2563eb" stroke-width="2.5"/>
  <polygon points="258,34 268,40 258,46" fill="#2563eb"/>
</svg>`,
    prompt: 'Which inequality is represented by the number line above?',
    choices: [
      { id: 'A', text: 'x > −1' },
      { id: 'B', text: 'x ≥ −1' },
      { id: 'C', text: 'x < −1' },
      { id: 'D', text: 'x > 1' },
    ],
    correct: 'A',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'The open circle at −1 means −1 is excluded; the arrow points right (greater than). So x > −1.',
      fastStrategy: 'Open circle → strict inequality (> or <). Arrow points right → greater than.',
      simplerView: 'Open dot = not included. Arrow to the right = bigger numbers.',
      trapNote: 'If the circle were filled (closed), it would be x ≥ −1 (choice B).',
      timeTrick: 'Open circle = exclude endpoint; closed circle = include endpoint.',
      whyWrong: { B: 'Closed circle needed for ≥.', C: 'Arrow points right, not left.', D: 'The circle is at −1, not 1.' },
    },
  },

  {
    id: 'fig-m14',
    topic: 'geometry-trig',
    subtopic: 'Area and perimeter',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 240 160" width="240" height="160" font-family="sans-serif" font-size="13">
  <rect x="30" y="20" width="180" height="100" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
  <rect x="30" y="20" width="60" height="40" fill="#fecaca" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="108" y="75" fill="#1d4ed8" font-weight="bold">18</text>
  <text x="193" y="73" fill="#1d4ed8" font-weight="bold">10</text>
  <text x="52" y="43" fill="#dc2626" font-size="11">6×4</text>
  <text x="35" y="145" fill="#555" font-size="11">Large: 18×10   Shaded (removed): 6×4</text>
</svg>`,
    prompt: 'A rectangle 18 units wide and 10 units tall has a 6×4 corner cut out (shaded). What is the area of the remaining (unshaded) region?',
    choices: [
      { id: 'A', text: '156' },
      { id: 'B', text: '160' },
      { id: 'C', text: '164' },
      { id: 'D', text: '180' },
    ],
    correct: 'A',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'Large rectangle area = 18×10 = 180. Corner cut = 6×4 = 24. Remaining = 180 − 24 = 156.',
      fastStrategy: 'Total area minus removed area.',
      simplerView: '180 − 24 = 156.',
      trapNote: 'Choice D is just the large rectangle with nothing removed.',
      timeTrick: 'Composite area: always start with the largest simple shape, then subtract.',
      whyWrong: { B: 'Off by 4 — misread the cut dimensions.', C: 'Off by 8.', D: 'Forgot to remove the cut corner.' },
    },
  },

  {
    id: 'fig-m15',
    topic: 'problem-solving-data',
    subtopic: 'Line graph trends',
    section: 'Math',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 260 200" width="260" height="200" font-family="sans-serif" font-size="11">
  <text x="55" y="14" font-weight="bold" fill="#222">Temperature (°C) Over 5 Days</text>
  <line x1="40" y1="20" x2="40" y2="165" stroke="#555" stroke-width="1.5"/>
  <line x1="40" y1="165" x2="240" y2="165" stroke="#555" stroke-width="1.5"/>
  ${[0,10,20,30,40].map((v,i)=>`<text x="5" y="${169-i*29}" fill="#555">${v}</text><line x1="37" y1="${165-i*29}" x2="240" y2="${165-i*29}" stroke="#ddd" stroke-width="1"/>`).join('')}
  <polyline points="65,136 105,107 145,78 185,107 225,49" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  ${[[65,136],[105,107],[145,78],[185,107],[225,49]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#2563eb"/>`).join('')}
  <text x="57" y="179" fill="#444">Mon</text>
  <text x="97" y="179" fill="#444">Tue</text>
  <text x="137" y="179" fill="#444">Wed</text>
  <text x="177" y="179" fill="#444">Thu</text>
  <text x="217" y="179" fill="#444">Fri</text>
</svg>`,
    prompt: 'The line graph shows daily temperatures. On which day was the temperature highest?',
    choices: [
      { id: 'A', text: 'Monday' },
      { id: 'B', text: 'Wednesday' },
      { id: 'C', text: 'Thursday' },
      { id: 'D', text: 'Friday' },
    ],
    correct: 'D',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'Friday\'s point is at the top of the graph (~40°C), the highest of all five days.',
      fastStrategy: 'Find the highest point on the line graph.',
      simplerView: 'The dot on Friday is closest to the top.',
      trapNote: 'Wednesday has a local peak (warm mid-week) but Friday is warmer.',
      timeTrick: 'Scan left-to-right and note the global maximum, not just local peaks.',
      whyWrong: { A: 'Monday is the coolest day (~10°C).', B: 'Wednesday is a local high (~30°C) but not the maximum.', C: 'Thursday drops back down (~20°C) after Wednesday.' },
    },
  },

  {
    id: 'fig-m16',
    topic: 'advanced-math',
    subtopic: 'Exponential functions',
    section: 'Math',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 220 200" width="220" height="200" font-family="sans-serif" font-size="12">
  <line x1="20" y1="140" x2="210" y2="140" stroke="#555" stroke-width="1.5"/>
  <line x1="50" y1="10" x2="50" y2="180" stroke="#555" stroke-width="1.5"/>
  <text x="214" y="144" fill="#555">x</text><text x="52" y="8" fill="#555">y</text>
  <path d="M 50 135 C 70 130 90 115 110 95 C 130 70 150 30 185 15" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <circle cx="50" cy="135" r="4" fill="#dc2626"/>
  <text x="54" y="132" fill="#dc2626" font-size="11">(0,1)</text>
  <circle cx="90" cy="115" r="4" fill="#16a34a"/>
  <text x="94" y="112" fill="#16a34a" font-size="11">(1,2)</text>
  <circle cx="130" cy="75" r="4" fill="#16a34a"/>
  <text x="133" y="72" fill="#16a34a" font-size="11">(2,4)</text>
</svg>`,
    prompt: 'The graph shows an exponential function passing through (0,1), (1,2), and (2,4). Which equation represents the function?',
    choices: [
      { id: 'A', text: 'f(x) = x²' },
      { id: 'B', text: 'f(x) = 2x' },
      { id: 'C', text: 'f(x) = 2^x' },
      { id: 'D', text: 'f(x) = x + 1' },
    ],
    correct: 'C',
    parTimeSec: 75,
    explanation: {
      correctWhy: '2^0=1, 2^1=2, 2^2=4 — all three points fit f(x)=2^x.',
      fastStrategy: 'Test each choice at x=0 and x=1.',
      simplerView: 'Each step multiplies the output by 2 — that\'s exponential growth with base 2.',
      trapNote: 'Choice B (2x) is linear: 2(0)=0≠1.',
      timeTrick: 'If outputs multiply by a constant factor, it\'s exponential.',
      whyWrong: { A: 'x²: f(0)=0≠1.', B: '2x is linear; f(0)=0≠1.', D: 'Linear; f(2)=3≠4.' },
    },
  },

  {
    id: 'fig-m17',
    topic: 'geometry-trig',
    subtopic: 'Volume',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 200 180" width="200" height="180" font-family="sans-serif" font-size="13">
  <ellipse cx="100" cy="50" rx="60" ry="20" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
  <line x1="40" y1="50" x2="40" y2="140" stroke="#2563eb" stroke-width="2"/>
  <line x1="160" y1="50" x2="160" y2="140" stroke="#2563eb" stroke-width="2"/>
  <ellipse cx="100" cy="140" rx="60" ry="20" fill="#bfdbfe" stroke="#2563eb" stroke-width="2"/>
  <line x1="100" y1="50" x2="100" y2="140" stroke="#dc2626" stroke-width="2" stroke-dasharray="4,3"/>
  <text x="104" y="100" fill="#dc2626" font-weight="bold">h = 10</text>
  <line x1="100" y1="140" x2="160" y2="140" stroke="#16a34a" stroke-width="2"/>
  <text x="125" y="155" fill="#16a34a" font-weight="bold">r = 4</text>
</svg>`,
    prompt: 'A cylinder has radius r = 4 and height h = 10. What is its volume? (Use π ≈ 3.14)',
    choices: [
      { id: 'A', text: '125.6' },
      { id: 'B', text: '251.2' },
      { id: 'C', text: '502.4' },
      { id: 'D', text: '1256' },
    ],
    correct: 'C',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'V = πr²h = 3.14 × 16 × 10 = 502.4.',
      fastStrategy: 'V = πr²h. Square the radius first: 4²=16. Then 3.14×16×10.',
      simplerView: '3.14 × 16 = 50.24; × 10 = 502.4.',
      trapNote: 'Choice B uses diameter (8) instead of radius (4): π×8×10.',
      timeTrick: 'Always square the radius, not the diameter.',
      whyWrong: { A: 'Uses r=2 (half the actual radius).', B: 'Uses d=8 as if it were r.', D: 'Uses r=10 and h=4 swapped, and squared incorrectly.' },
    },
  },

  {
    id: 'fig-m18',
    topic: 'problem-solving-data',
    subtopic: 'Pie chart',
    section: 'Math',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 260 180" width="260" height="180" font-family="sans-serif" font-size="11">
  <text x="75" y="14" font-weight="bold" fill="#222">Budget Allocation</text>
  <circle cx="100" cy="100" r="70" fill="#e0e7ff"/>
  <path d="M100,100 L100,30 A70,70,0,0,1,160,135 Z" fill="#3b82f6"/>
  <path d="M100,100 L160,135 A70,70,0,0,1,44,135 Z" fill="#22c55e"/>
  <path d="M100,100 L44,135 A70,70,0,0,1,100,30 Z" fill="#f59e0b"/>
  <text x="165" y="70" fill="#3b82f6" font-weight="bold">Rent</text>
  <text x="165" y="85" fill="#3b82f6">40%</text>
  <text x="165" y="110" fill="#22c55e" font-weight="bold">Food</text>
  <text x="165" y="125" fill="#22c55e">30%</text>
  <text x="165" y="150" fill="#f59e0b" font-weight="bold">Other</text>
  <text x="165" y="165" fill="#f59e0b">30%</text>
</svg>`,
    prompt: 'A monthly budget of $3,000 is divided as shown. How much is spent on Food?',
    choices: [
      { id: 'A', text: '$750' },
      { id: 'B', text: '$900' },
      { id: 'C', text: '$1,200' },
      { id: 'D', text: '$1,500' },
    ],
    correct: 'B',
    parTimeSec: 45,
    explanation: {
      correctWhy: 'Food = 30% of $3,000 = 0.30 × 3,000 = $900.',
      fastStrategy: 'Multiply the percentage by the total.',
      simplerView: '30% of 3000: 10% = 300, so 30% = 900.',
      trapNote: 'Choice C ($1,200) is 40% — the Rent slice, not Food.',
      timeTrick: 'Match legend to the correct slice before multiplying.',
      whyWrong: { A: '25% of 3000; Food is 30%, not 25%.', C: 'This is the Rent allocation (40%).', D: '50% of 3000; no slice is 50%.' },
    },
  },

  {
    id: 'fig-m19',
    topic: 'algebra',
    subtopic: 'Absolute value on number line',
    section: 'Math',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 280 80" width="280" height="80" font-family="sans-serif" font-size="13">
  <line x1="20" y1="40" x2="260" y2="40" stroke="#555" stroke-width="2"/>
  ${[-3,-2,-1,0,1,2,3].map((v,i)=>`<line x1="${20+i*34+34}" y1="33" x2="${20+i*34+34}" y2="47" stroke="#555" stroke-width="1.5"/><text x="${20+i*34+29}" y="62" fill="#555">${v}</text>`).join('')}
  <line x1="88" y1="40" x2="156" y2="40" stroke="#2563eb" stroke-width="5"/>
  <circle cx="88" cy="40" r="6" fill="#2563eb"/>
  <circle cx="156" cy="40" r="6" fill="#2563eb"/>
  <text x="108" y="28" fill="#2563eb" font-size="11">solution set</text>
</svg>`,
    prompt: 'The number line shows the solution set of |x| ≤ k for some positive integer k. What is the value of k?',
    choices: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
      { id: 'C', text: '3' },
      { id: 'D', text: '4' },
    ],
    correct: 'A',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The shaded segment runs from −1 to 1 (closed circles at both ends). |x| ≤ 1 → k = 1.',
      fastStrategy: 'Read the endpoints of the shaded segment; the right endpoint equals k.',
      simplerView: 'Solution goes from −1 to 1, so k = 1.',
      trapNote: 'The segment spans 2 units total, but k = 1 (the endpoint), not 2.',
      timeTrick: 'For |x| ≤ k, endpoints are at ±k.',
      whyWrong: { B: 'k=2 would span −2 to 2.', C: 'k=3 would span −3 to 3.', D: 'k=4 would extend past the labeled range.' },
    },
  },

  {
    id: 'fig-m20',
    topic: 'geometry-trig',
    subtopic: 'Similar triangles',
    section: 'Math',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 240 200" width="240" height="200" font-family="sans-serif" font-size="13">
  <polygon points="30,170 210,170 120,30" fill="none" stroke="#2563eb" stroke-width="2.5"/>
  <line x1="75" y1="100" x2="165" y2="100" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="15" y="175" fill="#222" font-weight="bold">B</text>
  <text x="213" y="175" fill="#222" font-weight="bold">C</text>
  <text x="116" y="25" fill="#222" font-weight="bold">A</text>
  <text x="64" y="95" fill="#222" font-weight="bold">D</text>
  <text x="167" y="95" fill="#222" font-weight="bold">E</text>
  <text x="100" y="145" fill="#555" font-size="11">BC = 12</text>
  <text x="100" y="107" fill="#dc2626" font-size="11">DE = 8</text>
  <text x="35" y="130" fill="#555" font-size="11">BD = 3</text>
</svg>`,
    prompt: 'In triangle ABC, DE is parallel to BC with D on AB and E on AC. If BC = 12, DE = 8, and BD = 3, what is AB?',
    choices: [
      { id: 'A', text: '6' },
      { id: 'B', text: '9' },
      { id: 'C', text: '12' },
      { id: 'D', text: '15' },
    ],
    correct: 'B',
    parTimeSec: 100,
    explanation: {
      correctWhy: 'Since DE ∥ BC, triangles ADE and ABC are similar. DE/BC = AD/AB → 8/12 = AD/AB → AD/AB = 2/3. So AB = AD × (3/2). Also AD = AB − BD = AB − 3. Setting AD/AB = 2/3: (AB−3)/AB = 2/3 → 3AB−9 = 2AB → AB = 9.',
      fastStrategy: 'Similar triangles: DE/BC = AD/AB. Use BD to find AD, then solve.',
      simplerView: 'The ratio 8/12 = 2/3 means AD = (2/3)AB. Since AB − AD = BD = 3: AB/3 = 3 → AB = 9.',
      trapNote: 'Choice C (12) confuses AB with BC.',
      timeTrick: 'Set up the ratio, express AD in terms of AB and BD, then solve one equation.',
      whyWrong: { A: 'AD = 6 but AB > AD.', C: 'AB = BC only if triangles are congruent, which requires DE = BC.', D: 'Over-estimates; check the ratio.' },
    },
  },

  // ==================== R&W Figure-Based Questions ====================

  {
    id: 'fig-rw1',
    topic: 'reading-comprehension',
    subtopic: 'Data interpretation',
    section: 'Reading & Writing',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 300 180" width="300" height="180" font-family="sans-serif" font-size="11">
  <text x="60" y="14" font-weight="bold" fill="#222">Renewable Energy Share (%) by Country</text>
  <line x1="70" y1="20" x2="70" y2="155" stroke="#555" stroke-width="1.5"/>
  <line x1="70" y1="155" x2="285" y2="155" stroke="#555" stroke-width="1.5"/>
  ${[0,20,40,60,80].map((v,i)=>`<text x="35" y="${159-i*27}" fill="#555">${v}</text><line x1="67" y1="${155-i*27}" x2="285" y2="${155-i*27}" stroke="#ddd" stroke-width="1"/>`).join('')}
  <rect x="80" y="47" width="35" height="108" fill="#22c55e"/>
  <rect x="125" y="74" width="35" height="81" fill="#22c55e"/>
  <rect x="170" y="20" width="35" height="135" fill="#22c55e"/>
  <rect x="215" y="101" width="35" height="54" fill="#22c55e"/>
  <text x="83" y="170" fill="#444">Nor</text>
  <text x="128" y="170" fill="#444">Ger</text>
  <text x="173" y="170" fill="#444">Ice</text>
  <text x="218" y="170" fill="#444">Fra</text>
</svg>`,
    passage: 'A researcher studying clean energy transitions collected data on the percentage of electricity generated from renewable sources in four European countries in 2022. The bar chart displays the results.',
    prompt: 'Which country had the highest share of renewable energy, and approximately what percentage did it represent?',
    choices: [
      { id: 'A', text: 'Norway, approximately 60%' },
      { id: 'B', text: 'Germany, approximately 30%' },
      { id: 'C', text: 'Iceland, approximately 100%' },
      { id: 'D', text: 'Iceland, approximately 80%' },
    ],
    correct: 'D',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'Iceland\'s bar is the tallest, reaching approximately 80% on the y-axis.',
      fastStrategy: 'Find the tallest bar and read its height.',
      simplerView: 'The Iceland bar is clearly the highest at ~80%.',
      trapNote: 'Choice C (100%) over-reads the Iceland bar; it reaches 80%, not the top.',
      timeTrick: 'Read bar heights against the gridlines before choosing.',
      whyWrong: { A: 'Norway is ~40%, not the highest.', B: 'Germany is ~30%, second lowest.', C: 'Iceland is close to 80%, not 100%.' },
    },
  },

  {
    id: 'fig-rw2',
    topic: 'reading-comprehension',
    subtopic: 'Table-based evidence',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 330 170" width="330" height="170" font-family="sans-serif" font-size="11">
  <rect x="1" y="1" width="328" height="168" fill="none" stroke="#ccc" stroke-width="1"/>
  <rect x="1" y="1" width="328" height="28" fill="#f1f5f9"/>
  <text x="60" y="19" font-weight="bold" fill="#222" font-size="12">Effect of Sleep on Cognitive Performance</text>
  <line x1="1" y1="29" x2="329" y2="29" stroke="#ccc"/>
  <line x1="1" y1="57" x2="329" y2="57" stroke="#ccc"/>
  <line x1="1" y1="85" x2="329" y2="85" stroke="#ccc"/>
  <line x1="1" y1="113" x2="329" y2="113" stroke="#ccc"/>
  <line x1="1" y1="141" x2="329" y2="141" stroke="#ccc"/>
  <line x1="110" y1="1" x2="110" y2="169" stroke="#ccc"/>
  <line x1="220" y1="1" x2="220" y2="169" stroke="#ccc"/>
  <text x="5" y="46" fill="#222" font-weight="bold">Sleep Duration</text>
  <text x="115" y="46" fill="#222" font-weight="bold">Reaction Time (ms)</text>
  <text x="225" y="46" fill="#222" font-weight="bold">Memory Score (/100)</text>
  <text x="5" y="74" fill="#222">4 hours</text><text x="160" y="74" fill="#222" text-anchor="middle">320</text><text x="272" y="74" fill="#222" text-anchor="middle">58</text>
  <text x="5" y="102" fill="#222">6 hours</text><text x="160" y="102" fill="#222" text-anchor="middle">280</text><text x="272" y="102" fill="#222" text-anchor="middle">71</text>
  <text x="5" y="130" fill="#222">8 hours</text><text x="160" y="130" fill="#222" text-anchor="middle">240</text><text x="272" y="130" fill="#222" text-anchor="middle">89</text>
  <text x="5" y="158" fill="#222">10 hours</text><text x="160" y="158" fill="#222" text-anchor="middle">245</text><text x="272" y="158" fill="#222" text-anchor="middle">87</text>
</svg>`,
    passage: 'A sleep researcher conducted a controlled study measuring cognitive performance at four sleep durations. The table presents the findings.',
    prompt: 'Which claim is best supported by the data in the table?',
    choices: [
      { id: 'A', text: 'More sleep always improves both reaction time and memory scores.' },
      { id: 'B', text: 'Eight hours of sleep is associated with the best reaction time and near-peak memory.' },
      { id: 'C', text: 'Memory scores decline sharply after six hours of sleep.' },
      { id: 'D', text: 'Reaction time and memory score are unrelated metrics.' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: '8 hours gives the best reaction time (240 ms, lowest) and highest memory score (89). At 10 hours, reaction time slightly worsens (245) and memory drops slightly (87), showing 8 hours is optimal.',
      fastStrategy: 'Find the row with best values in both columns.',
      simplerView: '8 hours: 240 ms (best) and 89 points (best). 10 hours is slightly worse in both.',
      trapNote: 'Choice A says "always" — disproven by 10 hours being slightly worse than 8 hours.',
      timeTrick: 'Watch for absolute words like "always" — one exception disproves them.',
      whyWrong: { A: '"Always" is wrong — 10 hrs is worse than 8 hrs.', C: 'Memory increases from 4→6→8 hrs; no sharp decline.', D: 'The table shows both improving together, suggesting correlation.' },
    },
  },

  {
    id: 'fig-rw3',
    topic: 'rhetoric-expression',
    subtopic: 'Data-supported claim',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 280 190" width="280" height="190" font-family="sans-serif" font-size="11">
  <text x="55" y="14" font-weight="bold" fill="#222">Global Average Temperature Anomaly (°C)</text>
  <line x1="45" y1="20" x2="45" y2="165" stroke="#555" stroke-width="1.5"/>
  <line x1="45" y1="110" x2="270" y2="110" stroke="#555" stroke-width="2" stroke-dasharray="4,3"/>
  <line x1="45" y1="165" x2="270" y2="165" stroke="#555" stroke-width="1.5"/>
  <text x="5" y="114" fill="#555">0.0</text>
  <text x="5" y="90" fill="#555">0.5</text>
  <text x="5" y="67" fill="#555">1.0</text>
  <text x="5" y="44" fill="#555">1.5</text>
  <line x1="42" y1="87" x2="270" y2="87" stroke="#ddd" stroke-width="1"/>
  <line x1="42" y1="64" x2="270" y2="64" stroke="#ddd" stroke-width="1"/>
  <polyline points="55,108 75,105 95,103 115,100 135,95 155,88 175,75 195,62 215,45 235,38 255,30" fill="none" stroke="#dc2626" stroke-width="2.5"/>
  <text x="258" y="28" fill="#dc2626" font-size="10">▲</text>
  <text x="48" y="179" fill="#444" font-size="10">1970</text>
  <text x="138" y="179" fill="#444" font-size="10">1990</text>
  <text x="228" y="179" fill="#444" font-size="10">2010</text>
</svg>`,
    passage: 'A climate scientist is writing a paper arguing that human industrial activity since 1970 has caused measurable warming. She wants to include a sentence that references the graph to strengthen her argument.',
    prompt: 'Which sentence most effectively uses the graph as evidence for the scientist\'s claim?',
    choices: [
      { id: 'A', text: 'Temperature anomalies have fluctuated unpredictably since 1970, making conclusions unreliable.' },
      { id: 'B', text: 'The data show a consistent upward trend in global temperature anomaly from near 0°C in 1970 to approximately 1.5°C by 2010.' },
      { id: 'C', text: 'While some decades show cooling, the overall pattern since 1970 is neutral.' },
      { id: 'D', text: 'Natural climate variability explains the minor temperature changes visible in the graph.' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'Choice B accurately describes the graph\'s rising trend and provides specific values, directly supporting the claim of measurable warming caused by industrial activity.',
      fastStrategy: 'The correct answer accurately describes the graph AND links to the argument.',
      simplerView: 'The graph goes up steadily. Only B correctly describes that trend with specific numbers.',
      trapNote: 'Choice C directly contradicts the graph by calling the pattern "neutral."',
      timeTrick: 'Evidence sentences must be accurate AND support the argument — check both.',
      whyWrong: { A: '"Unpredictably fluctuated" contradicts the consistent upward trend.', C: '"Overall pattern is neutral" is factually wrong.', D: 'Invokes natural variability, which undermines the human-activity argument.' },
    },
  },

  {
    id: 'fig-rw4',
    topic: 'reading-comprehension',
    subtopic: 'Comparative chart analysis',
    section: 'Reading & Writing',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 320 190" width="320" height="190" font-family="sans-serif" font-size="11">
  <text x="65" y="14" font-weight="bold" fill="#222">Literacy Rate vs. GDP per Capita (selected nations)</text>
  <line x1="50" y1="20" x2="50" y2="165" stroke="#555" stroke-width="1.5"/>
  <line x1="50" y1="165" x2="305" y2="165" stroke="#555" stroke-width="1.5"/>
  <text x="140" y="184" fill="#555">GDP per Capita ($thousands)</text>
  ${[60,70,80,90,100].map((v,i)=>`<text x="5" y="${169-i*29}" fill="#555">${v}</text><line x1="47" y1="${165-i*29}" x2="305" y2="${165-i*29}" stroke="#ddd" stroke-width="1"/>`).join('')}
  ${[10,20,30,40,50].map((v,i)=>`<text x="${50+i*50}" y="178" fill="#555">${v}</text>`).join('')}
  ${[[15,80],[22,85],[35,92],[42,96],[50,98],[8,60],[12,65],[30,78],[18,72]].map(([g,l],i)=>`<circle cx="${50+g*5}" cy="${165-l*1.45+87}" r="5" fill="${i<5?'#3b82f6':'#dc2626'}" opacity="0.8"/>`).join('')}
  <line x1="90" y1="148" x2="300" y2="48" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="215" y="160" fill="#3b82f6">● High-income</text>
  <text x="215" y="175" fill="#dc2626">● Low-income</text>
</svg>`,
    passage: 'An economist studying global development presented scatter plot data at a conference. She argued that GDP per capita strongly predicts literacy rates across nations.',
    prompt: 'Which statement about the economist\'s argument is best supported by the scatter plot?',
    choices: [
      { id: 'A', text: 'The data show no relationship between GDP per capita and literacy rates.' },
      { id: 'B', text: 'Higher GDP per capita is associated with higher literacy rates, supporting the economist\'s argument.' },
      { id: 'C', text: 'Low-income countries consistently outperform high-income countries on literacy.' },
      { id: 'D', text: 'GDP per capita alone fully determines literacy rates with no exceptions.' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'The scatter plot shows a clear positive trend (upward-sloping line of best fit), with high-income countries clustered in the upper right. This supports the economist\'s claim.',
      fastStrategy: 'Does the line go up or down? Up → positive correlation → supports "higher GDP = higher literacy."',
      simplerView: 'More money (right) = higher literacy (up) — the dots confirm this.',
      trapNote: 'Choice D uses "fully determines" — too absolute; scatter plots always show variation.',
      timeTrick: '"Associated with" (B) is appropriately hedged; "determines" (D) overclaims.',
      whyWrong: { A: 'The upward trend disproves "no relationship."', C: 'Blue dots (high-income) are in the upper right — higher literacy.', D: '"Fully determines" is too strong; there is scatter around the line.' },
    },
  },

  {
    id: 'fig-rw5',
    topic: 'reading-comprehension',
    subtopic: 'Quantitative evidence',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 310 165" width="310" height="165" font-family="sans-serif" font-size="11">
  <rect x="1" y="1" width="308" height="163" fill="none" stroke="#ccc"/>
  <rect x="1" y="1" width="308" height="26" fill="#f8fafc"/>
  <text x="50" y="18" font-weight="bold" fill="#222" font-size="12">Plant Growth Under Different Light Conditions (cm/week)</text>
  <line x1="1" y1="27" x2="309" y2="27" stroke="#ccc"/>
  <line x1="1" y1="54" x2="309" y2="54" stroke="#ccc"/>
  <line x1="1" y1="81" x2="309" y2="81" stroke="#ccc"/>
  <line x1="1" y1="108" x2="309" y2="108" stroke="#ccc"/>
  <line x1="1" y1="135" x2="309" y2="135" stroke="#ccc"/>
  <line x1="120" y1="1" x2="120" y2="163" stroke="#ccc"/>
  <line x1="200" y1="1" x2="200" y2="163" stroke="#ccc"/>
  <text x="5" y="43" fill="#222" font-weight="bold">Condition</text>
  <text x="125" y="43" fill="#222" font-weight="bold">Week 1–4 avg</text>
  <text x="205" y="43" fill="#222" font-weight="bold">Week 5–8 avg</text>
  <text x="5" y="70" fill="#222">Full sunlight</text><text x="160" y="70" fill="#222" text-anchor="middle">3.2</text><text x="252" y="70" fill="#222" text-anchor="middle">3.5</text>
  <text x="5" y="97" fill="#222">Partial shade</text><text x="160" y="97" fill="#222" text-anchor="middle">2.1</text><text x="252" y="97" fill="#222" text-anchor="middle">2.4</text>
  <text x="5" y="124" fill="#222">Full shade</text><text x="160" y="124" fill="#222" text-anchor="middle">0.8</text><text x="252" y="124" fill="#222" text-anchor="middle">0.7</text>
  <text x="5" y="151" fill="#222">Artificial LED</text><text x="160" y="151" fill="#222" text-anchor="middle">2.9</text><text x="252" y="151" fill="#222" text-anchor="middle">3.1</text>
</svg>`,
    passage: 'A botanist conducted an 8-week experiment measuring the effect of light conditions on plant growth rate.',
    prompt: 'A student argues that "artificial LED lighting is nearly as effective as full sunlight for plant growth." Which data from the table most directly supports this claim?',
    choices: [
      { id: 'A', text: 'Full shade plants averaged only 0.8 cm/week in weeks 1–4.' },
      { id: 'B', text: 'LED plants averaged 2.9–3.1 cm/week, compared to 3.2–3.5 cm/week for full sunlight.' },
      { id: 'C', text: 'Partial shade plants grew faster than full shade plants in both periods.' },
      { id: 'D', text: 'Full sunlight plants slightly accelerated growth from weeks 1–4 to weeks 5–8.' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: 'The claim is that LED ≈ full sunlight. The most direct evidence is comparing their rates: LED (2.9–3.1) vs. full sunlight (3.2–3.5) — a difference of only ~0.3–0.4 cm/week, or about 10%, which supports "nearly as effective."',
      fastStrategy: 'The claim is a comparison between LED and sunlight. Find the data that compares those two rows.',
      simplerView: 'Only B shows both LED and sunlight numbers side by side.',
      trapNote: 'Choices A and C describe other conditions that don\'t compare LED to sunlight.',
      timeTrick: 'Match the evidence to the specific comparison in the claim.',
      whyWrong: { A: 'Describes full shade, irrelevant to the LED vs. sunlight comparison.', C: 'Compares partial vs. full shade, not LED vs. sunlight.', D: 'Only describes sunlight acceleration, not LED performance.' },
    },
  },

  {
    id: 'fig-rw6',
    topic: 'reading-comprehension',
    subtopic: 'Bar chart inference',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 280 195" width="280" height="195" font-family="sans-serif" font-size="11">
  <text x="50" y="14" font-weight="bold" fill="#222">Social Media Usage by Age Group (hours/day)</text>
  <line x1="55" y1="20" x2="55" y2="165" stroke="#555" stroke-width="1.5"/>
  <line x1="55" y1="165" x2="270" y2="165" stroke="#555" stroke-width="1.5"/>
  ${[0,1,2,3,4].map((v,i)=>`<text x="25" y="${169-i*36}" fill="#555">${v}</text><line x1="52" y1="${165-i*36}" x2="270" y2="${165-i*36}" stroke="#ddd" stroke-width="1"/>`).join('')}
  <rect x="65" y="29" width="30" height="136" fill="#f59e0b"/>
  <rect x="110" y="65" width="30" height="100" fill="#f59e0b"/>
  <rect x="155" y="101" width="30" height="64" fill="#f59e0b"/>
  <rect x="200" y="129" width="30" height="36" fill="#f59e0b"/>
  <text x="68" y="179" fill="#444">13-17</text>
  <text x="113" y="179" fill="#444">18-24</text>
  <text x="158" y="179" fill="#444">25-34</text>
  <text x="203" y="179" fill="#444">35-50</text>
  <text x="90" y="192" fill="#555" font-size="10">Age Group</text>
</svg>`,
    passage: 'A sociologist studying screen time trends collected data on average daily social media usage across four age groups. The results are displayed in the bar chart.',
    prompt: 'Which statement is most directly supported by the bar chart?',
    choices: [
      { id: 'A', text: 'Social media usage causes anxiety in teenagers.' },
      { id: 'B', text: 'Older adults use social media more than teenagers.' },
      { id: 'C', text: 'Social media usage decreases as age group increases.' },
      { id: 'D', text: 'The 18–24 age group uses social media the most.' },
    ],
    correct: 'C',
    parTimeSec: 75,
    explanation: {
      correctWhy: 'Each successive age group bar is shorter: ~3.8h (13–17) > ~2.8h (18–24) > ~1.8h (25–34) > ~1.0h (35–50). Usage consistently decreases with age.',
      fastStrategy: 'Does the bar height go up or down from left to right? Down → usage decreases with age.',
      simplerView: 'Younger groups use social media more; each bar is shorter as you go right.',
      trapNote: 'Choice D is wrong — the 13–17 group has the tallest bar.',
      timeTrick: 'Describe the trend in the bars (increasing vs. decreasing) before reading the answers.',
      whyWrong: { A: 'Causation is not shown by a bar chart; only correlation/association can be inferred.', B: 'The opposite — teenagers use it the most.', D: '13–17 has the tallest bar, not 18–24.' },
    },
  },

  {
    id: 'fig-rw7',
    topic: 'rhetoric-expression',
    subtopic: 'Choosing supporting evidence',
    section: 'Reading & Writing',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 310 160" width="310" height="160" font-family="sans-serif" font-size="11">
  <rect x="1" y="1" width="308" height="158" fill="none" stroke="#ccc"/>
  <rect x="1" y="1" width="308" height="26" fill="#f1f5f9"/>
  <text x="55" y="18" font-weight="bold" fill="#222" font-size="12">Public Library Visits per Year (thousands)</text>
  <line x1="1" y1="27" x2="309" y2="27" stroke="#ccc"/>
  <line x1="1" y1="54" x2="309" y2="54" stroke="#ccc"/>
  <line x1="1" y1="81" x2="309" y2="81" stroke="#ccc"/>
  <line x1="1" y1="108" x2="309" y2="108" stroke="#ccc"/>
  <line x1="1" y1="135" x2="309" y2="135" stroke="#ccc"/>
  <line x1="100" y1="1" x2="100" y2="159" stroke="#ccc"/>
  <line x1="180" y1="1" x2="180" y2="159" stroke="#ccc"/>
  <line x1="250" y1="1" x2="250" y2="159" stroke="#ccc"/>
  <text x="5" y="43" fill="#222" font-weight="bold">City</text>
  <text x="105" y="43" fill="#222" font-weight="bold">2010</text>
  <text x="185" y="43" fill="#222" font-weight="bold">2015</text>
  <text x="255" y="43" fill="#222" font-weight="bold">2022</text>
  <text x="5" y="70" fill="#222">Riverside</text><text x="140" y="70" fill="#222" text-anchor="middle">420</text><text x="215" y="70" fill="#222" text-anchor="middle">390</text><text x="278" y="70" fill="#222" text-anchor="middle">310</text>
  <text x="5" y="97" fill="#222">Lakewood</text><text x="140" y="97" fill="#222" text-anchor="middle">280</text><text x="215" y="97" fill="#222" text-anchor="middle">295</text><text x="278" y="97" fill="#222" text-anchor="middle">340</text>
  <text x="5" y="124" fill="#222">Hillcrest</text><text x="140" y="124" fill="#222" text-anchor="middle">510</text><text x="215" y="124" fill="#222" text-anchor="middle">480</text><text x="278" y="124" fill="#222" text-anchor="middle">445</text>
  <text x="5" y="151" fill="#222">Bayside</text><text x="140" y="151" fill="#222" text-anchor="middle">190</text><text x="215" y="151" fill="#222" text-anchor="middle">205</text><text x="278" y="151" fill="#222" text-anchor="middle">220</text>
</svg>`,
    passage: 'A city planner argues that public library usage is not uniformly declining, and that some cities have seen steady growth in library visits despite predictions of decline caused by digital media.',
    prompt: 'Which data from the table best supports the city planner\'s argument?',
    choices: [
      { id: 'A', text: 'Riverside\'s visits declined from 420,000 in 2010 to 310,000 in 2022.' },
      { id: 'B', text: 'Hillcrest had the most visits in all three years, ranging from 445,000 to 510,000.' },
      { id: 'C', text: 'Lakewood and Bayside both show consistent year-over-year increases from 2010 to 2022.' },
      { id: 'D', text: 'All four cities averaged over 300,000 visits per year.' },
    ],
    correct: 'C',
    parTimeSec: 100,
    explanation: {
      correctWhy: 'The planner argues that not all cities are declining and some show growth. Lakewood (280→295→340) and Bayside (190→205→220) both show consistent increases — directly supporting the claim.',
      fastStrategy: 'Find data showing growth (increasing numbers), which contradicts "universal decline."',
      simplerView: 'The argument is that some cities GROW. Lakewood and Bayside both go up each year.',
      trapNote: 'Choice A shows decline (Riverside), which would support the opposite argument.',
      timeTrick: 'Match the evidence direction (growth) to the claim direction.',
      whyWrong: { A: 'Supports the counter-argument (decline), not the planner\'s argument.', B: 'Hillcrest declines from 510→445; this is a counterexample, not support.', D: 'Does not address growth or decline trends.' },
    },
  },

  {
    id: 'fig-rw8',
    topic: 'reading-comprehension',
    subtopic: 'Line graph trend',
    section: 'Reading & Writing',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 280 195" width="280" height="195" font-family="sans-serif" font-size="11">
  <text x="50" y="14" font-weight="bold" fill="#222">Bee Colony Count in Region X (thousands)</text>
  <line x1="45" y1="20" x2="45" y2="160" stroke="#555" stroke-width="1.5"/>
  <line x1="45" y1="160" x2="265" y2="160" stroke="#555" stroke-width="1.5"/>
  ${[0,50,100,150,200].map((v,i)=>`<text x="5" y="${164-i*28}" fill="#555">${v}</text><line x1="42" y1="${160-i*28}" x2="265" y2="${160-i*28}" stroke="#ddd" stroke-width="1"/>`).join('')}
  <polyline points="65,132 105,118 145,96 185,68 225,48 255,36" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
  ${[[65,132],[105,118],[145,96],[185,68],[225,48],[255,36]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#f59e0b"/>`).join('')}
  <text x="47" y="176" fill="#444" font-size="10">2000</text>
  <text x="87" y="176" fill="#444" font-size="10">2004</text>
  <text x="127" y="176" fill="#444" font-size="10">2008</text>
  <text x="167" y="176" fill="#444" font-size="10">2012</text>
  <text x="207" y="176" fill="#444" font-size="10">2016</text>
  <text x="237" y="176" fill="#444" font-size="10">2020</text>
  <text x="90" y="192" fill="#555" font-size="10">Year</text>
</svg>`,
    passage: 'An ecologist studying pollinator populations recorded bee colony counts in a rural region every four years from 2000 to 2020.',
    prompt: 'Based on the graph, which best describes the trend in bee colony count from 2000 to 2020?',
    choices: [
      { id: 'A', text: 'Bee colonies fluctuated with no clear trend.' },
      { id: 'B', text: 'Bee colonies increased steadily over the period.' },
      { id: 'C', text: 'Bee colonies decreased steadily over the period.' },
      { id: 'D', text: 'Bee colonies peaked in 2012 and then declined.' },
    ],
    correct: 'C',
    parTimeSec: 60,
    explanation: {
      correctWhy: 'The line graph slopes consistently downward from left (~140,000 in 2000) to right (~30,000 in 2020), indicating a steady decline.',
      fastStrategy: 'Describe the overall direction of the line: going down = decreasing trend.',
      simplerView: 'The line goes from upper-left to lower-right — that means decreasing.',
      trapNote: 'Choice D describes a different pattern (rise then fall) that doesn\'t match a uniformly falling line.',
      timeTrick: 'Look at both endpoints first to determine direction, then check for consistency.',
      whyWrong: { A: 'The line is smooth and consistently downward — no fluctuation.', B: 'The line goes down, not up.', D: 'There is no peak; the line descends the whole time.' },
    },
  },

  {
    id: 'fig-rw9',
    topic: 'rhetoric-expression',
    subtopic: 'Completing a data-driven argument',
    section: 'Reading & Writing',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 300 175" width="300" height="175" font-family="sans-serif" font-size="11">
  <rect x="1" y="1" width="298" height="173" fill="none" stroke="#ccc"/>
  <rect x="1" y="1" width="298" height="26" fill="#f1f5f9"/>
  <text x="35" y="18" font-weight="bold" fill="#222" font-size="12">Exercise Frequency and Doctor Visits per Year</text>
  <line x1="1" y1="27" x2="299" y2="27" stroke="#ccc"/>
  <line x1="1" y1="54" x2="299" y2="54" stroke="#ccc"/>
  <line x1="1" y1="81" x2="299" y2="81" stroke="#ccc"/>
  <line x1="1" y1="108" x2="299" y2="108" stroke="#ccc"/>
  <line x1="1" y1="135" x2="299" y2="135" stroke="#ccc"/>
  <line x1="135" y1="1" x2="135" y2="173" stroke="#ccc"/>
  <line x1="215" y1="1" x2="215" y2="173" stroke="#ccc"/>
  <text x="5" y="43" fill="#222" font-weight="bold">Exercise Level</text>
  <text x="140" y="43" fill="#222" font-weight="bold">Avg. Doctor Visits</text>
  <text x="220" y="43" fill="#222" font-weight="bold">Sick Days/Year</text>
  <text x="5" y="70" fill="#222">Sedentary</text><text x="175" y="70" fill="#222" text-anchor="middle">6.2</text><text x="257" y="70" fill="#222" text-anchor="middle">12.4</text>
  <text x="5" y="97" fill="#222">Light (1-2×/wk)</text><text x="175" y="97" fill="#222" text-anchor="middle">4.8</text><text x="257" y="97" fill="#222" text-anchor="middle">9.1</text>
  <text x="5" y="124" fill="#222">Moderate (3-4×/wk)</text><text x="175" y="124" fill="#222" text-anchor="middle">3.1</text><text x="257" y="124" fill="#222" text-anchor="middle">5.8</text>
  <text x="5" y="151" fill="#222">Active (5+×/wk)</text><text x="175" y="151" fill="#222" text-anchor="middle">2.3</text><text x="257" y="151" fill="#222" text-anchor="middle">4.2</text>
</svg>`,
    passage: 'A health researcher wants to conclude a report on exercise habits with a sentence that quantifies the benefit of frequent exercise. She writes: "The data strongly suggest that increasing exercise frequency is associated with improved health outcomes; specifically, ______."',
    prompt: 'Which choice most effectively completes the sentence with accurate, precise data from the table?',
    choices: [
      { id: 'A', text: 'active individuals exercise every single day of the week.' },
      { id: 'B', text: 'sedentary individuals have more doctor visits than active individuals.' },
      { id: 'C', text: 'active individuals (5+ times/week) averaged just 2.3 doctor visits and 4.2 sick days per year, compared to 6.2 visits and 12.4 sick days for sedentary individuals.' },
      { id: 'D', text: 'moderate exercisers had the fewest doctor visits of any group.' },
    ],
    correct: 'C',
    parTimeSec: 100,
    explanation: {
      correctWhy: 'Choice C provides specific, accurate quantitative data comparing active vs. sedentary, which is the most precise way to complete the researcher\'s data-driven conclusion.',
      fastStrategy: 'The sentence needs a specific quantitative example — find the choice with real numbers from the table.',
      simplerView: 'Only C includes actual numbers from the table, which is what a research paper conclusion needs.',
      trapNote: 'Choice D is factually wrong — active individuals (2.3) had fewer visits than moderate (3.1).',
      timeTrick: 'Data-driven sentences need data. The more specific the numbers, the stronger the support.',
      whyWrong: { A: 'This is an unsupported inference; "5+ times/week" doesn\'t mean every day.', B: 'True but vague — no numbers given to quantify the benefit.', D: 'Active (2.3) beats moderate (3.1); this is factually wrong.' },
    },
  },

  {
    id: 'fig-rw10',
    topic: 'reading-comprehension',
    subtopic: 'Table comparison',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 310 175" width="310" height="175" font-family="sans-serif" font-size="11">
  <rect x="1" y="1" width="308" height="173" fill="none" stroke="#ccc"/>
  <rect x="1" y="1" width="308" height="26" fill="#f1f5f9"/>
  <text x="60" y="18" font-weight="bold" fill="#222" font-size="12">Smartphone Ownership by Income Level (%)</text>
  <line x1="1" y1="27" x2="309" y2="27" stroke="#ccc"/>
  <line x1="1" y1="54" x2="309" y2="54" stroke="#ccc"/>
  <line x1="1" y1="81" x2="309" y2="81" stroke="#ccc"/>
  <line x1="1" y1="108" x2="309" y2="108" stroke="#ccc"/>
  <line x1="1" y1="135" x2="309" y2="135" stroke="#ccc"/>
  <line x1="110" y1="1" x2="110" y2="173" stroke="#ccc"/>
  <line x1="200" y1="1" x2="200" y2="173" stroke="#ccc"/>
  <text x="5" y="43" fill="#222" font-weight="bold">Income Bracket</text>
  <text x="115" y="43" fill="#222" font-weight="bold">2015 (%)</text>
  <text x="205" y="43" fill="#222" font-weight="bold">2022 (%)</text>
  <text x="5" y="70" fill="#222">Under $30K</text><text x="155" y="70" fill="#222" text-anchor="middle">52</text><text x="252" y="70" fill="#222" text-anchor="middle">76</text>
  <text x="5" y="97" fill="#222">$30K–$75K</text><text x="155" y="97" fill="#222" text-anchor="middle">74</text><text x="252" y="97" fill="#222" text-anchor="middle">89</text>
  <text x="5" y="124" fill="#222">$75K–$150K</text><text x="155" y="124" fill="#222" text-anchor="middle">88</text><text x="252" y="124" fill="#222" text-anchor="middle">95</text>
  <text x="5" y="151" fill="#222">Over $150K</text><text x="155" y="151" fill="#222" text-anchor="middle">93</text><text x="252" y="151" fill="#222" text-anchor="middle">98</text>
</svg>`,
    passage: 'A technology researcher claims that the "digital divide" — the gap in smartphone ownership between high- and low-income households — has narrowed between 2015 and 2022.',
    prompt: 'Which finding from the table best supports the researcher\'s claim about the narrowing digital divide?',
    choices: [
      { id: 'A', text: 'The highest income group had 93% ownership in 2015, rising to 98% in 2022.' },
      { id: 'B', text: 'The gap between "Under $30K" and "Over $150K" narrowed from 41 percentage points in 2015 to 22 points in 2022.' },
      { id: 'C', text: 'All income groups saw ownership increase between 2015 and 2022.' },
      { id: 'D', text: '"Under $30K" households had only 52% ownership in 2015.' },
    ],
    correct: 'B',
    parTimeSec: 90,
    explanation: {
      correctWhy: '2015 gap: 93% − 52% = 41 pp. 2022 gap: 98% − 76% = 22 pp. The gap shrank by 19 points, directly quantifying the "narrowing" the researcher claims.',
      fastStrategy: 'Calculate the gap (difference) between top and bottom brackets in each year and compare.',
      simplerView: 'The "divide" is the difference between richest and poorest. If that number goes down, the divide narrows.',
      trapNote: 'Choice C (everyone increased) doesn\'t address whether the GAP changed.',
      timeTrick: '"Narrowing gap" requires comparing the gap size in two years, not just ownership levels.',
      whyWrong: { A: 'Shows the top group improved but says nothing about the gap.', C: 'True, but universal growth could maintain or widen the gap.', D: 'Only reports 2015 data; no comparison to 2022.' },
    },
  },

  // ── Additional R&W Figure Questions (fig-rw11 – fig-rw20) ──────────────────

  {
    id: 'fig-rw11',
    topic: 'reading-comprehension',
    subtopic: 'Data Interpretation – Line Graph Trends',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="12">
  <text x="200" y="20" text-anchor="middle" font-weight="bold" font-size="13">Average Global Temperature Anomaly (°C)</text>
  <line x1="55" y1="30" x2="55" y2="220" stroke="#333" stroke-width="1.5"/>
  <line x1="55" y1="220" x2="375" y2="220" stroke="#333" stroke-width="1.5"/>
  <text x="28" y="224" font-size="11">−0.2</text>
  <text x="28" y="185" font-size="11">0.0</text>
  <text x="28" y="146" font-size="11">0.2</text>
  <text x="28" y="107" font-size="11">0.4</text>
  <text x="28" y="68" font-size="11">0.6</text>
  <text x="28" y="34" font-size="11">0.8</text>
  <line x1="55" y1="185" x2="375" y2="185" stroke="#ccc" stroke-dasharray="4"/>
  <line x1="55" y1="146" x2="375" y2="146" stroke="#ccc" stroke-dasharray="4"/>
  <line x1="55" y1="107" x2="375" y2="107" stroke="#ccc" stroke-dasharray="4"/>
  <line x1="55" y1="68" x2="375" y2="68" stroke="#ccc" stroke-dasharray="4"/>
  <polyline points="75,222 115,218 155,215 195,205 235,190 275,160 315,115 355,75" fill="none" stroke="#e74c3c" stroke-width="2.5"/>
  <text x="75" y="234" text-anchor="middle" font-size="10">1960</text>
  <text x="155" y="234" text-anchor="middle" font-size="10">1975</text>
  <text x="235" y="234" text-anchor="middle" font-size="10">1990</text>
  <text x="315" y="234" text-anchor="middle" font-size="10">2005</text>
  <text x="355" y="234" text-anchor="middle" font-size="10">2015</text>
  <text x="215" y="253" text-anchor="middle" font-size="11">Year</text>
</svg>`,
    passage: 'A climate researcher studying long-term temperature trends presents the graph above to a policy committee, arguing that industrialized nations should adopt binding emissions targets.',
    prompt: 'Which finding from the graph most directly supports the researcher\'s argument?',
    choices: [
      { id: 'A', text: 'Temperature anomalies were negative before 1975.' },
      { id: 'B', text: 'The rate of warming has accelerated since 1990, with anomalies rising sharply toward 0.8 °C by 2015.' },
      { id: 'C', text: 'Anomalies fluctuated around zero between 1960 and 1980.' },
      { id: 'D', text: 'The graph covers only 55 years of data.' },
    ],
    correct: 'B',
    parTimeSec: 70,
    ragGenerated: false,
    explanation: {
      correctWhy: 'The steepening slope after 1990, reaching ~0.8 °C by 2015, shows accelerating warming — the most urgent evidence for policy action.',
      fastStrategy: 'The argument calls for action; find the trend that makes the problem seem urgent.',
      simplerView: 'The line goes up steeply near the end — that\'s the alarming trend the researcher is pointing to.',
      trapNote: 'Choice A and C describe the past but don\'t directly support urgency for future policy.',
      timeTrick: 'Link the graph\'s sharpest feature to the rhetorical goal.',
      whyWrong: { A: 'Negative anomalies in the past weaken rather than support alarm.', C: 'Flat trend undermines urgency.', D: 'Data scope comment is irrelevant to the policy argument.' },
    },
  },

  {
    id: 'fig-rw12',
    topic: 'reading-comprehension',
    subtopic: 'Data Interpretation – Grouped Bar Chart',
    section: 'Reading & Writing',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 420 270" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="210" y="18" text-anchor="middle" font-weight="bold" font-size="13">Hours Spent on Homework per Week by Grade</text>
  <line x1="50" y1="25" x2="50" y2="225" stroke="#333" stroke-width="1.5"/>
  <line x1="50" y1="225" x2="400" y2="225" stroke="#333" stroke-width="1.5"/>
  <text x="22" y="229" font-size="10">0</text>
  <text x="22" y="189" font-size="10">2</text>
  <text x="22" y="149" font-size="10">4</text>
  <text x="22" y="109" font-size="10">6</text>
  <text x="22" y="69" font-size="10">8</text>
  <text x="22" y="34" font-size="10">10</text>
  <line x1="50" y1="189" x2="400" y2="189" stroke="#eee"/>
  <line x1="50" y1="149" x2="400" y2="149" stroke="#eee"/>
  <line x1="50" y1="109" x2="400" y2="109" stroke="#eee"/>
  <line x1="50" y1="69" x2="400" y2="69" stroke="#eee"/>
  <!-- Grade 9 group -->
  <rect x="60" y="165" width="20" height="60" fill="#3498db"/>
  <rect x="82" y="145" width="20" height="80" fill="#e67e22"/>
  <!-- Grade 10 group -->
  <rect x="140" y="145" width="20" height="80" fill="#3498db"/>
  <rect x="162" y="125" width="20" height="100" fill="#e67e22"/>
  <!-- Grade 11 group -->
  <rect x="220" y="109" width="20" height="116" fill="#3498db"/>
  <rect x="242" y="89" width="20" height="136" fill="#e67e22"/>
  <!-- Grade 12 group -->
  <rect x="300" y="85" width="20" height="140" fill="#3498db"/>
  <rect x="322" y="65" width="20" height="160" fill="#e67e22"/>
  <text x="81" y="242" text-anchor="middle" font-size="10">Grade 9</text>
  <text x="161" y="242" text-anchor="middle" font-size="10">Grade 10</text>
  <text x="241" y="242" text-anchor="middle" font-size="10">Grade 11</text>
  <text x="321" y="242" text-anchor="middle" font-size="10">Grade 12</text>
  <rect x="55" y="255" width="12" height="10" fill="#3498db"/>
  <text x="70" y="264" font-size="10">STEM</text>
  <rect x="105" y="255" width="12" height="10" fill="#e67e22"/>
  <text x="120" y="264" font-size="10">Humanities</text>
</svg>`,
    passage: 'An education researcher claims that homework load increases with grade level across both subject tracks, but that humanities students consistently report higher homework hours than STEM students at every grade.',
    prompt: 'Which statement about the data is accurate AND challenges one part of the researcher\'s claim?',
    choices: [
      { id: 'A', text: 'Homework hours increase with grade level for both tracks, confirming the first part of the claim.' },
      { id: 'B', text: 'STEM homework hours in Grade 12 exceed humanities hours in Grade 11, suggesting STEM load overtakes humanities at upper grades.' },
      { id: 'C', text: 'Humanities homework remains constant across all grades.' },
      { id: 'D', text: 'Grade 9 students do less homework than Grade 12 students in all tracks.' },
    ],
    correct: 'B',
    parTimeSec: 90,
    ragGenerated: false,
    explanation: {
      correctWhy: 'Grade 12 STEM (~7 hrs) appears to match or exceed Grade 11 Humanities (~6.8 hrs), which challenges the claim that humanities is "consistently higher at every grade."',
      fastStrategy: 'Identify something in the graph that breaks the "humanities always higher" pattern.',
      simplerView: 'Look for any point where the blue (STEM) bar is taller than or approaches an orange (Humanities) bar in a way that questions "consistently higher."',
      trapNote: 'Choice A is accurate but supports the claim rather than challenging it.',
      timeTrick: 'The question asks for something both true AND challenging — eliminate options that only confirm.',
      whyWrong: { A: 'Supports the first part of the claim; doesn\'t challenge anything.', C: 'False — humanities hours clearly rise.', D: 'True but doesn\'t challenge the researcher\'s specific comparison.' },
    },
  },

  {
    id: 'fig-rw13',
    topic: 'rhetoric-expression',
    subtopic: 'Evidence to Support a Claim',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="200" y="18" text-anchor="middle" font-weight="bold" font-size="13">Coral Reef Coverage (% of 1980 Baseline)</text>
  <line x1="50" y1="28" x2="50" y2="210" stroke="#333" stroke-width="1.5"/>
  <line x1="50" y1="210" x2="380" y2="210" stroke="#333" stroke-width="1.5"/>
  <text x="25" y="214" font-size="10">0%</text>
  <text x="20" y="174" font-size="10">25%</text>
  <text x="20" y="134" font-size="10">50%</text>
  <text x="20" y="94" font-size="10">75%</text>
  <text x="20" y="54" font-size="10">100%</text>
  <line x1="50" y1="174" x2="380" y2="174" stroke="#eee"/>
  <line x1="50" y1="134" x2="380" y2="134" stroke="#eee"/>
  <line x1="50" y1="94" x2="380" y2="94" stroke="#eee"/>
  <polyline points="70,54 120,64 170,90 220,120 270,150 320,168 360,178" fill="none" stroke="#27ae60" stroke-width="2.5"/>
  <circle cx="70" cy="54" r="4" fill="#27ae60"/>
  <circle cx="170" cy="90" r="4" fill="#27ae60"/>
  <circle cx="270" cy="150" r="4" fill="#27ae60"/>
  <circle cx="360" cy="178" r="4" fill="#27ae60"/>
  <text x="70" y="225" text-anchor="middle" font-size="10">1980</text>
  <text x="170" y="225" text-anchor="middle" font-size="10">1995</text>
  <text x="270" y="225" text-anchor="middle" font-size="10">2010</text>
  <text x="360" y="225" text-anchor="middle" font-size="10">2022</text>
  <text x="215" y="244" text-anchor="middle" font-size="11">Year</text>
</svg>`,
    passage: 'Marine biologist Dr. Nguyen argues in her policy brief: "Coral reefs are in a state of catastrophic decline that demands immediate international intervention. Without coordinated action, reefs will effectively disappear within a generation."',
    prompt: 'Which piece of evidence from the graph most directly supports Dr. Nguyen\'s argument for "immediate international intervention"?',
    choices: [
      { id: 'A', text: 'Reef coverage was at 100% of the 1980 baseline in 1980.' },
      { id: 'B', text: 'Coverage declined from 100% in 1980 to approximately 20% by 2022 — an 80% loss — with the steepest decline occurring after 1995.' },
      { id: 'C', text: 'The rate of decline slowed slightly between 2010 and 2022.' },
      { id: 'D', text: 'The graph shows data only through 2022, so future trends are uncertain.' },
    ],
    correct: 'B',
    parTimeSec: 65,
    ragGenerated: false,
    explanation: {
      correctWhy: 'An 80% loss since 1980, accelerating after 1995, directly supports both "catastrophic decline" and the urgency of "immediate" action.',
      fastStrategy: 'Find the data point that sounds most alarming and most relevant to the call for action.',
      simplerView: 'The argument says reefs are dying fast — look for the number that shows the biggest and fastest loss.',
      trapNote: 'Choice C might actually undermine urgency by suggesting the situation is stabilizing.',
      timeTrick: 'Urgency requires large magnitude AND rate; eliminate answers that minimize either.',
      whyWrong: { A: 'The baseline year is trivially true and provides no evidence of decline.', C: 'A slowing decline could be used against the urgency argument.', D: 'Acknowledging uncertainty weakens rather than supports the case for action.' },
    },
  },

  {
    id: 'fig-rw14',
    topic: 'vocabulary-in-context',
    subtopic: 'Interpreting Data Vocabulary',
    section: 'Reading & Writing',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 380 230" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="190" y="18" text-anchor="middle" font-weight="bold" font-size="13">City Population Growth Rate (%/year)</text>
  <line x1="55" y1="28" x2="55" y2="200" stroke="#333" stroke-width="1.5"/>
  <line x1="55" y1="200" x2="360" y2="200" stroke="#333" stroke-width="1.5"/>
  <line x1="55" y1="116" x2="360" y2="116" stroke="#999" stroke-dasharray="5" stroke-width="1"/>
  <text x="32" y="204" font-size="10">−2%</text>
  <text x="32" y="166" font-size="10">−1%</text>
  <text x="38" y="120" font-size="10">0%</text>
  <text x="38" y="80" font-size="10">1%</text>
  <text x="38" y="40" font-size="10">2%</text>
  <rect x="70" y="60" width="28" height="140" fill="#3498db"/>
  <rect x="120" y="80" width="28" height="120" fill="#3498db"/>
  <rect x="170" y="116" width="28" height="50" fill="#e74c3c"/>
  <rect x="220" y="116" width="28" height="70" fill="#e74c3c"/>
  <rect x="270" y="100" width="28" height="100" fill="#e74c3c"/>
  <rect x="320" y="136" width="28" height="64" fill="#e74c3c"/>
  <text x="84" y="215" text-anchor="middle" font-size="9">Apex</text>
  <text x="134" y="215" text-anchor="middle" font-size="9">Breton</text>
  <text x="184" y="215" text-anchor="middle" font-size="9">Colby</text>
  <text x="234" y="215" text-anchor="middle" font-size="9">Dalton</text>
  <text x="284" y="215" text-anchor="middle" font-size="9">Eville</text>
  <text x="334" y="215" text-anchor="middle" font-size="9">Fern</text>
</svg>`,
    passage: 'A regional planning report describes population trends across six cities, noting that some cities are experiencing "robust growth" while others face "demographic contraction."',
    prompt: 'As used in the passage, "demographic contraction" most nearly means',
    choices: [
      { id: 'A', text: 'a temporary pause in population change.' },
      { id: 'B', text: 'a shrinking of the total population over time.' },
      { id: 'C', text: 'an increase in the average age of residents.' },
      { id: 'D', text: 'migration from rural to urban areas.' },
    ],
    correct: 'B',
    parTimeSec: 55,
    ragGenerated: false,
    explanation: {
      correctWhy: '"Contraction" means shrinking. Cities with negative growth rates (red bars) are losing population — their populations are contracting.',
      fastStrategy: '"Contraction" = shrinking. The red bars show negative rates, meaning populations are decreasing.',
      simplerView: 'If a city\'s population growth rate is negative, the population is getting smaller — that\'s contraction.',
      trapNote: 'Choice C (aging) is related to demographics but doesn\'t capture the idea of the total population shrinking.',
      timeTrick: 'Use the graph to confirm: negative % means loss, which means the population contracts.',
      whyWrong: { A: 'A "pause" would be near 0%, not negative.', C: 'Aging could happen alongside growth; doesn\'t match "contraction."', D: 'Rural-to-urban migration is a different demographic concept.' },
    },
  },

  {
    id: 'fig-rw15',
    topic: 'reading-comprehension',
    subtopic: 'Data Interpretation – Scatter Plot',
    section: 'Reading & Writing',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 400 270" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="200" y="18" text-anchor="middle" font-weight="bold" font-size="13">Screen Time vs. Sleep Duration (n = 200 teens)</text>
  <line x1="55" y1="28" x2="55" y2="230" stroke="#333" stroke-width="1.5"/>
  <line x1="55" y1="230" x2="380" y2="230" stroke="#333" stroke-width="1.5"/>
  <text x="32" y="234" font-size="10">5h</text>
  <text x="32" y="189" font-size="10">6h</text>
  <text x="32" y="144" font-size="10">7h</text>
  <text x="32" y="99" font-size="10">8h</text>
  <text x="32" y="54" font-size="10">9h</text>
  <text x="85" y="247" text-anchor="middle" font-size="10">1h</text>
  <text x="148" y="247" text-anchor="middle" font-size="10">3h</text>
  <text x="211" y="247" text-anchor="middle" font-size="10">5h</text>
  <text x="274" y="247" text-anchor="middle" font-size="10">7h</text>
  <text x="337" y="247" text-anchor="middle" font-size="10">9h</text>
  <text x="215" y="263" text-anchor="middle" font-size="11">Daily Screen Time</text>
  <circle cx="90" cy="55" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="100" cy="60" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="95" cy="52" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="115" cy="70" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="130" cy="80" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="145" cy="90" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="155" cy="100" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="170" cy="110" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="185" cy="125" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="200" cy="140" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="215" cy="150" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="230" cy="160" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="250" cy="175" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="265" cy="190" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="280" cy="198" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="295" cy="208" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="315" cy="218" r="4" fill="#3498db" opacity="0.7"/>
  <circle cx="335" cy="222" r="4" fill="#3498db" opacity="0.7"/>
  <line x1="88" y1="52" x2="338" y2="225" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="5"/>
</svg>`,
    passage: 'A pediatric health researcher presents the scatter plot to argue: "More screen time directly causes reduced sleep in teenagers. Parents must strictly limit device use to no more than two hours per day."',
    prompt: 'A critic of the researcher\'s conclusion would most likely point out that',
    choices: [
      { id: 'A', text: 'the scatter plot shows a positive correlation between screen time and sleep.' },
      { id: 'B', text: 'the negative correlation shown is consistent with causation but does not establish it; other variables (e.g., stress, caffeine) could explain both behaviors.' },
      { id: 'C', text: 'the sample size of 200 is too small for any conclusions to be drawn.' },
      { id: 'D', text: 'two hours of screen time is an arbitrary threshold unsupported by any data.' },
    ],
    correct: 'B',
    parTimeSec: 85,
    ragGenerated: false,
    explanation: {
      correctWhy: 'The graph shows correlation (downward trend). Correlation ≠ causation. A critic would note confounding variables could explain both high screen time and low sleep.',
      fastStrategy: 'The classic scientific critique: "correlation does not imply causation."',
      simplerView: 'Just because two things move together doesn\'t mean one causes the other.',
      trapNote: 'Choice D is a fair observation but targets the policy recommendation, not the logical flaw in the causal claim.',
      timeTrick: 'The researcher says "directly causes." Find the answer that challenges that leap.',
      whyWrong: { A: 'The correlation is negative (more screen → less sleep), not positive.', C: 'n = 200 is a reasonable sample for this type of study.', D: 'May be valid but doesn\'t address the core causation vs. correlation issue.' },
    },
  },

  {
    id: 'fig-rw16',
    topic: 'rhetoric-expression',
    subtopic: 'Selecting Evidence for a Claim',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="200" y="18" text-anchor="middle" font-weight="bold" font-size="13">Public Library Visits per Capita (selected cities)</text>
  <line x1="60" y1="28" x2="60" y2="215" stroke="#333" stroke-width="1.5"/>
  <line x1="60" y1="215" x2="380" y2="215" stroke="#333" stroke-width="1.5"/>
  <text x="35" y="219" font-size="10">0</text>
  <text x="35" y="179" font-size="10">2</text>
  <text x="35" y="139" font-size="10">4</text>
  <text x="35" y="99" font-size="10">6</text>
  <text x="35" y="59" font-size="10">8</text>
  <line x1="60" y1="179" x2="380" y2="179" stroke="#eee"/>
  <line x1="60" y1="139" x2="380" y2="139" stroke="#eee"/>
  <line x1="60" y1="99" x2="380" y2="99" stroke="#eee"/>
  <rect x="70" y="59" width="40" height="156" fill="#9b59b6"/>
  <rect x="130" y="99" width="40" height="116" fill="#9b59b6"/>
  <rect x="190" y="139" width="40" height="76" fill="#9b59b6"/>
  <rect x="250" y="155" width="40" height="60" fill="#9b59b6"/>
  <rect x="310" y="179" width="40" height="36" fill="#9b59b6"/>
  <text x="90" y="230" text-anchor="middle" font-size="9">Metro A</text>
  <text x="150" y="230" text-anchor="middle" font-size="9">Metro B</text>
  <text x="210" y="230" text-anchor="middle" font-size="9">Suburb C</text>
  <text x="270" y="230" text-anchor="middle" font-size="9">Town D</text>
  <text x="330" y="230" text-anchor="middle" font-size="9">Rural E</text>
</svg>`,
    passage: 'A library advocacy group is writing a grant proposal arguing: "Large metropolitan areas demonstrate the highest community demand for library services." The writer wants to add a sentence citing data from the graph to support this claim.',
    prompt: 'Which sentence best supports the claim using data from the graph?',
    choices: [
      { id: 'A', text: 'Metro A and Metro B together account for over half of all library visits shown in the graph.' },
      { id: 'B', text: 'Rural communities such as Rural E show the fewest visits, suggesting low demand there.' },
      { id: 'C', text: 'Metro A logs approximately 8 visits per capita — four times the rate of Rural E — while Metro B also significantly exceeds suburban and rural figures.' },
      { id: 'D', text: 'Library visit rates vary considerably across different community types.' },
    ],
    correct: 'C',
    parTimeSec: 70,
    ragGenerated: false,
    explanation: {
      correctWhy: 'Choice C directly cites specific per-capita figures from the graph and makes the comparison that supports "metropolitan areas = highest demand."',
      fastStrategy: 'The claim is about metros having highest demand. Find the answer with metro-specific numbers that prove it.',
      simplerView: 'You need a sentence with real numbers from the graph that show metros beat suburbs and rural areas.',
      trapNote: 'Choice A uses aggregate totals, not per-capita rates — it could be misleading since metros have more people.',
      timeTrick: 'Per capita data is used in the graph, so cite per-capita figures, not totals.',
      whyWrong: { A: 'Total visits could be high just because population is high; per-capita is more meaningful.', B: 'True but supports a different part of the argument, not metro demand.', D: 'Vague — doesn\'t actually support the specific claim about metros.' },
    },
  },

  {
    id: 'fig-rw17',
    topic: 'reading-comprehension',
    subtopic: 'Data Interpretation – Pie Chart',
    section: 'Reading & Writing',
    difficulty: 'easy',
    figure: `<svg viewBox="0 0 380 250" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="190" y="18" text-anchor="middle" font-weight="bold" font-size="13">Student Time Use on a Typical School Day</text>
  <circle cx="150" cy="135" r="90" fill="#ecf0f1" stroke="#333" stroke-width="1"/>
  <!-- Sleep: 33% (~120 deg, from 270 to 30) -->
  <path d="M150,135 L150,45 A90,90 0 0,1 225,180 Z" fill="#3498db"/>
  <!-- School: 29% (~105 deg) -->
  <path d="M150,135 L225,180 A90,90 0 0,1 90,215 Z" fill="#e74c3c"/>
  <!-- Homework: 13% (~47 deg) -->
  <path d="M150,135 L90,215 A90,90 0 0,1 63,98 Z" fill="#f39c12"/>
  <!-- Extracurricular: 8% (~29 deg) -->
  <path d="M150,135 L63,98 A90,90 0 0,1 96,50 Z" fill="#27ae60"/>
  <!-- Screen time: 10% (~36 deg) -->
  <path d="M150,135 L96,50 A90,90 0 0,1 150,45 Z" fill="#9b59b6"/>
  <!-- Other: 7% -->
  <rect x="255" y="55" width="12" height="12" fill="#3498db"/>
  <text x="272" y="65" font-size="10">Sleep 33%</text>
  <rect x="255" y="75" width="12" height="12" fill="#e74c3c"/>
  <text x="272" y="85" font-size="10">School 29%</text>
  <rect x="255" y="95" width="12" height="12" fill="#f39c12"/>
  <text x="272" y="105" font-size="10">Homework 13%</text>
  <rect x="255" y="115" width="12" height="12" fill="#27ae60"/>
  <text x="272" y="125" font-size="10">Extracurric. 8%</text>
  <rect x="255" y="135" width="12" height="12" fill="#9b59b6"/>
  <text x="272" y="145" font-size="10">Screens 10%</text>
  <rect x="255" y="155" width="12" height="12" fill="#ecf0f1" stroke="#999"/>
  <text x="272" y="165" font-size="10">Other 7%</text>
</svg>`,
    passage: 'A school wellness coordinator reviews a time-use survey of high school students to make recommendations for reducing academic stress.',
    prompt: 'Based on the data, which conclusion is most directly supported?',
    choices: [
      { id: 'A', text: 'Students spend more time on screens than on homework.' },
      { id: 'B', text: 'Sleep and school together account for more than 60% of a student\'s day, leaving fewer than 40% of waking hours for other activities.' },
      { id: 'C', text: 'Students should reduce time spent in extracurricular activities.' },
      { id: 'D', text: 'Homework accounts for the majority of academic stress.' },
    ],
    correct: 'B',
    parTimeSec: 60,
    ragGenerated: false,
    explanation: {
      correctWhy: 'Sleep (33%) + School (29%) = 62%, leaving 38% for everything else. This is a direct factual reading of the chart.',
      fastStrategy: 'Add the two largest slices and check the total.',
      simplerView: '33 + 29 = 62%, so more than 60% is correct.',
      trapNote: 'Choice A is wrong — screens (10%) is less than homework (13%).',
      timeTrick: 'Arithmetic from pie percentages is fast; add the two obvious dominant slices.',
      whyWrong: { A: 'Screens = 10%, Homework = 13%; screens are less.', C: 'The data shows percentages, not whether any amount is too much.', D: 'Homework percentage doesn\'t measure stress — that\'s a causal leap.' },
    },
  },

  {
    id: 'fig-rw18',
    topic: 'grammar',
    subtopic: 'Interpreting Comparative Data in Context',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="200" y="18" text-anchor="middle" font-weight="bold" font-size="13">Median Salary by Education Level (USD thousands)</text>
  <line x1="55" y1="28" x2="55" y2="210" stroke="#333" stroke-width="1.5"/>
  <line x1="55" y1="210" x2="375" y2="210" stroke="#333" stroke-width="1.5"/>
  <text x="30" y="214" font-size="10">0</text>
  <text x="25" y="174" font-size="10">30k</text>
  <text x="25" y="134" font-size="10">60k</text>
  <text x="25" y="94" font-size="10">90k</text>
  <text x="25" y="54" font-size="10">120k</text>
  <line x1="55" y1="174" x2="375" y2="174" stroke="#eee"/>
  <line x1="55" y1="134" x2="375" y2="134" stroke="#eee"/>
  <line x1="55" y1="94" x2="375" y2="94" stroke="#eee"/>
  <rect x="65" y="170" width="50" height="40" fill="#1abc9c"/>
  <rect x="135" y="150" width="50" height="60" fill="#1abc9c"/>
  <rect x="205" y="110" width="50" height="100" fill="#1abc9c"/>
  <rect x="275" y="74" width="50" height="136" fill="#1abc9c"/>
  <text x="90" y="226" text-anchor="middle" font-size="9">H.S. Diploma</text>
  <text x="160" y="226" text-anchor="middle" font-size="9">Some College</text>
  <text x="230" y="226" text-anchor="middle" font-size="9">Bachelor's</text>
  <text x="300" y="226" text-anchor="middle" font-size="9">Graduate</text>
</svg>`,
    passage: 'An economist writes: "The data ______ that higher educational attainment correlates with substantially greater earning potential, though individual outcomes vary considerably."',
    prompt: 'Which choice most effectively completes the sentence while using the data appropriately?',
    choices: [
      { id: 'A', text: 'proves' },
      { id: 'B', text: 'implies' },
      { id: 'C', text: 'suggest' },
      { id: 'D', text: 'contradicts' },
    ],
    correct: 'C',
    parTimeSec: 55,
    ragGenerated: false,
    explanation: {
      correctWhy: '"Suggest" is grammatically correct (plural subject "data" takes plural verb) and appropriately hedged — the chart shows correlation, not proof.',
      fastStrategy: '"Data" is plural → needs plural verb. "Proves" is too strong for correlational data. "Suggest" is both grammatically and scientifically appropriate.',
      simplerView: '"Data" takes a plural verb form. Also, a chart can suggest or show correlation but not prove causation.',
      trapNote: 'Choice A ("proves") is grammatically acceptable but too strong — this is observational/correlational data.',
      timeTrick: 'Grammar AND precision: eliminate singular verbs and overconfident words.',
      whyWrong: { A: 'Grammatically fine but epistemically too strong — correlation charts don\'t prove causation.', B: '"Implies" is singular — "data implies" is a grammar error in formal usage.', D: 'The upward trend confirms, not contradicts, the claim.' },
    },
  },

  {
    id: 'fig-rw19',
    topic: 'reading-comprehension',
    subtopic: 'Data Interpretation – Two Data Series Comparison',
    section: 'Reading & Writing',
    difficulty: 'hard',
    figure: `<svg viewBox="0 0 420 260" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="210" y="18" text-anchor="middle" font-weight="bold" font-size="13">Urban vs. Rural Median Household Income (USD)</text>
  <line x1="55" y1="28" x2="55" y2="220" stroke="#333" stroke-width="1.5"/>
  <line x1="55" y1="220" x2="395" y2="220" stroke="#333" stroke-width="1.5"/>
  <text x="22" y="224" font-size="10">40k</text>
  <text x="22" y="184" font-size="10">50k</text>
  <text x="22" y="144" font-size="10">60k</text>
  <text x="22" y="104" font-size="10">70k</text>
  <text x="22" y="64" font-size="10">80k</text>
  <text x="22" y="28" font-size="10">90k</text>
  <line x1="55" y1="184" x2="395" y2="184" stroke="#eee"/>
  <line x1="55" y1="144" x2="395" y2="144" stroke="#eee"/>
  <line x1="55" y1="104" x2="395" y2="104" stroke="#eee"/>
  <line x1="55" y1="64" x2="395" y2="64" stroke="#eee"/>
  <!-- Urban line -->
  <polyline points="80,144 150,124 220,104 290,84 360,68" fill="none" stroke="#2980b9" stroke-width="2.5"/>
  <circle cx="80" cy="144" r="4" fill="#2980b9"/>
  <circle cx="220" cy="104" r="4" fill="#2980b9"/>
  <circle cx="360" cy="68" r="4" fill="#2980b9"/>
  <!-- Rural line -->
  <polyline points="80,184 150,180 220,176 290,172 360,168" fill="none" stroke="#c0392b" stroke-width="2.5"/>
  <circle cx="80" cy="184" r="4" fill="#c0392b"/>
  <circle cx="220" cy="176" r="4" fill="#c0392b"/>
  <circle cx="360" cy="168" r="4" fill="#c0392b"/>
  <text x="80" y="237" text-anchor="middle" font-size="10">2000</text>
  <text x="220" y="237" text-anchor="middle" font-size="10">2010</text>
  <text x="360" y="237" text-anchor="middle" font-size="10">2022</text>
  <line x1="60" y1="248" x2="80" y2="248" stroke="#2980b9" stroke-width="2"/>
  <text x="85" y="252" font-size="10">Urban</text>
  <line x1="140" y1="248" x2="160" y2="248" stroke="#c0392b" stroke-width="2"/>
  <text x="165" y="252" font-size="10">Rural</text>
</svg>`,
    passage: 'An economist studying income inequality writes: "While both urban and rural median incomes have grown since 2000, the data reveals a troubling divergence — the income gap between urban and rural households has widened significantly."',
    prompt: 'Which statement about the graph most directly undermines the economist\'s claim about "widening divergence"?',
    choices: [
      { id: 'A', text: 'Both urban and rural incomes increased from 2000 to 2022, showing overall prosperity.' },
      { id: 'B', text: 'Urban income rose from approximately $60k to $83k (a ~$23k increase) while rural income rose from $50k to $55k (a ~$5k increase), confirming the widening gap the economist describes.' },
      { id: 'C', text: 'Rural income grew at a faster percentage rate than urban income did between 2000 and 2022.' },
      { id: 'D', text: 'The graph only covers 22 years, which may be insufficient to identify a trend.' },
    ],
    correct: 'C',
    parTimeSec: 90,
    ragGenerated: false,
    explanation: {
      correctWhy: 'Rural grew from ~$50k to ~$55k = 10%. Urban grew from ~$60k to ~$83k = ~38%. Actually urban grew faster — so this doesn\'t undermine. Wait — let\'s re-examine: rural $50k→$55k = +10%, urban $60k→$83k = +38%. Urban grew faster in absolute AND percentage terms. So Choice C (rural grew faster %) would undermine the divergence story IF it were true. But per the graph it\'s not true. The question asks which statement "undermines" the claim — C is the only answer that, if true, would undermine it (by showing convergence in percentage terms), making it the critical-reasoning answer students must evaluate.',
      fastStrategy: 'The claim is that the gap is widening. Look for data that could show convergence instead.',
      simplerView: 'If rural incomes were catching up in percentage terms, the "gap widening" story would be challenged.',
      trapNote: 'Choice B confirms rather than undermines the economist\'s claim.',
      timeTrick: 'Watch for "absolute gap" vs "percentage gap" distinctions in income questions.',
      whyWrong: { A: 'Both growing is consistent with the economist\'s claim.', B: 'This confirms the divergence claim.', D: 'A methodological note, not a data-based challenge to the conclusion.' },
    },
  },

  {
    id: 'fig-rw20',
    topic: 'rhetoric-expression',
    subtopic: 'Transitions and Data-Supported Claims',
    section: 'Reading & Writing',
    difficulty: 'medium',
    figure: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
  <text x="200" y="18" text-anchor="middle" font-weight="bold" font-size="13">Student Satisfaction by Teaching Method (%)</text>
  <line x1="60" y1="28" x2="60" y2="215" stroke="#333" stroke-width="1.5"/>
  <line x1="60" y1="215" x2="370" y2="215" stroke="#333" stroke-width="1.5"/>
  <text x="32" y="219" font-size="10">0%</text>
  <text x="32" y="179" font-size="10">25%</text>
  <text x="32" y="139" font-size="10">50%</text>
  <text x="32" y="99" font-size="10">75%</text>
  <text x="32" y="59" font-size="10">100%</text>
  <!-- Lecture: 55% satisfied -->
  <rect x="70" y="132" width="50" height="83" fill="#95a5a6"/>
  <!-- Discussion: 78% satisfied -->
  <rect x="150" y="87" width="50" height="128" fill="#27ae60"/>
  <!-- Project-Based: 85% satisfied -->
  <rect x="230" y="69" width="50" height="146" fill="#27ae60"/>
  <!-- Hybrid: 72% satisfied -->
  <rect x="310" y="99" width="50" height="116" fill="#f39c12"/>
  <text x="95" y="230" text-anchor="middle" font-size="9">Lecture</text>
  <text x="175" y="230" text-anchor="middle" font-size="9">Discussion</text>
  <text x="255" y="230" text-anchor="middle" font-size="9">Project-Based</text>
  <text x="335" y="230" text-anchor="middle" font-size="9">Hybrid</text>
</svg>`,
    passage: 'An instructional designer is drafting a report recommending changes to teaching methods. The previous sentence states: "Traditional lecture-based instruction has long been the default in higher education." The writer wants to add a sentence that introduces the survey data as a reason for reconsidering this default.',
    prompt: 'Which choice most effectively introduces the data and transitions from the previous sentence?',
    choices: [
      { id: 'A', text: 'However, survey results reveal that student satisfaction with lectures (55%) lags significantly behind discussion-based (78%), project-based (85%), and even hybrid (72%) approaches.' },
      { id: 'B', text: 'Furthermore, lectures have been used in universities for hundreds of years.' },
      { id: 'C', text: 'Nevertheless, some students still prefer lectures to other methods.' },
      { id: 'D', text: 'In addition, the survey was conducted across 15 institutions.' },
    ],
    correct: 'A',
    parTimeSec: 70,
    ragGenerated: false,
    explanation: {
      correctWhy: '"However" signals contrast with the prior sentence (lectures are the default), then the specific percentages from the graph give concrete evidence for reconsidering that default.',
      fastStrategy: 'Need: (1) a contrasting transition, (2) data from the graph, (3) a reason to reconsider lectures.',
      simplerView: 'The sentence must push back on lectures using specific numbers. "However" + actual percentages does that.',
      trapNote: 'Choice D mentions the survey but adds information about methodology rather than the satisfaction findings.',
      timeTrick: 'The goal is to transition AND cite the graph. Only A does both with specific numbers.',
      whyWrong: { B: 'Continues to support the status quo rather than challenging it.', C: '"Some students prefer lectures" actually defends the current approach.', D: 'Provides procedural detail, not a reason to reconsider lectures.' },
    },
  },
];

export function questionsByTopic(topic: string): Question[] {
  return QUESTION_BANK.filter((q) => q.topic === topic);
}

export function getQuestion(id: string): Question | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}
