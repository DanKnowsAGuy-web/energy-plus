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

v6 (lab/redesign-v6): v5 with the copy pass. One word per idea (overpaying,
day one, payback, fixes, diagnosis/pilot), plainer bill chapters, shorter
stack rows and steps, short Cliff labels, money cut to Day one + Your call,
redundant lines and the duplicate FAQ removed. v6.css holds the money layout.

v7 (lab/redesign-v7): v6 with the motion pass. The "Your energy bill" icon
grows into the bill card; the peak spike gets cut, hits the ceiling and
settles under it (phone illustration and desktop building); the two cost
cards play slower and the replacement flag counts years forward; the vendor
chips land in the "we handle all of it" checklist; a line runs through the
three steps on phones and each step's picture plays; Cliff's figures flip
into place and his photo drifts; the cash flow chart draws itself.
New code lives in v7.css and v7.js (plus small hooks in building.js and v2.js).
Reduced motion and ?static=1 keep v6's still states.
