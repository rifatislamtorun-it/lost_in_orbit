// Step types: visit | enter | station | quiz | repair | decision | drive.   Steps with the same "g" (group) can be done in any order.
// target = an outdoor building (Habitat, SolarArray…) or an indoor station (Console, Galley, Planter…).
// sources = NASA pages behind the mission; facts = the real NASA data the mission is built on.
export const MISSIONS = [
  { id: 1, title: 'TOUCHDOWN', reward: { points: 100, credits: 60 }, sources: ['mars_facts', 'dust', 'chapea'],
    facts: ['A sol (Mars day) is about 24.6 hours.', 'Mars is about 1.5 AU from the Sun — sunlight takes ~13 minutes to arrive.', 'NASA suggests airlocks and suitports to keep Mars dust out of living quarters.'],
    brief: 'You made it down! The outpost is half-powered. Get inside the Habitat, call Mission Control, then find the key systems.',
    objective: 'Go inside the Habitat, call Mission Control, then find the Solar Array, Oxygen Generator and Water System.',
    steps: [
      { g: 0, type: 'enter', target: 'Habitat', label: 'Walk to the Habitat and go inside (press F)', title: 'Airlock', text: 'You pass through the airlock. Mars dust is very fine, so NASA studies airlocks and suitports that keep dust out of living quarters. Inside, the air is safe, so you take your white EVA suit off.', src: 'dust' },
      { g: 1, type: 'station', act: 'call', target: 'Console', label: 'Call Mission Control at the Command Console', title: 'Mission Control', text: 'Static… then a voice: “Outpost, this is Mission Control. Signal is weak. The relay satellite is down, so replies will be delayed. Stay alive, check your systems, and we will find you.” Real crews on Mars will work with communication delays — NASA\'s CHAPEA simulation uses delays up to 45 minutes each way.', src: 'chapea' },
      { g: 2, type: 'quiz', target: 'Console', label: 'Answer Mission Control\'s questions', quiz: ['q_sol', 'q_distance'] },
      { g: 3, type: 'visit', target: 'SolarArray', label: 'Find the Solar Array' },
      { g: 3, type: 'visit', target: 'OxygenGenerator', label: 'Find the Oxygen Generator' },
      { g: 3, type: 'visit', target: 'WaterExtractor', label: 'Find the Water System' },
    ] },
  { id: 2, title: 'POWER PROBLEM', reward: { points: 120, credits: 60 }, sources: ['mars_facts'],
    facts: ['Dust blocks sunlight, so solar panels make less power.', 'Mars is 1.5 AU from the Sun, so sunlight is weaker than on Earth.'],
    brief: 'Mission Control sees the solar array\'s output dropping. Go investigate and choose a fix.',
    objective: 'Inspect the Solar Array, decide how to fix it, then ask the Research Lab.',
    onStart: { fx: { sys: { solar: -0.4 } }, note: 'Solar output dropped to 60%!', alert: ['SolarArray'] },
    steps: [
      { g: 0, type: 'visit', target: 'SolarArray', label: 'Inspect Solar Array', title: 'Dusty panels!', text: 'The panels are covered in fine Martian dust. Less sunlight reaches the cells, so the array makes only about 60% of its normal power.', src: 'mars_facts' },
      { g: 1, type: 'decision', target: 'SolarArray', label: 'Decide how to fix the Solar Array', decision: 'solar_fix' },
      { g: 2, type: 'quiz', target: 'LabBench', label: 'Ask the Research Lab (go inside, press F)', quiz: ['q_solar_dust'] },
    ] },
  { id: 3, title: 'WATER SHORTAGE', reward: { points: 140, credits: 60 }, sources: ['mars_facts', 'odyssey'],
    facts: ['Water on Mars today is ice just under the surface near the poles, plus salty seasonal flows.', 'The air is too thin for liquid water to last long on the surface.'],
    brief: 'Water production is falling. Scan for ice with the rover, fix the extractor, then plan the water supply.',
    objective: 'Scan for ice with the Rover, repair the Water Extractor, then plan water in the Habitat.',
    onStart: { fx: { water: -8, sys: { waterProd: -0.45 } }, note: 'Water production dropped!', alert: ['WaterExtractor'] },
    steps: [
      { g: 0, type: 'visit', target: 'Rover', label: 'Scan for ice with the Rover', anim: 'Scan', rover: true, title: 'Rover ice scan', text: 'The rover scans the ground. NASA says today\'s water on Mars is mostly ice just under the surface near the poles — and the air is too thin for liquid water to last long. Good thing we have an extractor!', src: 'mars_facts' },
      { g: 1, type: 'quiz', target: 'WaterExtractor', label: 'Check the Water System', quiz: ['q_ice', 'q_tf_lakes'] },
      { g: 2, type: 'repair', target: 'WaterExtractor', label: 'Repair the Water Extractor', title: 'Water Extractor', fx: { sys: { waterProd: 0.2 } } },
      { g: 3, type: 'decision', target: 'Console', label: 'Plan the water supply at the Habitat Console', decision: 'water_plan' },
    ] },
  { id: 4, title: 'OXYGEN EMERGENCY', reward: { points: 160, credits: 60 }, sources: ['moxie', 'mars_facts'],
    facts: ['MOXIE made oxygen from Mars\' CO₂ in 16 runs.', 'It produced 122 g in total — up to 12 g/hour at 98%+ purity.', '“Living off the land” is called in-situ resource utilization (ISRU).'],
    brief: 'The Oxygen Generator is unstable! Restore it before the air runs low.',
    objective: 'Repair the Oxygen Generator and decide how to keep oxygen flowing.',
    onStart: { fx: { oxygen: -10, sys: { o2Prod: -0.5 } }, note: 'Oxygen generator warning!', alert: ['OxygenGenerator'] },
    steps: [
      { g: 0, type: 'repair', target: 'OxygenGenerator', label: 'Repair the Oxygen Generator', title: 'Oxygen Generator', fx: { sys: { o2Prod: 0.25 } } },
      { g: 1, type: 'quiz', target: 'OxygenGenerator', label: 'Test your oxygen knowledge', quiz: ['q_oxy', 'q_moxie', 'q_moxie2'] },
      { g: 2, type: 'decision', target: 'OxygenGenerator', label: 'Choose how to keep oxygen steady', decision: 'o2_plan' },
    ] },
  { id: 5, title: 'DUST STORM', reward: { points: 180, credits: 60 }, storm: 1, sources: ['mars_facts', 'dust'],
    facts: ['Dust storms can cover much of Mars; the dust can take months to settle.', 'Fine dust (under 2.5 micrometers) can get deep into lungs.', 'Suitports and dual-chamber airlocks could keep dust out of habitats.'],
    brief: 'Mission Control has detected rising dust activity near the colony. A big storm is on its way!',
    objective: 'Read the storm warning, prepare the colony, take shelter, and learn how to keep dust out.',
    onStart: { fx: { sys: { solar: -0.35 } }, note: 'Dust storm approaching — solar power will drop!', alert: ['DustStormZone'] },
    onComplete: { fx: { sys: { solar: 0.35 } }, note: 'The storm passed and the sky is clearing.' },
    steps: [
      { g: 0, type: 'quiz', target: 'Antenna', label: 'Read the storm warning at the Antenna', quiz: ['q_storm', 'q_best_storm'] },
      { g: 1, type: 'decision', target: 'Habitat', label: 'Prepare the colony (at the Habitat)', decision: 'storm_prep' },
      { g: 2, type: 'enter', target: 'Habitat', label: 'Take shelter inside the Habitat (press F)', title: 'Safe inside', text: 'You rush through the airlock as the sky turns red-brown. NASA says Mars dust storms can cover much of the planet and that it can take months for the dust to settle.', src: 'mars_facts' },
      { g: 3, type: 'quiz', target: 'Console', label: 'Study dust safety at the Console', quiz: ['q_dust_fine', 'q_airlock'] },
    ] },
  { id: 6, title: 'RADIATION ALERT', reward: { points: 200, credits: 60 }, sources: ['mars_facts', 'goals', 'hrp'],
    facts: ['Mars has no global magnetic field today.', 'Its thin atmosphere offers little protection.', 'NASA\'s Human Research Program studies how to keep crews healthy.'],
    brief: 'Radiation sensors are warning of higher exposure. How will you protect the crew?',
    objective: 'Scan radiation in the Lab, choose protection at the Radiation Shelter, then rest inside it.',
    onStart: { fx: { radiation: -10, sys: { radLoad: 8 } }, note: 'Radiation risk is rising!', alert: ['RadiationShelter'] },
    steps: [
      { g: 0, type: 'station', act: 'scan', target: 'LabBench', label: 'Scan radiation at the Lab Bench (go inside, press F)', title: 'Radiation scan', text: 'The lab\'s instruments show more radiation than usual reaching the colony. Mars has no global magnetic field today and little air, so the crew needs shielding.', src: 'mars_facts' },
      { g: 1, type: 'quiz', target: 'LabBench', label: 'Answer the radiation questions', quiz: ['q_magnet', 'q_tf_shield'] },
      { g: 2, type: 'decision', target: 'RadiationShelter', label: 'Protect the crew at the Radiation Shelter', decision: 'rad_plan' },
      { g: 3, type: 'station', act: 'rest', target: 'Dosimeter', label: 'Rest in the Radiation Shelter (go inside, press F)', title: 'Safe room', text: 'Behind thick walls the dosimeter readings drop. Keeping crews safe from radiation is a major part of NASA\'s planning for human missions to Mars.', src: 'goals' },
    ] },
  { id: 7, title: 'FOOD CRISIS', reward: { points: 220, credits: 60 }, sources: ['mars_facts', 'chapea'],
    facts: ['NASA\'s CHAPEA crew grew crops and managed limited resources for 378 days.', 'Mars gets less sunlight than Earth, so plants need lights and warmth.'],
    brief: 'The greenhouse is producing less food. Power and food are tied together — balance them, then share a meal!',
    objective: 'Go into the Greenhouse, fix food production, harvest, and eat in the Habitat Galley.',
    onStart: { fx: { food: -10, sys: { foodProd: -0.4 } }, note: 'Greenhouse production is low!', alert: ['Greenhouse'] },
    steps: [
      { g: 0, type: 'enter', target: 'Greenhouse', label: 'Go inside the Greenhouse (press F)', title: 'Hungry plants', text: 'Warm, humid air — and pale, slow-growing plants. Sunlight on Mars is weaker than on Earth, so greenhouses need power for lights.', src: 'mars_facts' },
      { g: 1, type: 'quiz', target: 'Planter', label: 'Answer the plant questions at the Grow Beds', quiz: ['q_sun', 'q_food_crew'] },
      { g: 2, type: 'decision', target: 'Planter', label: 'Fix food production at the Grow Beds', decision: 'food_plan' },
      { g: 3, type: 'station', act: 'harvest', target: 'Harvest', label: 'Harvest fresh food at the Harvest Table', title: 'Fresh harvest', text: 'Crisp lettuce and tomatoes! Fresh food adds variety to the crew\'s meals.', src: 'chapea' },
      { g: 4, type: 'station', act: 'eat', target: 'Galley', label: 'Share a meal in the Habitat Galley', title: 'Dinner time', text: 'A warm meal lifts everyone\'s spirits. Eating well matters as much as any machine on a long mission.', src: 'chapea' },
    ] },
  { id: 8, title: 'ROVER SURVEY', reward: { points: 240, credits: 80 }, sources: ['dust', 'perseverance_main', 'curiosity'],
    facts: ['Perseverance explores Jezero Crater.', 'Its panorama shows Neretva Vallis, a long-dried river channel through the crater rim.', 'Rovers help prepare the way for human explorers.'],
    brief: 'Mission Control wants a survey of the crater. Grab the rover checklist, drive out to the crater, and scan the rocks.',
    objective: 'Pick up the checklist in the Garage, drive a rover to the Crater, scan, and drive back.',
    steps: [
      { g: 0, type: 'station', act: 'prep', target: 'Workbench', label: 'Pick up the rover checklist at the Garage Workbench (press F)', title: 'Rover checklist', text: 'Tires, power, radio, tools — all checked! Engineers design rovers so crews can drive, scan and repair them far from Earth.', src: 'perseverance_main' },
      { g: 1, type: 'drive', target: 'Crater', label: 'Drive a rover to the Crater (stand next to a rover and press F)' },
      { g: 2, type: 'visit', target: 'Crater', label: 'Scan the crater rocks', anim: 'Scan', title: 'Crater survey', text: 'Layers of rock tell a story. NASA\'s Perseverance studies Jezero Crater, including Neretva Vallis — a long-dried river channel — to learn how wet and warm ancient Mars was.', src: 'dust' },
      { g: 3, type: 'quiz', target: 'Crater', label: 'Answer the geology question', quiz: ['q_jezero'] },
      { g: 4, type: 'drive', target: 'Habitat', label: 'Drive the rover back to the Habitat' },
    ] },
  { id: 9, title: 'COLD NIGHT', reward: { points: 260, credits: 80 }, time: 17.6, sources: ['mars_facts', 'moons', 'chapea'],
    facts: ['Mars temperatures range from about 20 °C down to about −153 °C.', 'The thin atmosphere lets heat escape easily.', 'Phobos and Deimos — Mars\' two small moons — rise in the night sky.', 'CHAPEA communication delays reach 45 minutes each way.'],
    brief: 'The sun is setting and a bitterly cold night is coming. Keep the greenhouse warm, check the antenna, and get some sleep.',
    objective: 'Protect the greenhouse, check the Antenna, sleep in the Habitat, then check the Solar Array at sunrise.',
    onStart: { fx: { food: -4, sys: { foodProd: -0.1 } }, note: 'Night is falling — it will get very cold!', alert: ['Greenhouse'] },
    steps: [
      { g: 0, type: 'decision', target: 'Planter', label: 'Decide how to keep the plants warm (Greenhouse, press F)', decision: 'night_heat' },
      { g: 1, type: 'quiz', target: 'Antenna', label: 'Check the Antenna: night-time questions', quiz: ['q_cold', 'q_comm_delay', 'q_moons'] },
      { g: 2, type: 'station', act: 'sleep', target: 'Bed', label: 'Sleep in the Habitat (press F at the door, then E at the bed)', title: 'Goodnight, Mars', text: 'You rest while the outpost hums. A sol is about 24.6 hours, and crews keep a regular sleep schedule to stay healthy.', src: 'mars_facts' },
      { g: 3, type: 'visit', target: 'SolarArray', label: 'Check the Solar Array at sunrise', title: 'Sunrise on Mars', text: 'Weak sunlight — it takes about 13 minutes to reach Mars — but the panels wake up and power flows again. A new sol begins!', src: 'mars_facts' },
    ] },
  { id: 10, title: 'FINAL OUTPOST CHALLENGE', reward: { points: 300, credits: 0 }, final: true, sources: ['mars_facts', 'moxie', 'dust', 'chapea', 'goals'],
    facts: ['Power, water, oxygen, food, radiation safety and crew health all depend on each other.', 'Real missions have limited resources — NASA\'s CHAPEA crew managed them for 378 days.'],
    brief: 'Everything is under stress at once! Fix each system, then run a 3-sol survival test at the Habitat Console.',
    objective: 'Stabilise Power, Water, Oxygen, Food and Radiation Safety, then start the survival test at the Command Console.',
    onStart: { fx: { power: -8, water: -8, oxygen: -6, food: -8, radiation: -8, sys: { solar: -0.3, waterProd: -0.3, o2Prod: -0.25, foodProd: -0.3, radLoad: 6 } }, note: 'Multiple systems are stressed!', alert: ['SolarArray', 'WaterExtractor', 'OxygenGenerator', 'Greenhouse', 'RadiationShelter'] },
    steps: [
      { g: 0, type: 'decision', target: 'SolarArray', label: 'Stabilise Power at the Solar Array', decision: 'f_power' },
      { g: 0, type: 'decision', target: 'WaterExtractor', label: 'Stabilise Water at the Water Extractor', decision: 'f_water' },
      { g: 0, type: 'decision', target: 'OxygenGenerator', label: 'Stabilise Oxygen at the Generator', decision: 'f_o2' },
      { g: 0, type: 'decision', target: 'Greenhouse', label: 'Stabilise Food at the Greenhouse', decision: 'f_food' },
      { g: 0, type: 'decision', target: 'RadiationShelter', label: 'Stabilise Radiation Safety at the Shelter', decision: 'f_rad' },
      { g: 1, type: 'station', act: 'final', target: 'Console', label: 'Start the 3-sol survival test at the Command Console (Habitat)', title: 'Survival test', text: 'Commander, all systems are set. Mission Control will now simulate three sols (Martian days) to see whether the outpost can survive. Good luck!', src: null },
    ] },
];

const credit = (n) => `Cost: ${n} credits`;
export const DECISIONS = {
  solar_fix: { title: 'Solar array damaged', situation: 'The array makes only 60% of its usual power. What do you do?', pick: 1, options: [
    { label: 'A. Repair now', cost: `${credit(100)} · Time: 1 mission cycle`, fx: { credits: -100, sys: { solar: 0.4 } }, eng: 100, feedback: 'Great engineering! Cleaning and fixing the panels brings power back to full — but it used up credits. Real missions always have a budget.' },
    { label: 'B. Reduce colony power use', cost: 'Power demand −20% · Habitat comfort −5%', fx: { health: -5, sys: { demand: -0.2 } }, eng: 70, feedback: 'A smart short-term fix: use less than you make. The crew is a little less comfortable, and the array is still weak.' },
    { label: 'C. Ignore it', cost: 'Free now · Risk of power failure goes up', fx: { sys: { risk: 0.35 } }, eng: 30, feedback: 'Nothing was spent — but the colony now makes less power each cycle and a power failure could happen. Ignoring problems often costs more later!' },
  ] },
  water_plan: { title: 'Water supply plan', situation: 'The extractor is running again, but still below normal. How will the colony cope?', pick: 1, options: [
    { label: 'A. Run the extractor harder', cost: 'Water production +45% · Power use +10%', fx: { sys: { waterProd: 0.45, demand: 0.1 } }, eng: 85, feedback: 'More water, but the extractor draws more power. Every system shares the same electricity!' },
    { label: 'B. Recycle water in the Habitat', cost: `${credit(120)} · Water use −25%`, fx: { credits: -120, sys: { waterUse: -0.25 } }, eng: 100, feedback: 'Recycling is how real space stations save water. It costs credits up front but saves water every cycle.' },
    { label: 'C. Ration water', cost: 'Free · Crew health −6%', fx: { health: -6, sys: { waterUse: -0.15 } }, eng: 50, feedback: 'Rationing saves water, but a thirsty crew feels worse. It\'s a short-term answer, not a solution.' },
  ] },
  o2_plan: { title: 'Keep the oxygen flowing', situation: 'The generator is working again but not at full strength.', pick: 1, options: [
    { label: 'A. Run the generator at full power', cost: 'Oxygen +25% · Power use +35%', fx: { sys: { o2Prod: 0.25, demand: 0.35 } }, eng: 80, feedback: 'Oxygen is back to normal, but the generator now uses much more power. Watch your power meter!' },
    { label: 'B. Replace worn parts', cost: `${credit(150)} · Oxygen back to normal`, fx: { credits: -150, sys: { o2Prod: 0.25 } }, eng: 100, feedback: 'Fixing the cause, not just the symptom. Spare parts cost credits but keep power use low.' },
    { label: 'C. Limit crew activity', cost: 'Free · Oxygen +8 now · Crew health −5%', fx: { oxygen: 8, health: -5 }, eng: 45, feedback: 'Resting uses less oxygen, but it only buys time — the generator is still weak.' },
  ] },
  storm_prep: { title: 'Dust storm preparations', situation: 'You have time for TWO preparations. Choose the two you think matter most.', pick: 2, options: [
    { label: 'Protect the solar arrays', cost: `${credit(40)} · Storm power loss reduced`, fx: { credits: -40, sys: { solar: 0.2 } }, eng: 90, feedback: 'Covered, tilted panels keep working better.' },
    { label: 'Reduce power consumption', cost: 'Power demand −25% · Comfort −3%', fx: { health: -3, sys: { demand: -0.25 } }, eng: 85, feedback: 'Using less power stretches your supply through the storm.' },
    { label: 'Move the crew into the Habitat', cost: 'Crew health +5 · Radiation safety +5', fx: { health: 5, radiation: 5 }, eng: 80, feedback: 'Safe indoors: the crew is protected and comfortable.' },
    { label: 'Activate backup batteries', cost: `${credit(60)} · Power +20 now`, fx: { credits: -60, power: 20 }, eng: 75, feedback: 'Batteries give a quick boost, but they only store energy — they don\'t make more.' },
  ] },
  rad_plan: { title: 'Radiation protection', situation: 'How will you protect the crew?', pick: 1, options: [
    { label: 'A. Add soil walls around the Habitat', cost: `${credit(150)} · Shielding +40%`, fx: { credits: -150, sys: { shield: 0.4, radLoad: -8 } }, eng: 100, feedback: 'Thick material between the crew and space blocks radiation. Great long-term protection!' },
    { label: 'B. Shelter during radiation peaks', cost: 'Free · Less outdoor work · Comfort −5%', fx: { health: -5, sys: { radLoad: -6 } }, eng: 75, feedback: 'A good schedule helps a lot and costs nothing, but work slows down.' },
    { label: 'C. Keep working as normal', cost: 'Free · Radiation stays high', fx: {}, eng: 25, feedback: 'The crew stays exposed. Radiation safety will keep dropping each cycle.' },
  ] },
  food_plan: { title: 'Food production is low', situation: 'Food is the crew\'s fuel. How do you fix it?', pick: 1, options: [
    { label: 'A. Increase greenhouse power', cost: 'Food +40% · Power use +15%', fx: { sys: { foodProd: 0.4, demand: 0.15 } }, eng: 85, feedback: 'Brighter lights grow more food, but the greenhouse uses more electricity.' },
    { label: 'B. Reduce crew food use', cost: 'Free · Crew health slowly drops', fx: { sys: { cons: -0.2 } }, eng: 50, feedback: 'Smaller meals save food but weaken the crew over time.' },
    { label: 'C. Build an extra greenhouse', cost: `${credit(200)} · Food production +60%`, fx: { credits: -200, sys: { foodProd: 0.6 } }, eng: 95, feedback: 'More growing space is a big long-term win — if you can afford it!' },
  ] },
  night_heat: { title: 'Cold night ahead', situation: 'Mars nights are extremely cold because the thin air lets heat escape. How do you protect the greenhouse?', pick: 1, options: [
    { label: 'A. Turn the greenhouse heaters up', cost: 'Power use +12% · Food production +10%', fx: { power: -6, sys: { demand: 0.12, foodProd: 0.1 } }, eng: 80, feedback: 'Heaters keep plants alive, but they need power — and there is no sunlight at night!' },
    { label: 'B. Cover the plants with insulating blankets', cost: `${credit(40)} · Food +4`, fx: { credits: -40, food: 4, sys: { foodProd: 0.1 } }, eng: 100, feedback: 'Insulation keeps heat in without using much power. Great engineering!' },
    { label: 'C. Leave it and hope', cost: 'Free · Food −10', fx: { food: -10 }, eng: 30, feedback: 'Cold nights damage crops. Planning ahead is part of every mission.' },
  ] },
  f_power: { title: 'Final: Power', situation: 'Solar output is low.', pick: 1, options: [
    { label: 'Clean all the panels', cost: credit(50), fx: { credits: -50, sys: { solar: 0.35 } }, eng: 100, feedback: 'Clean panels, strong power.' },
    { label: 'Cut non-essential power', cost: 'Power demand −20% · Comfort −3%', fx: { health: -3, sys: { demand: -0.2 } }, eng: 70, feedback: 'Using less works, at a small comfort cost.' },
    { label: 'Hope for sunshine', cost: 'Free · Risk of power failure', fx: { sys: { risk: 0.25 } }, eng: 30, feedback: 'Hope is not an engineering plan!' },
  ] },
  f_water: { title: 'Final: Water', situation: 'Water production is down.', pick: 1, options: [
    { label: 'Boost the extractor', cost: 'Water +35% · Power use +10%', fx: { sys: { waterProd: 0.35, demand: 0.1 } }, eng: 85, feedback: 'More water, more power use.' },
    { label: 'Upgrade water recycling', cost: credit(80), fx: { credits: -80, sys: { waterUse: -0.25 } }, eng: 100, feedback: 'Recycling saves water every cycle.' },
    { label: 'Ration water', cost: 'Free · Crew health −5%', fx: { health: -5, sys: { waterUse: -0.15 } }, eng: 50, feedback: 'Rationing helps, but the crew suffers.' },
  ] },
  f_o2: { title: 'Final: Oxygen', situation: 'Oxygen output is weak.', pick: 1, options: [
    { label: 'Service the generator', cost: credit(60), fx: { credits: -60, sys: { o2Prod: 0.3 } }, eng: 100, feedback: 'Maintenance keeps life support healthy.' },
    { label: 'Run it at full power', cost: 'Oxygen +20% · Power use +15%', fx: { sys: { o2Prod: 0.2, demand: 0.15 } }, eng: 75, feedback: 'It works, but costs electricity.' },
    { label: 'Wait and see', cost: 'Free · Oxygen stays low', fx: {}, eng: 25, feedback: 'Never wait on oxygen!' },
  ] },
  f_food: { title: 'Final: Food', situation: 'The greenhouse is struggling.', pick: 1, options: [
    { label: 'Boost the grow lights', cost: 'Food +35% · Power use +10%', fx: { sys: { foodProd: 0.35, demand: 0.1 } }, eng: 85, feedback: 'More light, more food, more power.' },
    { label: 'Add a grow tray', cost: credit(70), fx: { credits: -70, sys: { foodProd: 0.35 } }, eng: 100, feedback: 'More growing space with no extra power use.' },
    { label: 'Smaller meals', cost: 'Free · Crew health drops slowly', fx: { sys: { cons: -0.2 } }, eng: 50, feedback: 'Saves food, but weakens the crew.' },
  ] },
  f_rad: { title: 'Final: Radiation', situation: 'Radiation exposure is high.', pick: 1, options: [
    { label: 'Build a shielded sleeping area', cost: credit(80), fx: { credits: -80, sys: { shield: 0.35, radLoad: -4 } }, eng: 100, feedback: 'Sleeping behind thick shielding gives hours of protection every day.' },
    { label: 'Use a shelter schedule', cost: 'Free · Comfort −3%', fx: { health: -3, sys: { radLoad: -4 } }, eng: 70, feedback: 'Good habits help a lot.' },
    { label: 'Skip it', cost: 'Free · Radiation stays high', fx: {}, eng: 25, feedback: 'The crew stays exposed.' },
  ] },
};

export const EVENTS = [
  { id: 'solar_drop', icon: '☀️', title: 'Solar array efficiency drop', where: 'SolarArray', text: 'A layer of dust is dimming the panels a little.', options: [
    { label: 'Send the cleaning bot', cost: 'Cost: 30 credits', fx: { credits: -30, power: 8 }, result: 'Panels cleaned — power is up!' },
    { label: 'Ignore it', cost: 'Free', fx: { power: -6 }, result: 'Power dipped a bit. Small problems add up.' } ] },
  { id: 'leak', icon: '💧', title: 'Water system leak', where: 'WaterExtractor', text: 'A small leak was found in a water pipe.', options: [
    { label: 'Seal the pipe', cost: 'Cost: 20 credits', fx: { credits: -20 }, result: 'Sealed! No water was lost.' },
    { label: 'Leave it for now', cost: 'Free', fx: { water: -8 }, result: 'You lost some water. Quick fixes save resources.' } ] },
  { id: 'o2_warn', icon: '🫁', title: 'Oxygen generator warning', where: 'OxygenGenerator', text: 'A yellow light is blinking on the oxygen generator.', options: [
    { label: 'Run a diagnostic', cost: 'Power −4', fx: { power: -4, oxygen: 4 }, result: 'Diagnostic done — a clogged filter was cleaned.' },
    { label: 'Wait and watch', cost: 'Free', fx: { oxygen: -6 }, result: 'Oxygen dipped. Warnings are there to help you!' } ] },
  { id: 'rover', icon: '🤖', title: 'Rover malfunction', where: 'Rover', text: 'The rover has a stuck wheel in the soft sand.', options: [
    { label: 'Re-route the rover carefully', cost: 'Cost: 15 credits', fx: { credits: -15 }, result: 'The rover is free again.' },
    { label: 'Leave it stuck', cost: 'Free', fx: { credits: -25 }, result: 'Mission Control loses some science time (−25 credits).' } ] },
  { id: 'comm', icon: '📡', title: 'Communication delay', where: 'Antenna', text: 'Messages between Earth and Mars take time to travel. Mission Control cannot reply right away.', options: [
    { label: 'Follow the emergency checklist', cost: 'Free', fx: { health: 4 }, result: 'The crew stays calm and follows the plan. +4 health.' },
    { label: 'Wait for Earth to answer', cost: 'Free', fx: { health: -3 }, result: 'Waiting made the crew nervous. −3 health.' } ] },
  { id: 'greenhouse', icon: '🌱', title: 'Greenhouse temperature problem', where: 'Greenhouse', text: 'Nights on Mars are very cold. The greenhouse is chilly.', options: [
    { label: 'Turn the heaters up', cost: 'Power −6', fx: { power: -6, food: 5 }, result: 'Warm plants grow well. +5 food.' },
    { label: 'Leave it', cost: 'Free', fx: { food: -8 }, result: 'Some plants wilted. −8 food.' } ] },
  { id: 'discovery', icon: '🪨', title: 'Unexpected geological discovery!', where: 'Rover', text: 'The rover spotted layered rocks that might tell the story of ancient Mars.', options: [
    { label: 'Study them', cost: 'Cost: 10 credits', fx: { credits: -10 }, science: 15, result: 'Great science! +15 Science Points.' },
    { label: 'Keep exploring', cost: 'Free', fx: {}, result: 'You move on. Maybe next time!' } ] },
  { id: 'haze', icon: '🌫️', title: 'Dust haze rolling in', where: 'DustStormZone', text: 'A thin haze of dust is blowing across the colony.', options: [
    { label: 'Fold the panels in', cost: 'Power −5', fx: { power: -5 }, result: 'Panels stay clean and safe.' },
    { label: 'Keep panels open', cost: 'Free', fx: { power: -10 }, result: 'The haze dimmed the Sun. −10 power.' } ] },
];
