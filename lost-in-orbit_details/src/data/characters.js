// Playable crew. Roles are inspired by the four roles in NASA's CHAPEA Mars-habitat simulation
// (commander, medical officer, science officer, flight engineer). Names are fictional.
export const CREW = [
  { id: 'commander', role: 'Mission Commander', name: 'Cmdr. Aria Voss', icon: '🧑‍🚀', skin: 0xb98060, hair: 'bun', hairCol: 0x1b120e, jacket: 0x172a63, accent: 0xff7a3d, scale: 1.0,
    perk: 'Leadership — +10% bonus credits from every mission and faster crew recovery.' },
  { id: 'engineer', role: 'Flight Engineer', name: 'Eng. Tariq Haddad', icon: '🛠️', skin: 0x8a5a3c, hair: 'short', hairCol: 0x120c08, beard: true, jacket: 0x7a3a14, accent: 0xffc83d, scale: 1.04,
    perk: 'Fixer — repair mini-games have a bigger green zone, and every repair costs 15% fewer credits.' },
  { id: 'science', role: 'Science Officer', name: 'Dr. Mira Chen', icon: '🔬', skin: 0xe0b494, hair: 'ponytail', hairCol: 0x0e0b0a, glasses: true, jacket: 0x1c5a52, accent: 0x4fd1ff, scale: 0.96,
    perk: 'Researcher — +5 bonus science points on every correct answer, and one wrong answer is crossed out for you.' },
  { id: 'medic', role: 'Medical Officer', name: 'Dr. Ellis Okafor', icon: '⚕️', skin: 0x6b4328, hair: 'afro', hairCol: 0x0b0807, jacket: 0x6a1f2f, accent: 0xffffff, scale: 1.0,
    perk: 'Medic — meals and rest heal the crew 50% more, and radiation/dust damage to health is reduced.' },
];
export const crewById = (id) => CREW.find((c) => c.id === id) || CREW[0];
