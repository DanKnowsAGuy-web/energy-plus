Energy+ redesign v3 draft (local, unpublished).
Open via any static server from this folder root, then visit /lab/redesign-v3/index.html
(e.g. python -m http.server 5178, then http://localhost:5178/lab/redesign-v3/index.html).
The page loads shared files from ../../assets and ../../overspend-calculator, included here.

v4 (lab/redesign-v4): v3 plus the isometric building folded into the pinned bill
section (desktop only). Files changed from v3: index.html (scene markup, two tags),
v2.js (three "announce" lines), plus new building.js and building.css.
Preview other building types with ?facility=restaurant or ?facility=tower.

v5 (lab/redesign-v5): the story restructure. Hero promise, a three-way map,
zoom into the bill, the two other costs as the equipment's payoff, why nobody
fixes this, the diagnosis (Cliff), three steps, then "we handle all of it"
(the stack, the equipment, the money), proof, calculator, close.
New styles live in v5.css; everything else is carried from v4.
