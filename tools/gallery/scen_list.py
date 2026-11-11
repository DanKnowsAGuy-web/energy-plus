import asyncio, sys
sys.path.insert(0, '/home/claude/watt')
from gallery import main
FAC = [("grocery","Supermarket / Grocery"),("cold","Cold Storage / Food Distribution"),("hotel","Hotels / Hospitality"),("qsr","Multi-Unit Restaurants"),("cstore","Convenience / Fuel"),("health","Senior Living / Healthcare"),("ind","Manufacturing / Industrial"),("fit","Fitness Centers"),("dc","Data Centers"),("mf","Multifamily"),("office","Office / School / General"),("retail","Retail Centers / Multi-Tenant")]
def base(**kw):
    p = {"why": ("opt","My bills keep going up"), "facility": ("opt","Supermarket / Grocery"), "locations": ("opt","2 to 5"),
         "stateQ": ("opt","All in one state"), "statusQ": ("opt","Open year-round"), "bill": ("idx",2),
         "dial": ("opt","Somewhere in that range"), "season": ("opt","Summer"), "role": ("opt","Owner / Operator")}
    p.update(kw); return p
S = []
S.append({"id":"main","group":"Main path","title":"Grocery, 2 to 5 stores in Texas, open year-round",
  "desc":"Every screen in order for one typical visitor, from hello to the report.",
  "plan": base(bill=("idx",3), dial=("idx",2), doneQ=("multi",["LED lighting"]), role=("opt","CFO / Finance"))})
for k, label in FAC:
    S.append({"id":"fac-"+k,"group":"Each building type","title":label,
      "desc":"2 to 5 locations in Texas, open year-round, the third bill range. Only the questions unique to this building type are shown, then the report.",
      "show":["pathStep","season"], "plan": base(facility=("opt",label))})
S += [
 {"id":"br-one","group":"Branches","title":"Just one location","desc":"Picking 1 location skips the one-state or several-states question.","show":["locations","stateQ","singleState","statusQ"],"plan":base(locations=("opt","1"))},
 {"id":"br-multi","group":"Branches","title":"Locations in more than one state","desc":"Region picker. Here: Southeast and Midwest.","show":["stateQ","pickStates","statusQ","bill","dial"],"plan":base(stateQ=("opt","In more than one state"), pickStates=("regions",["Southeast","Midwest"]))},
 {"id":"br-nation","group":"Branches","title":"Nationwide","desc":"Uses U.S. averages across the lower 48.","show":["stateQ","statusQ","bill"],"plan":base(stateQ=("opt","Nationwide"))},
 {"id":"br-seasonal","group":"Branches","title":"Seasonal, closed part of the year","desc":"Adds the months-open question.","show":["statusQ","monthsQ","bill"],"plan":base(statusQ=("opt","Seasonal"), monthsQ=("opt","6 to 8 months"))},
 {"id":"br-new","group":"Branches","title":"Opened in the last year","desc":"","show":["statusQ","bill"],"plan":base(statusQ=("opt","Opened in the last year"))},
 {"id":"br-plan","group":"Branches","title":"Not built yet, still planning","desc":"Ends early with the design-stage message.","show":["statusQ","planning"],"plan":base(statusQ=("opt","Not built yet"))},
 {"id":"br-size","group":"Branches","title":"Doesn't know the bill","desc":"\"Not sure, help me estimate\" switches to a building-size question.","show":["bill","sizeQ","season"],"plan":base(bill=("opt","Not sure"), sizeQ=("idx",1))},
 {"id":"br-under","group":"Branches","title":"Under the $10K a month cutoff","desc":"One office building with the smallest bill range ends at the keep-me-posted screen.","show":["bill","dial","under"],"plan":base(facility=("opt","Office / School / General"), locations=("opt","1"), bill=("idx",0))},
 {"id":"br-done","group":"Branches","title":"Already upgraded several things","desc":"Battery, solar, controls and LED already done. Those savings drop out of the report.","show":["doneQ"],"plan":base(doneQ=("multi",["Battery storage","Solar panels","Smart controls or an energy management system","LED lighting"]))},
]
