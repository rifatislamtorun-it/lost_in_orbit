// Story intro frames. {name} is replaced with the player's name. The story is fiction inspired by NASA's real plans.
export const STORY = [
  { kicker: 'EARTH · NASA MISSION CONTROL', title: 'You were chosen', text: '{name}, out of thousands of candidates, NASA has chosen you for one of the boldest missions ever planned: to help the first small crew live and work on Mars.', icon: '🌍' },
  { kicker: 'LAUNCH', title: 'Leaving home', text: 'Your ship, “Lost In Orbit”, lifts off from Earth. Mars is about 1.5 times farther from the Sun than Earth, so the trip is long. You and your crewmates train, check systems and wait.', icon: '🚀' },
  { kicker: 'TROUBLE IN ORBIT', title: 'Signal lost', text: 'Near Mars, the relay satellite goes silent. Your ship is lost in orbit — no link to Earth! Mission Control’s last message: “Land at the outpost. Keep the crew alive. We will find you.”', icon: '📡' },
  { kicker: 'DESCENT', title: 'Minutes of fire', text: 'Mars has only a thin atmosphere, mostly carbon dioxide, so it cannot slow a spacecraft by itself. A heat shield, a parachute and landing rockets must do the job — all in a few minutes.', icon: '🔥' },
];
export const STORY_END = { kicker: 'WELCOME TO MARS', title: 'Now survive', text: '{name}, the outpost is half-powered and short on supplies. Machines need repairs, the weather is rough, and every system needs power, water and air. Keep the crew alive until the resupply window opens. Mission Control is counting on you.', icon: '🔴' };
export const OUTRO = {
  win: '“Rescue beacon detected!” — Mission Control finally reconnects. {name}, you kept the outpost alive through dust, cold nights, radiation and shortages. Earth is proud of you.',
  lose: '{name}, the outpost needs another attempt. Every real Mars plan is tested many times before humans go. Try again — you can do it!',
};
