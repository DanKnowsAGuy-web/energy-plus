# Demand Charge Rates by State

What commercial customers pay per kW of monthly peak at each state's largest utilities, as of November 2026. These numbers now drive the demand charge share in the walkthrough.

## How it's used

- **State rate** = each utility's $/kW, weighted 4 summer months and 8 other months, then averaged across the utilities listed.
- **Share of the bill** = state rate ÷ (facility load factor × 730 hours) ÷ the state's average ¢/kWh. Kept between 10% and 60%, and still scaled down for bills under $10K (28% max) and under $3K (15% max).
- Example, Florida: an office lands near 44%, a grocery store near 27% (grocery runs flatter, so the same peak is spread over more kWh). Maryland lands at 10% almost everywhere.

## By state

| State | Avg $/kW-mo | Range | Utilities | Flags |
|---|---|---|---|---|
| Alabama | $15.60 | single figure | Huntsville Utilities (TVA) 15.6 | hours-use pricing |
| Alaska | $31.66 | $27 to $37 | Chugach Electric 36.67; Golden Valley Electric 26.64 |  |
| Arizona | $8.46 | $6 to $11 | APS (tier blend) 11; SRP 6.64/5.47; TEP 9.88/7.83 |  |
| Arkansas | $18.32 | $17 to $20 | Entergy Arkansas 18.79/15.94; SWEPCO 22.55/18.36 |  |
| California | $49.75 | $20 to $86 | PG&E 20.5; SCE 62.99/32.93; SDG&E 96.82/80.27 | low confidence |
| Colorado | $21.91 | $20 to $23 | Xcel Energy CO 24.5/18.47; Black Hills CO 23.33 |  |
| Connecticut | $18.21 | $13 to $23 | Eversource CL&P 23.46; United Illuminating 12.96 | delivery only |
| Delaware | $12.85 | single figure | Delmarva Power (incl. transmission) 12.85 | delivery only, low confidence |
| District of Columbia | $10.75 | single figure | Pepco DC 10.75 | delivery only, low confidence |
| Florida | $18.81 | $15 to $23 | FPL 15.03; Tampa Electric 22.59 |  |
| Georgia | $11.40 | single figure | Georgia Power (minimum-bill demand) 11.4 | hours-use pricing |
| Hawaii | $15.68 | single figure | Hawaiian Electric Oahu 15.72; Hawaii Island 16; Maui County 15.31 |  |
| Idaho | $11.42 | $10 to $13 | Idaho Power 11.33/9.59; Rocky Mountain Power ID 14.36/11.81 |  |
| Illinois | $12.31 | $10 to $15 | ComEd 14.94; Ameren Illinois (primary) 9.69 | delivery only |
| Indiana | $19.19 | $10 to $28 | AES Indiana 28.5; NIPSCO 9.88 | low confidence |
| Iowa | $17.52 | $8 to $27 | MidAmerican 8/8.3; Alliant IPL (incl. transmission) 31.35/24.58 | low confidence |
| Kansas | $9.77 | $6 to $13 | Evergy Kansas Central 9.53/4.93; Evergy Kansas Metro 17.13/11.05 | low confidence |
| Kentucky | $19.29 | $14 to $25 | Kentucky Utilities 26.5/23.86; Kentucky Power 13.84 |  |
| Louisiana | $17.20 | single figure | Cleco 17.2 | hours-use pricing |
| Maine | $19.75 | single figure | Central Maine Power 19.98/19.64 | delivery only |
| Maryland | $4.92 | $4 to $6 | BGE 5.52; Pepco MD 4.33 | delivery only |
| Massachusetts | $23.20 | $15 to $31 | National Grid 15.06; Eversource (NSTAR) 31.34 | delivery only |
| Michigan | $21.02 | $20 to $22 | DTE Electric (D4) 21.8; Consumers Energy 27.6/16.55 |  |
| Minnesota | $12.30 | $11 to $13 | Xcel Energy 16.49/11.9; Minnesota Power 11.17 |  |
| Mississippi | $13.84 | single figure | None usable (national median used) | hours-use pricing |
| Missouri | $8.80 | $4 to $13 | Ameren Missouri 7.43/2.76; Evergy Missouri Metro 17.35/11.26 |  |
| Montana | $7.56 | single figure | NorthWestern Energy (distribution only) 7.56 | low confidence |
| Nebraska | $15.18 | $9 to $22 | OPPD 8.62; Lincoln Electric System 21.75 |  |
| Nevada | $11.04 | $10 to $12 | NV Energy South 10.08; NV Energy North 12 |  |
| New Hampshire | $21.81 | single figure | Eversource PSNH 21.81 | delivery only |
| New Jersey | $9.06 | single figure | PSE&G 17.2/5.71; JCP&L 9/8.38 | delivery only |
| New Mexico | $20.69 | single figure | PNM 25.47/19.02; SPS (Xcel) 22.73/18.94 |  |
| New York | $16.83 | $16 to $18 | National Grid (NiMo) 15.62; NYSEG 18.04 | delivery only |
| North Carolina | $5.87 | $5 to $7 | Duke Energy Carolinas 4.59; Duke Energy Progress 7.15 |  |
| North Dakota | $7.86 | $5 to $11 | Montana-Dakota Utilities 13.01/10.01; Otter Tail ND 4.36/4.87 |  |
| Ohio | $13.44 | $10 to $16 | Ohio Edison 14.61; Duke Energy Ohio 10.2; AEP Ohio (primary, approx.) 15.5 | delivery only |
| Oklahoma | $12.15 | single figure | PSO 12.15 | low confidence |
| Oregon | $21.89 | single figure | Portland General Electric 21.89 | low confidence |
| Pennsylvania | $9.05 | $5 to $14 | PECO 13.94; PPL 5.156; Duquesne Light 8.06 | delivery only |
| Rhode Island | $15.90 | single figure | Rhode Island Energy 15.9 | delivery only |
| South Carolina | $12.07 | $5 to $20 | Dominion Energy SC 19.52; Duke Energy Carolinas SC 4.62 |  |
| South Dakota | $8.32 | $6 to $11 | Xcel Energy SD 13.94/9.94; Black Hills Power 7.69; Otter Tail SD 6 |  |
| Tennessee | $17.96 | $15 to $20 | Nashville Electric Service 20.83/19.79; MLGW 16.19/15.07; EPB Chattanooga 18.3 |  |
| Texas | $12.32 | $11 to $14 | Oncor 13.62; CenterPoint 10.82; AEP Texas Central 12.53 | delivery only |
| Utah | $12.66 | single figure | Rocky Mountain Power UT 13.71/12.13 |  |
| Vermont | $21.43 | single figure | Green Mountain Power 21.434 |  |
| Virginia | $9.39 | $7 to $12 | Dominion Energy VA 12.785/11.57; Appalachian Power VA 6.81 |  |
| Washington | $10.31 | $6 to $15 | Puget Sound Energy 11.41/17.1; Seattle City Light 5.72; Avista 10 |  |
| West Virginia | $12.30 | single figure | Appalachian Power WV 12.3 | low confidence |
| Wisconsin | $18.87 | $16 to $21 | We Energies 21.39; Alliant WPL 16.35 |  |
| Wyoming | $21.59 | $19 to $24 | Rocky Mountain Power WY 19.19; Cheyenne Light (Black Hills) 24 |  |

Utility figures shown as summer/other where they differ.

## Caveats that matter

1. **Delivery only (deregulated states):** CT, DC, DE, IL, MA, MD, ME, NH, NJ, NY, OH, PA, RI, TX. The kW line on the bill is the wires charge. Capacity and transmission are bought with supply and usually billed per kWh, so the true cost of a peak is higher than shown. Maryland (about $5/kW) is the clearest understatement. This keeps the estimate conservative.
2. **Hours-use pricing:** Alabama Power, Mississippi Power, Entergy (MS, LA) and Georgia Power price demand through kWh blocks tied to kW, not a clear $/kW line. We left those utilities out where another utility was available, used Georgia Power's $11.40/kW minimum-bill demand as Georgia's figure, and used the national median ($13.84) for Mississippi.
3. **Missing big utilities:** Con Edison (NYC, known for very high summer demand charges), Duke Energy Florida, Duke Energy Indiana, AEP Ohio secondary, Ameren Illinois secondary, Pacific Power OR, and NPPD were not found. New York in particular likely understates for NYC sites.
4. **Stale or inferred figures:** some are 2024 tariffs (Wisconsin, Minnesota, NIPSCO) or from OpenEI where summer/winter labels were inferred (KS, IA, NM SPS, CA SCE/SDG&E). California's average ($50) is driven by SDG&E and SCE; the 60% share cap keeps it sane.
5. **Ratchets:** many utilities (Georgia Power 95%, Dominion SC 80%, PNM 50%, others) bill a share of the year's highest peak for 11 more months. Not modeled, so the estimate again leans low.
6. **Free first kW:** Duke (NC, SC) doesn't charge the first 30 kW; PSE (WA) and Avista skip the first 50 kW. Small sites in those territories pay less than the average suggests.

## Main sources

- Official tariffs: [FPL business rates, Oct 2026](https://www.fpl.com/content/dam/fplgp/us/en/rates/pdf/business-rates-oct2026.pdf), [Tampa Electric commercial rates, Jan 2026](https://www.tampaelectric.com/4ad05f/siteassets/files/rates/commratesinsert_jan2026.pdf), [Georgia Power PLM-19](https://www.georgiapower.com/content/dam/georgia-power/pdfs/business-pdfs/tariffs/2026/plm-19.pdf), [Dominion VA GS-2](https://www.dominionenergy.com/-/media/content/rates-and-tariffs/pdfs/virginia/large-business/schedule-gs2.pdf), [AES Indiana SL](https://www.aesindiana.com/sites/aesvault.com/files/2026-07/Rate-SL-Secondary-Service-Large-46258-Effectve-07-27-26.pdf), [ComEd line items](https://www.comed.com/cdn/assets/v3/assets/blt3ebb3fed6084be2a/blt2a55fd60b0fa4cf2/679124a91d0aeed2124fed68/ADA_Summary_of_Typical_Nonresidential_Line_Item_Changes.pdf), [Ameren Missouri 3(M)](https://www.ameren.com/-/media/rates/files/missouri/uecsheet56rate3mlgs.pdf), [NV Energy South](https://www.nvenergy.com/publish/content/dam/nvenergy/bill_inserts/2026/07_jul/np_com_rate-7_1_31.pdf), [NV Energy North](https://www.nvenergy.com/publish/content/dam/nvenergy/bill_inserts/2026/07_jul/spp_nv_commrates-7_1_31.pdf), [Hawaiian Electric Aug 2026](https://www.hawaiianelectric.com/documents/billing_and_payment/rates/effective_rate_summary/2026/efs_2026_08.pdf), [PSE Schedule 25](https://www.pse.com/-/media/Project/PSE/Portal/Rate-documents/Electric/elec_sch_025.pdf), [Avista WA 21](https://myavista.com/-/media/myavista/content-documents/our-rates-and-tariffs/wa/wa_021.pdf), [SRP E-32](https://www.srpnet.com/assets/srpnet/pdf/price-plans/FY26/TCA%20Ratebooks/2025%20Ratebook%20E-32%20with%20TCA.pdf), [SDG&E AL-TOU summary](https://www.sdge.com/sites/default/files/regulatory/Summary%20Table%20for%20Large%20Comm%201-1-26.pdf), [Rocky Mountain Power UT](https://pscdocs.utah.gov/electric/25docs/25035T05/339730Trf5-9-2025.pdf), [BGE Schedule GL](https://azure-na-assets.contentstack.com/v3/assets/blt71bfe6e8a1c2d265/bltf0186c98e3f0d27b/P3_SCH_GL.pdf), [LES business rates](https://www.les.com/rates/business-rates), [OPPD business rates](https://oppd.com/business/business-rates/)
- Everything else: the [OpenEI U.S. Utility Rate Database](https://openei.org/wiki/Utility_Rate_Database), checked against utility pages where possible.
