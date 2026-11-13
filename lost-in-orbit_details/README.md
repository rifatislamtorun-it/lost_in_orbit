# LOST IN ORBIT — v3 (StellarSpark · NASA Space Apps Challenge 2026)

A 3D browser game for ages 10–13. You are an astronaut sent by NASA to a Mars outpost. Fix machines, enter habitats, drive rovers,
eat, sleep, answer science questions and make engineering trade-offs to keep the crew alive through 10 missions.
Independent student project — **not an official NASA product.**

## Run it (Windows, fresh PC)
Double-click **`RUN_GAME.bat`** — it installs Node.js if missing, installs packages, builds the game and opens your browser.
From a command prompt:  `cd` into this folder and run `RUN_GAME.bat`

## Run it (manual / Mac / Linux)
    npm install
    npm run dev       # open the printed address in Chrome / Edge / Firefox (desktop)
    npm run build     # production build in dist/

## Story
Enter your name → choose a crew member → story (NASA picks you, relay satellite lost, descent) → 3D landing → Mission 1.
(Fiction inspired by NASA's real plans.)

## Controls
| Key | Action |
|---|---|
| W A S D | Move / drive |
| Mouse | Look (click the game to capture the mouse) |
| Shift | Sprint / rover boost |
| Space | Jump / handbrake |
| E | Interact (stations, machines, quiz, repair…) |
| F | Enter/exit buildings (airlock doors), get in/out of a rover |
| H | Helmet on/off (outside) |
| C | Switch crew member |
| Esc | Menu |

## What's new in v3
* **Name entry + story intro + 3D landing cinematic.**
* **4 playable crew** (Commander, Flight Engineer, Science Officer, Medical Officer) with 3D preview and perks. Switch any time with C.
* **White EVA suit outside, normal clothes inside.** Walk through an airlock door (F) and the suit comes off.
* **5 enterable rooms:** Habitat (console, galley, beds, lockers), Greenhouse, Research Lab, Garage, Radiation Shelter.
* **Eat food** (Galley, Harvest table), **sleep** (night → morning).
* **3 drivable rovers** (F next to a rover). Headlights at night.
* **Day & night:** one Mars sol = 12 real minutes (`CONFIG.time.solSeconds`). Sun, dusk, stars, Phobos & Deimos, head-lamp, lamp posts.
* **Minimap on top**, Mars clock and temperature.
* **10 missions** built on NASA data (see `NASA_SOURCES_AND_DATA.txt`).
* Better graphics (PBR materials, sky reflections, bloom, atmospheric fog), more map objects (roads, lamps, pipelines, containers, vehicles, drones, flags, signs, mining site, research outpost, radio towers).
* New loading page and menu design; graphics quality setting (Auto/High/Medium/Low) in the pause menu.

## The 10 missions
1 Touchdown · 2 Power Problem · 3 Water Shortage · 4 Oxygen Emergency · 5 Dust Storm · 6 Radiation Alert · 7 Food Crisis · 8 Rover Survey · 9 Cold Night · 10 Final Outpost Challenge

## Sources and data
All NASA links, the facts behind each mission and the source of every quiz question are listed in **`NASA_SOURCES_AND_DATA.txt`**.
Please click each link once before you submit — I could only open four of the NASA pages directly while building.

## Where things are
    src/config/game.config.js   settings (time speed, graphics, optional GLB switch)
    src/data/                   missions.js, quizzes.js, nasaSources.js, characters.js, story.js, resources.js
    src/game/                   Game, World, Interiors, Vehicles, DayNight, Landing, Character, Player, Missions …
    src/ui/                     HUD, menus, panels, IntroUI, CharacterSelect …
The astronaut and the whole map are generated in code. To use your own GLB files instead, set `USE_GLB` in `game.config.js`
and see `public/assets/*/README.txt`.

## Known limits
* Tested with an automated bot in a software-rendered browser (all 10 missions complete, no console errors). Speed on real graphics cards is untested — use the Graphics setting if it feels slow.
* Fonts load from Google Fonts when online (fallbacks are used offline).
