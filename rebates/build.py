import csv, json, re, sys, os, collections
csv.field_size_limit(10**8)
SRC=sys.argv[1]; OUT=sys.argv[2]; HTML=sys.argv[3] if len(sys.argv)>3 else os.path.join(OUT,'index.html')
def rd(name): return list(csv.DictReader(open(os.path.join(SRC,name),encoding='utf-8-sig')))
states=rd('rebate-states.csv'); programs=rd('rebate-programs.csv')
dr=rd('dr-by-state.csv'); arch=rd('archetype-d-screen.csv'); fed=rd('federal-mechanisms.csv')
drm={r['abbrev']:r for r in dr}; am={r['abbrev']:r for r in arch}
pm=collections.defaultdict(list)
for p in programs: pm[p['Abbrev']].append(p)
def split(s): return [x.strip() for x in re.split(r'\s*\|\s*',s) if x.strip()] if s else []
def ival(s):
    try: return int(float(s))
    except: return None
def dr_tier(d):
    """peak-demand revenue readiness, derived from the September 2026 DR layer"""
    if not d: return 'unscreened'
    pay=(d['utility_dr_payment']+' '+d['wholesale_payment_basis']).lower()
    conf=d['confidence']
    iso=d['iso_rto'].lower()
    has_iso = not (iso.startswith('none') or iso.startswith('mostly none'))
    concrete = bool(re.search(r'\$\s?\d', pay))
    if conf=='high' or (concrete and conf=='medium'): return 'strong'
    if has_iso or conf=='medium': return 'available'
    if d['utility_dr_programs'].lower().startswith('not published'): return 'none'
    return 'thin'
out=[]
for s in states:
    a=s['Abbrev']; d=drm.get(a,{}); x=am.get(a,{})
    out.append({
      'state':s['State'],'a':a,
      'cs':ival(s['Commercial Value Score']),'cr':ival(s['Commercial Rank']),
      'rs':ival(s['Residential Value Score']),'rr':ival(s['Residential Rank']),
      'cd':s['Commercial Difficulty'],'rd':s['Residential Difficulty'],
      'apply_c':s['How We Apply (Commercial)'],'apply_r':s['How We Apply (Residential)'],
      'op':s['Optimizer Path'],'cp':s['CryoGenX4 Path'],'hp':s['High-Eff RTU Path'],
      'trm':s['TRM'],'trm_rtu':s['RTU Controls Deemed in TRM'],
      'rebate_c':s['Typical Commercial Rebate'],'rebate_r':s['Typical Residential Rebate'],
      'pay':s['Time to Payment'],'res_instant':s['Residential Instant Rebate'],'res_reg':s['Res Contractor Registration'],
      'ira':s['IRA HOMES/HEAR Status'],
      'dims_c':[ival(s['C: '+k]) for k in ('Generosity','Ease','Deemed Availability','Speed','Stability')],
      'dims_r':[ival(s['R: '+k]) for k in ('Generosity','Ease','Deemed Availability','Speed','Stability')],
      'conf':s['Confidence'],'ver':s['Verification'],
      'flags':split(s['Flags']),'notes_c':s['Commercial Notes'],'notes_r':s['Residential Notes'],
      'src':split(s['Key Sources']),
      'dr':{ 'iso':d.get('iso_rto',''),'wholesale':d.get('wholesale_dr_programs',''),'wholesale_pay':d.get('wholesale_payment_basis',''),
             'wholesale_min':d.get('wholesale_min_kw',''),'utility':d.get('utility_dr_programs',''),'utility_pay':d.get('utility_dr_payment',''),
             'utility_min':d.get('utility_dr_min_kw',''),'agg':d.get('aggregators_active',''),'conf':d.get('confidence',''),
             'src':split(d.get('sources','')),'notes':d.get('notes',''),'tier':dr_tier(d) } if d else None,
      'd':{ 'exists':x.get('d_exists',''),'programs':x.get('program_names',''),'admin':x.get('administrator',''),
            'model':x.get('implementer_model',''),'mv':x.get('mv_basis',''),'min':x.get('min_savings_threshold',''),
            'recipient':x.get('incentive_recipient',''),'assign':x.get('assignment_permitted',''),'pay':x.get('payment_basis',''),
            'cost':x.get('cost_bearer_options',''),'enroll':x.get('enrollment_path',''),'fit':x.get('our_measures_fit',''),
            'status':x.get('status',''),'conf':x.get('confidence',''),'src':split(x.get('sources','')),'notes':x.get('notes','') } if x else None,
      'programs':[{'u':p['Utility / Administrator'],'t':p['Type'],'name':p['Commercial Program'],'how':p['Application Method'],
                   'ally':p['Trade Ally Required'],'pre':p['Pre-Approval Required'],'mv':p['M&V Requirements'],
                   'custom':p['Custom Incentive Rate'],'presc':p['Prescriptive HVAC Measures'],'pay':p['Payment Timeline'],
                   'budget':p['Budget Cycle'],'urls':split(p['URLs'])} for p in pm[a]],
    })
fedout=[{'m':f['mechanism'],'statute':f['statute_or_program'],'status':f['status_2026_09'],'dates':f['key_dates'],'value':f['value'],
         'measures':f['eligible_our_measures'],'sector':f['sector'],'stack':f['stackable_with_utility_rebate'],'action':f['action_for_ep'],
         'verified':f['verified_on'],'src':split(f['sources'])} for f in fed]
data={'states':out,'federal':fedout}
json.dump(data,open(os.path.join(OUT,'master-list.json'),'w'),ensure_ascii=False)
# flat per-state CSV for spreadsheets / Notion
cols=['State','Abbrev','Commercial Rank','Commercial Score','Residential Rank','Residential Score','Commercial Difficulty',
 'Optimizer Path','CryoGenX4 Path','High-Eff RTU Path','RTU Controls Deemed in TRM','Typical Commercial Rebate','Time to Payment','How We Apply (Commercial)',
 'Programs Mapped','Verification','Confidence',
 'ISO/RTO','Wholesale DR Programs','Wholesale DR Payment Basis','Utility DR Programs','Utility DR Payment','Utility DR Min kW','DR Aggregators Active','DR Confidence','Peak-Demand Readiness',
 'Aggregator/P4P (Archetype D) Exists','Archetype D Programs','Archetype D M&V Basis','Archetype D Confidence',
 'Typical Residential Rebate','IRA HOMES/HEAR Status','Flags','Key Sources (utility rebates)','DR Sources','Archetype D Sources']
w=csv.writer(open(os.path.join(OUT,'master-list.csv'),'w',newline='',encoding='utf-8'))
w.writerow(cols)
for s in sorted(out,key=lambda r:(r['cr'] or 99)):
    d=s['dr'] or {}; x=s['d'] or {}
    w.writerow([s['state'],s['a'],s['cr'],s['cs'],s['rr'],s['rs'],s['cd'],s['op'],s['cp'],s['hp'],s['trm_rtu'],s['rebate_c'],s['pay'],s['apply_c'],
      len(s['programs']),s['ver'],s['conf'],
      d.get('iso',''),d.get('wholesale',''),d.get('wholesale_pay',''),d.get('utility',''),d.get('utility_pay',''),d.get('utility_min',''),d.get('agg',''),d.get('conf',''),d.get('tier',''),
      x.get('exists',''),x.get('programs',''),x.get('mv',''),x.get('conf',''),
      s['rebate_r'],s['ira'],' | '.join(s['flags']),' | '.join(s['src']),' | '.join(d.get('src',[])),' | '.join(x.get('src',[]))])
tpl=open(os.path.join(os.path.dirname(__file__),'template.html'),encoding='utf-8').read()
js=json.dumps(data,ensure_ascii=False).replace('</','<\\/')
html=tpl.replace('__DATA__',js)
open(HTML,'w',encoding='utf-8').write(html)
print('states',len(out),'programs',sum(len(s['programs']) for s in out),'federal',len(fedout))
print(collections.Counter((s['dr'] or {}).get('tier') for s in out))
print('html bytes',len(html.encode()))
