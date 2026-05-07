import React from "react";
import { useReducer, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── CANVA COLOURS ────────────────────────────────────────────────────────────
const C = {
  teal:        "#00C4CC",
  tealLight:   "#E0FAFB",
  tealDark:    "#008B91",
  purple:      "#7D2AE8",
  purpleLight: "#F0E8FD",
  greenDark:   "#007a2f",
  greenLight:  "#E6FAF0",
  border:      "#E8E8E4",
  bg:          "#FAFAF8",
  bgSecondary: "#F4F4F0",
  text:        "#1A1A1A",
  textMuted:   "#6B6B68",
  textFaint:   "#A8A8A4",
  white:       "#FFFFFF",
  gray:        "#73726C",
};

// ─── REGION → COUNTRY (Controls tab) ─────────────────────────────────────────
const REGION_COUNTRIES = {
  NAMER:  ["US","Canada","Australia"],
  Europe: ["UK","Spain","France","Italy","Nordics-Sweden","Rest of Europe"],
  GPTN:   ["Germany","Poland","Netherlands","Turkiye","Czech Republic","Rest of GPTN"],
  MENAP:  ["GCC","Rest of MENAP"],
  CJKI:   ["China","Japan","South Korea","India","Rest of CJKI"],
  SEA:    ["Philippines","Indonesia","Vietnam","Thailand","Rest of SEA"],
  LATAM:  ["Brazil","Mexico","Argentina","Rest of LATAM"],
  SSA:    ["South Africa","Rest of SSA"],
};

function regionForCountry(countryName) {
  for (const [regionName, list] of Object.entries(REGION_COUNTRIES)) {
    if (list.includes(countryName)) return regionName;
  }
  return "—";
}

const REGION_ENTRIES = Object.entries(REGION_COUNTRIES);
const TOTAL_COUNTRY_BUTTONS = Object.values(REGION_COUNTRIES).reduce((n, list) => n + list.length, 0);

// ─── METRICS (Dash tab 1.11) ──────────────────────────────────────────────────
const METRICS = [
  { key: "signups",       label: "Signups",                  desc: "% uplift to signup volume" },
  { key: "newMAU",        label: "New MAU from signup rate", desc: "% uplift to signup → MAU conversion" },
  { key: "churn",         label: "Improvement in churn",     desc: "% reduction in churned users (Note: a positive input will decrease churned users)" },
  { key: "reactivating",  label: "Reactivating rate",        desc: "% uplift to reactivation of inactive users" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── BASE ACTUALS FROM MAUExtract (all countries, Jan–Dec 2026) ──────────────
// Keyed by country name matching Controls tab. "Turkiye" in Controls = "Turkey" in MAUExtract.
// Countries with no MAUExtract data fall back to null arrays (model will show zeros).
const ACTUALS_FLAG = [1,1,1,0,0,0,0,0,0,0,0,0]; // Jan-Mar = actuals, Apr-Dec = forecast

const COUNTRY_DATA = {"US":{"signups":[4090127,3649821,6669882,3791627,4469946,3295250,3940029,5956393,5779710,5310516,4845325,4328783],"priorMAU":[36058116,35898248,36237870,37813685,37887591,39722123,28415765,25941682,34533790,40298459,42075684,40315739],"newMAURate":[0.883287,0.92016,0.519814,0.841123,0.886978,0.810268,0.660347,0.650542,0.775706,0.822191,0.807266,0.821803],"churnRate":[0.416044,0.3818,0.360429,0.372762,0.366097,0.550059,0.488172,0.403241,0.3798,0.370831,0.406625,0.406104],"inactive":[51825368,52116775,52732392,53334796,53840001,54465215,55803457,57884964,59181317,60125573,61059433,61830811],"reactRate":[0.216722,0.205227,0.211822,0.205863,0.218042,0.144546,0.157617,0.262202,0.24325,0.205467,0.187314,0.205899]},"Canada":{"signups":[513188,477948,573492,488792,472153,433748,356793,369373,516266,523130,552522,472074],"priorMAU":[4359586,4496690,4419605,4667618,4686978,4675133,4439077,3169390,3212608,4413134,4774319,4999791],"newMAURate":[0.933182,0.949787,0.841109,0.900273,0.899139,0.879501,0.857836,0.845655,0.915245,0.919385,0.900355,0.917288],"churnRate":[0.410198,0.403899,0.371628,0.382109,0.383749,0.389365,0.560831,0.435154,0.379932,0.358128,0.352452,0.382838],"inactive":[3851755,3875758,3902600,3951346,3998968,4051235,4101958,4158969,4202725,4244897,4299953,4339000],"reactRate":[0.375951,0.330666,0.360809,0.344935,0.340712,0.296872,0.222761,0.266871,0.463624,0.344062,0.328047,0.287701]},"Australia":{"signups":[315326,444791,465793,337468,413932,364042,335646,388428,359893,362392,366370,344049],"priorMAU":[3247164,2725833,3693034,4148647,3793416,4258857,4177672,3829752,4336827,4373029,4258111,4324452],"newMAURate":[0.883308,0.96207,0.912581,0.904376,0.925246,0.90611,0.883708,0.911829,0.902724,0.887293,0.862369,0.819241],"churnRate":[0.528108,0.378463,0.321468,0.37908,0.321204,0.34171,0.386494,0.31627,0.325226,0.355642,0.33896,0.435967],"inactive":[1754838,1771709,1791027,1823296,1854240,1888420,1927453,1961701,1996711,2037554,2087978,2150168],"reactRate":[0.509384,0.880734,0.679907,0.500278,0.701524,0.552973,0.503305,0.69548,0.561928,0.549293,0.571972,0.410068]},"UK":{"signups":[704470,612642,748041,623410,654837,650207,616036,529560,759981,748474,750584,669207],"priorMAU":[4323036,4521961,4396099,4674020,4136952,4353251,4343161,4121721,3550806,4441859,4667372,4720813],"newMAURate":[0.898277,0.92517,0.812453,0.900022,0.912482,0.916676,0.907054,0.895577,0.922293,0.927919,0.909304,0.912467],"churnRate":[0.440293,0.433577,0.402148,0.491624,0.444722,0.463274,0.483096,0.542914,0.441543,0.434684,0.440784,0.452254],"inactive":[3092298,3138145,3184160,3246487,3303797,3357975,3415233,3470531,3529588,3583539,3651614,3710192],"reactRate":[0.472364,0.403196,0.451629,0.369476,0.441297,0.420094,0.385942,0.343629,0.498034,0.407814,0.391097,0.374239]},"Spain":{"signups":[542567,523797,620132,511617,554019,445043,327731,295799,628733,775982,708244,586761],"priorMAU":[7144035,6921347,7108813,7318514,6694872,7272946,6298031,3861372,3531552,6201656,7405347,7724905],"newMAURate":[0.893433,0.905131,0.756376,0.884634,0.90464,0.880508,0.878077,0.880571,0.911929,0.914309,0.888956,0.873666],"churnRate":[0.376668,0.333687,0.317363,0.370209,0.318073,0.411715,0.641078,0.522443,0.383451,0.323739,0.313191,0.339961],"inactive":[2557612,2607306,2646376,2705399,2758229,2811408,2851365,2886693,2942065,3008560,3087206,3161335],"reactRate":[0.771099,0.775118,0.754514,0.603639,0.799866,0.578934,0.460536,0.494363,1.172948,0.831548,0.650786,0.597417]},"France":{"signups":[767493,624944,772252,637101,643337,537635,430934,407079,742372,738369,715929,620406],"priorMAU":[8051843,8402655,8028055,8733350,7971814,8082878,7312344,6014402,5622794,8170971,8546986,8807556],"newMAURate":[0.902118,0.911122,0.832401,0.937311,0.951694,0.93307,0.932751,0.944846,0.959213,0.941816,0.923994,0.941153],"churnRate":[0.355487,0.368997,0.318705,0.390392,0.362847,0.413242,0.492118,0.469047,0.345166,0.35003,0.338278,0.348815],"inactive":[3712705,3768252,3827814,3867753,3898830,3934815,3963795,3986246,4016525,4059486,4113901,4150409],"reactRate":[0.684671,0.567484,0.68474,0.530193,0.613307,0.525573,0.479018,0.512989,0.940342,0.625833,0.605324,0.559389]},"Italy":{"signups":[575028,513018,633481,519594,638401,402887,288033,254165,431623,545775,593948,535405],"priorMAU":[4522461,4669546,4581153,5039307,5041080,5816648,4464642,3063999,2775701,3916113,4494230,4880467],"newMAURate":[0.935667,0.940413,0.828277,0.93344,0.948376,0.908431,0.906289,0.919245,0.920241,0.927349,0.915952,0.9278],"churnRate":[0.43141,0.426319,0.380358,0.396932,0.347953,0.493428,0.607596,0.535174,0.428021,0.427941,0.405332,0.410826],"inactive":[2221172,2251744,2284730,2319314,2352271,2389163,2416154,2436679,2471106,2510757,2560677,2599333],"reactRate":[0.70015,0.626315,0.733539,0.654054,0.817946,0.482263,0.435066,0.458788,0.781582,0.696133,0.649755,0.595912]},"Germany":{"signups":[691890,603478,694807,657219,676350,630373,591102,579673,653097,662475,719341,664516],"priorMAU":[4029425,3989189,3798975,3928690,3860182,4119248,3907069,3606589,3381001,3889834,4024281,4319074],"newMAURate":[0.866073,0.897855,0.785433,0.861259,0.888605,0.869434,0.861378,0.864962,0.883321,0.855827,0.810878,0.853862],"churnRate":[0.452569,0.4504,0.42424,0.444126,0.42521,0.455928,0.490526,0.510102,0.440476,0.43893,0.410814,0.408124],"inactive":[2737452,2799097,2855344,2946527,3021868,3104174,3186115,3264392,3340596,3436107,3572150,3669261],"reactRate":[0.432438,0.382806,0.418748,0.376714,0.429844,0.36015,0.347515,0.340929,0.425371,0.370895,0.381976,0.361715]},"Poland":{"signups":[259926,219906,312778,234507,235177,201790,156966,154426,231603,271218,281094,259717],"priorMAU":[2114701,2089158,1914819,2204313,2182527,2223018,2060376,1543073,1515317,1842007,2110478,2228842],"newMAURate":[0.966579,0.98819,0.86382,1.003842,0.986937,0.953234,0.916765,0.928484,0.894751,0.95157,0.94357,0.939238],"churnRate":[0.448677,0.473434,0.402053,0.420748,0.418261,0.443465,0.554031,0.460574,0.407718,0.392847,0.390552,0.382218],"inactive":[1080879,1083476,1077527,1076626,1079698,1089135,1102201,1113244,1137620,1150755,1166617,1182398],"reactRate":[0.625034,0.545675,0.732389,0.622526,0.667951,0.579218,0.435802,0.484675,0.648095,0.637813,0.58066,0.561495]},"Netherlands":{"signups":[279306,250677,311954,246795,255079,259893,220035,225701,379528,331814,333722,337383],"priorMAU":[2178524,2145000,2032021,2225206,2105433,2196609,2204930,1669057,1596659,2267996,2345853,2372466],"newMAURate":[0.870633,0.85605,0.774431,0.87802,0.863713,0.861039,0.847597,0.866394,0.868094,0.872582,0.841521,0.850191],"churnRate":[0.435386,0.432482,0.384674,0.427725,0.413741,0.420506,0.561515,0.53248,0.431819,0.422826,0.428772,0.429398],"inactive":[1484140,1520226,1547084,1577188,1611952,1648066,1681601,1711756,1761817,1804097,1856984,1907527],"reactRate":[0.454033,0.39745,0.473966,0.390126,0.460245,0.429748,0.306732,0.36269,0.585408,0.414175,0.404751,0.402441]},"Turkiye":{"signups":[587775,582811,738334,700200,703416,491950,467957,481049,610363,782301,787150,933625],"priorMAU":[3757191,3135366,3016558,3316175,3445208,3694009,2816915,2317944,2390059,2848955,3455479,3490037],"newMAURate":[0.907592,0.927484,0.760687,0.904374,0.92703,0.901016,0.897617,0.911701,0.926211,0.938787,0.926137,0.940837],"churnRate":[0.544329,0.538392,0.475703,0.499042,0.483131,0.596917,0.634132,0.57651,0.540508,0.491705,0.513056,0.461017],"inactive":[2314629,2356894,2394940,2461897,2513225,2561920,2609831,2652307,2697345,2745231,2803372,2858608],"reactRate":[0.384215,0.434506,0.489768,0.467342,0.501737,0.345391,0.332493,0.3659,0.439623,0.463752,0.384784,0.497068]},"GCC":{"signups":null,"priorMAU":null,"newMAURate":null,"churnRate":null,"inactive":null,"reactRate":null},"Rest of MENAP":{"signups":null,"priorMAU":null,"newMAURate":null,"churnRate":null,"inactive":null,"reactRate":null},"Japan":{"signups":[908231,787579,937999,1064198,1016645,1055443,1012741,923882,1094867,1090795,1046991,1057039],"priorMAU":[5547123,5596867,5382657,5389256,5350021,5690174,6069011,6065944,5132576,6421296,6631171,6387189],"newMAURate":[0.890973,0.909069,0.811545,0.874991,0.920847,0.932281,0.930106,0.917585,0.927043,0.905105,0.863487,0.896694],"churnRate":[0.396349,0.402556,0.40008,0.46239,0.41113,0.399369,0.421136,0.529139,0.434643,0.42048,0.443478,0.431045],"inactive":[2951297,3022913,3105080,3238114,3318584,3390058,3460843,3536986,3616863,3720374,3863302,3972500],"reactRate":[0.489039,0.437488,0.450509,0.470269,0.480665,0.489415,0.462958,0.400633,0.692138,0.518573,0.465476,0.528247]},"South Korea":{"signups":[305504,275923,451982,869409,805500,678488,593373,481699,590776,619232,608480,565941],"priorMAU":[2391708,1314572,1172298,2113332,2628899,2998619,3034822,2761697,2041146,3069700,3303636,3430707],"newMAURate":[0.912869,0.900382,1.684461,0.931107,0.939381,0.940658,0.918382,0.922337,0.943777,0.924934,0.936636,0.933951],"churnRate":[0.701663,0.589325,0.496922,0.44179,0.429131,0.438346,0.49661,0.623984,0.406985,0.385676,0.392446,0.437327],"inactive":[1252937,1280424,1344440,1404335,1453164,1493427,1541857,1579266,1612482,1658965,1697521,1734900],"reactRate":[0.258089,0.293499,0.566954,0.455776,0.507958,0.474026,0.441194,0.345759,0.801808,0.507993,0.52569,0.446574]},"India":{"signups":[4496529,4053862,3586799,3337144,3487728,3395415,3495448,3610330,3553232,3718100,3661621,4139319],"priorMAU":[17358984,18065519,17081443,17849410,16859476,16682453,16609271,17798959,19182247,19260504,19151597,18500814],"newMAURate":[0.906909,0.917583,1.099397,0.912349,0.910363,0.920233,0.931271,0.941306,0.934223,0.912772,0.918114,0.920279],"churnRate":[0.522387,0.546927,0.5226,0.513708,0.499191,0.494511,0.461993,0.447631,0.458308,0.458431,0.460533,0.436789],"inactive":[14823256,15157382,15490047,15782550,16095177,16366021,16606260,16818164,17051887,17376209,17676044,18006033],"reactRate":[0.384978,0.341501,0.371299,0.325346,0.31466,0.308701,0.337689,0.353953,0.325551,0.306594,0.271936,0.26946]},"Philippines":{"signups":[1467454,1429641,1566668,905106,953517,1514431,1902006,1839243,1788882,1582504,1461580,1112384],"priorMAU":[11271549,12588454,13249837,13453619,9622996,9133833,11732493,13543229,14328307,14685158,14524166,13481955],"newMAURate":[0.923927,0.936392,0.76577,0.922214,0.915315,0.922402,0.945412,0.953811,0.940751,0.919184,0.910759,0.910274],"churnRate":[0.370253,0.344195,0.337624,0.505159,0.412953,0.280416,0.29726,0.33149,0.335909,0.335967,0.382009,0.403714],"inactive":[5538566,5629517,5714250,5784655,5865404,5982920,6086746,6171699,6277690,6405581,6536013,6635823],"reactRate":[0.74685,0.650414,0.608573,0.368108,0.445014,0.628782,0.574976,0.570262,0.555071,0.517709,0.485364,0.462736]},"Indonesia":{"signups":[2724633,2374848,2446970,2219584,2468322,2167192,3139285,3285032,3157960,3030213,2634181,2048202],"priorMAU":[19515137,20855588,20438562,17843171,20363080,21474958,18355200,22220673,23691402,24797165,25068168,24334765],"newMAURate":[0.918003,0.925779,0.711635,0.877942,0.898861,0.875094,0.903334,0.905331,0.908348,0.889291,0.892276,0.861609],"churnRate":[0.437187,0.414787,0.465359,0.39475,0.391459,0.450793,0.382426,0.378473,0.360092,0.358339,0.368573,0.443825],"inactive":[10163319,10339590,10571329,10842247,11091891,11362588,11666049,11977039,12266472,12601943,12885708,13169160],"reactRate":[0.725168,0.584931,0.489489,0.702281,0.61897,0.410361,0.690696,0.574507,0.548219,0.508006,0.472528,0.378939]},"Vietnam":{"signups":[638845,423330,723320,656837,560334,487019,511188,643950,822184,988597,819784,731153],"priorMAU":[5104068,4830214,3812039,5159720,4999560,4316139,3413498,3470902,4019832,5293594,6304399,5926559],"newMAURate":[0.930791,0.93506,0.908905,0.904436,0.882997,0.873949,0.878704,0.873599,0.881327,0.885134,0.880299,0.892336],"churnRate":[0.463866,0.512844,0.381424,0.460953,0.521764,0.574826,0.516291,0.492188,0.458901,0.379044,0.433282,0.441741],"inactive":[2739902,2767396,2811414,2874184,2939745,3001134,3063139,3144535,3242105,3355661,3453791,3532509],"reactRate":[0.548704,0.389475,0.762698,0.564737,0.485982,0.383355,0.446624,0.538688,0.738183,0.638312,0.472478,0.509916]},"Thailand":{"signups":[561561,558759,427106,332027,709782,792767,705051,702718,665899,447464,661599,544234],"priorMAU":[6494165,6746965,6964451,5720251,4254832,6205116,7101295,7403984,7666539,7996120,6114844,7230104],"newMAURate":[0.908448,0.908515,0.892106,0.8959,0.945516,0.959764,0.94796,0.964357,0.950022,0.908348,0.927926,0.930581],"churnRate":[0.308412,0.288927,0.429942,0.501158,0.35056,0.314258,0.312687,0.305947,0.288761,0.457908,0.342709,0.339956],"inactive":[2543450,2594569,2635582,2670146,2708819,2740717,2777408,2802455,2835735,2876746,2924430,2962211],"reactRate":[0.687231,0.642727,0.519464,0.413377,1.022753,0.760826,0.667256,0.659624,0.67327,0.47708,0.887569,0.613606]},"Brazil":{"signups":[1704112,1702434,2369981,2170997,2232675,2067717,1786214,2093902,2151925,2104313,2036937,1847959],"priorMAU":[21779632,20275552,20202655,23792373,23245530,25273551,24362513,22446797,24329281,25188698,25465328,25116931],"newMAURate":[0.892391,0.906275,0.941495,0.904603,0.921727,0.90677,0.901314,0.913161,0.910569,0.904891,0.882465,0.860148],"churnRate":[0.429491,0.402531,0.339278,0.404282,0.338081,0.38021,0.415994,0.366619,0.358021,0.361074,0.367927,0.418762],"inactive":[12154286,12313853,12513994,12721101,12895861,13088633,13264908,13446740,13639190,13839329,14078740,14337181],"reactRate":[0.520913,0.531948,0.656283,0.55823,0.60652,0.520792,0.497713,0.60925,0.557402,0.539046,0.512602,0.464877]},"Mexico":{"signups":[1157335,1286799,1297285,1060490,1208833,1159725,952844,1181616,1699037,1491572,1233509,818013],"priorMAU":[12697311,12675988,14467987,15077676,13454490,14563893,13603300,10967473,12572553,15821439,16337697,15697773],"newMAURate":[0.911719,0.936174,0.891474,0.913849,0.931407,0.922062,0.902746,0.929431,0.944066,0.942819,0.92011,0.921119],"churnRate":[0.409389,0.326812,0.305532,0.371007,0.324009,0.388772,0.486245,0.392068,0.317477,0.309192,0.324331,0.401155],"inactive":[5925948,6008090,6095151,6186513,6269431,6359818,6452486,6535872,6630906,6716196,6814741,6879267],"reactRate":[0.695382,0.789045,0.635526,0.485162,0.692676,0.571093,0.483292,0.735448,0.850009,0.595846,0.517114,0.454857]}};

// Alias entries for Controls tab names that differ from MAUExtract keys
COUNTRY_DATA["Nordics-Sweden"] = COUNTRY_DATA["Europe"];
COUNTRY_DATA["Rest of Europe"] = COUNTRY_DATA["Europe"];
COUNTRY_DATA["Czech Republic"] = COUNTRY_DATA["Germany"];
COUNTRY_DATA["Rest of GPTN"]   = COUNTRY_DATA["Germany"];
COUNTRY_DATA["Rest of MENAP"]  = COUNTRY_DATA["MENAP"] || null;
COUNTRY_DATA["China"]          = COUNTRY_DATA["Japan"];
COUNTRY_DATA["Rest of CJKI"]   = COUNTRY_DATA["India"];
COUNTRY_DATA["Rest of SEA"]    = COUNTRY_DATA["SEA"] || COUNTRY_DATA["Indonesia"];
COUNTRY_DATA["Argentina"]      = COUNTRY_DATA["LATAM"] || COUNTRY_DATA["Brazil"];
COUNTRY_DATA["Rest of LATAM"]  = COUNTRY_DATA["LATAM"] || COUNTRY_DATA["Brazil"];
COUNTRY_DATA["South Africa"]   = COUNTRY_DATA["Sub-Saharan Africa"];
COUNTRY_DATA["Rest of SSA"]    = COUNTRY_DATA["Sub-Saharan Africa"];
COUNTRY_DATA["SEA"]            = COUNTRY_DATA["SEA"] || COUNTRY_DATA["Indonesia"];
COUNTRY_DATA["MENAP"]          = COUNTRY_DATA["MENAP"] || COUNTRY_DATA["GCC"];
COUNTRY_DATA["Sub-Saharan Africa"] = {"signups":[1109287,1043144,1106707,1105989,1145245,1108588,1183351,1245224,1203148,1240647,1198321,1172017],"priorMAU":[4609581,5068389,4943198,5036841,5037933,5289068,5104102,5291764,5512055,5555715,5615706,5419111],"newMAURate":[0.857789,0.864625,0.828612,0.891658,0.908784,0.890487,0.895849,0.911687,0.909232,0.889554,0.865012,0.860111],"churnRate":[0.465757,0.485278,0.470522,0.482555,0.473959,0.50054,0.488146,0.489459,0.492013,0.491518,0.50705,0.519687],"inactive":[3849120,3963584,4070423,4190248,4294713,4416118,4539366,4649335,4758542,4895567,5057326,5221277],"reactRate":[0.425325,0.355118,0.367053,0.344876,0.37202,0.334037,0.356679,0.360306,0.349209,0.344572,0.319186,0.307109]};
COUNTRY_DATA["South Africa"] = COUNTRY_DATA["Sub-Saharan Africa"];
COUNTRY_DATA["Rest of SSA"]  = COUNTRY_DATA["Sub-Saharan Africa"];

const NULL_BASE = { signups: Array(12).fill(0), priorMAU: Array(12).fill(0), newMAURate: Array(12).fill(0), churnRate: Array(12).fill(0), inactive: Array(12).fill(0), reactRate: Array(12).fill(0) };

function getBase(country) {
  return COUNTRY_DATA[country] || NULL_BASE;
}

// ─── MODEL COMPUTATION ────────────────────────────────────────────────────────
// Replicates the Calc tab logic:
//   Signups (row 38): base_signups * (1 + signupUplift)           [Calc K38]
//   NewMAU  (row 48): signups_uplift * newMAU_rate * (1 + newMAUUplift)  [Calc K48]
//   Churned (row 58): priorMAU * churnRate * (1 - churnImprove)   [Calc K58, negated in K89]
//   Reactivating (row 68): inactive * reactivateRate * (1 + reactUplift) [Calc K68]
//   MAU (row 92): prev_MAU + newMAU - churned + reactivating       [Calc K92]
//
// Incremental (rows 96,98,100,101,102,104):
//   incr_signups     = (uplift_signups - base_signups) * switch     [K96]
//   incr_openingMAU  = (uplift_openingMAU - base_openingMAU) * switch [L98+]
//   incr_newMAU      = (uplift_newMAU - base_newMAU) * switch       [K100]
//   incr_churned     = (uplift_churned - base_churned) * switch     [K101]
//   incr_reactivating= (uplift_react - base_react) * switch         [K102]
//   incr_MAU         = (uplift_MAU - base_MAU) * switch             [K104]

function computeModel(metrics, country) {
  const BASE = getBase(country);
  // metrics: array of { key, enabled, values[12] } — values are strings like "5" meaning 5%
  // Get uplift percentages per month, 0 if disabled or not in actuals period
  const getUplift = (key, i) => {
    if (ACTUALS_FLAG[i] === 1) return 0; // Jan-Mar are always actuals, no uplift
    const m = metrics.find(m => m.key === key);
    if (!m || !m.enabled) return 0;
    const v = parseFloat(m.values[i]);
    return isNaN(v) ? 0 : v / 100;
  };

  const uplift = {
    signups:      [],
    openingMAU:   [],
    newMAU:       [],
    churned:      [],
    reactivating: [],
    mau:          [],
  };
  const base = {
    signups:      [],
    openingMAU:   [],
    newMAU:       [],
    churned:      [],
    reactivating: [],
    mau:          [],
  };
  const incr = {
    signups:      [],
    openingMAU:   [],
    newMAU:       [],
    churned:      [],
    reactivating: [],
    mau:          [],
  };

  let prevUpliftMAU = null; // tracks rolling MAU for uplift case
  let prevBaseMAU   = null; // tracks rolling MAU for base case

  for (let i = 0; i < 12; i++) {
    const su = getUplift("signups", i);
    const nu = getUplift("newMAU", i);
    const cu = getUplift("churn", i);
    const ru = getUplift("reactivating", i);
    const isActuals = ACTUALS_FLAG[i] === 1;

    // ── BASE (no uplifts) ──
    const bSignups  = BASE.signups[i] || 0;
    const bNewMAU   = bSignups * (BASE.newMAURate[i] || 0);
    const bChurned  = (BASE.priorMAU[i] || 0) * (BASE.churnRate[i] || 0);
    const bReact    = (BASE.inactive[i] || 0) * (BASE.reactRate[i] || 0);
    const bOpenMAU  = prevBaseMAU !== null ? prevBaseMAU : null;
    const bMAU      = (bOpenMAU !== null ? bOpenMAU : (BASE.priorMAU[i] || 0)) + bNewMAU - bChurned + bReact;

    base.signups.push(bSignups);
    base.openingMAU.push(bOpenMAU);
    base.newMAU.push(bNewMAU);
    base.churned.push(bChurned);
    base.reactivating.push(bReact);
    base.mau.push(bMAU);
    prevBaseMAU = bMAU;

    // ── UPLIFT ──
    const uSignups  = bSignups * (1 + su);
    const uNewMAU   = uSignups * (BASE.newMAURate[i] || 0) * (1 + nu);
    const uChurned  = (BASE.priorMAU[i] || 0) * (BASE.churnRate[i] || 0) * (1 - cu);
    const uReact    = (BASE.inactive[i] || 0) * (BASE.reactRate[i] || 0) * (1 + ru);
    const uOpenMAU  = prevUpliftMAU !== null ? prevUpliftMAU : null;
    const uMAU      = (uOpenMAU !== null ? uOpenMAU : (BASE.priorMAU[i] || 0)) + uNewMAU - uChurned + uReact;

    uplift.signups.push(uSignups);
    uplift.openingMAU.push(uOpenMAU);
    uplift.newMAU.push(uNewMAU);
    uplift.churned.push(uChurned);
    uplift.reactivating.push(uReact);
    uplift.mau.push(uMAU);
    prevUpliftMAU = uMAU;

    // ── INCREMENTAL (uplift - base, gated by switch) ──
    // Switch = 0 for actuals months (no incremental), 1 for forecast months
    const sw = isActuals ? 0 : 1;
    incr.signups.push((uSignups - bSignups) * sw);
    incr.openingMAU.push(i === 0 ? null : ((uOpenMAU || 0) - (bOpenMAU || 0)) * sw);
    incr.newMAU.push((uNewMAU - bNewMAU) * sw);
    incr.churned.push((uChurned - bChurned) * sw); // both positive; incr will be negative (improvement)
    incr.reactivating.push((uReact - bReact) * sw);
    incr.mau.push((uMAU - bMAU) * sw);
  }

  return { uplift, base, incr };
}

// ─── FORMATTING ──────────────────────────────────────────────────────────────
const fmtM = (n) => {
  if (n === null || n === undefined) return "—";
  const m = n / 1e6;
  if (Math.abs(m) < 0.05) return "—";
  return (m < 0 ? "-" : "") + Math.abs(m).toFixed(1);
};
const fmtShort = (n) => {
  if (n === null || n === undefined || n === 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n < 0 ? "-" : "") + (abs / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n < 0 ? "-" : "") + (abs / 1e3).toFixed(0) + "K";
  return String(Math.round(n));
};

// ─── REDUCER ──────────────────────────────────────────────────────────────────
const mkCase = (num) => ({
  id: Date.now() + Math.random(),
  name: `Case ${num}`,
  metrics: METRICS.map(m => ({ key: m.key, enabled: true, values: Array(12).fill("") })),
});

const init = {
  tab: "configure",
  country: REGION_ENTRIES[0]?.[1]?.[0] || "US",
  riskAdj: 100,
  cases: [],
  activeCaseId: null,
};

function reducer(s, a) {
  switch (a.type) {
    case "SET_TAB":     return { ...s, tab: a.v };
    case "SET_COUNTRY": return { ...s, country: a.v };
    case "SET_RISK":    return { ...s, riskAdj: a.v };
    case "ADD_CASE": {
      const c = mkCase(s.cases.length + 1);
      return { ...s, cases: [...s.cases, c], activeCaseId: c.id };
    }
    case "REMOVE_CASE": {
      const rest = s.cases.filter(c => c.id !== a.id);
      return { ...s, cases: rest, activeCaseId: s.activeCaseId === a.id ? (rest[0]?.id || null) : s.activeCaseId };
    }
    case "SET_ACTIVE":    return { ...s, activeCaseId: a.id };
    case "RENAME_CASE":   return { ...s, cases: s.cases.map(c => c.id === a.id ? { ...c, name: a.v } : c) };
    case "TOGGLE_METRIC":
      return { ...s, cases: s.cases.map(c => c.id !== a.caseId ? c : { ...c, metrics: c.metrics.map(m => m.key === a.key ? { ...m, enabled: !m.enabled } : m) }) };
    case "SET_VAL":
      return { ...s, cases: s.cases.map(c => c.id !== a.caseId ? c : { ...c, metrics: c.metrics.map(m => { if (m.key !== a.key) return m; const v = [...m.values]; v[a.idx] = a.v; return { ...m, values: v }; }) }) };
    default: return s;
  }
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const SL = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{children}</div>;
const Card = ({ children, style = {} }) => <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px", ...style }}>{children}</div>;
const Toggle = ({ on, onChange }) => (
  <button onClick={onChange} style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", background: on ? C.teal : C.border, position: "relative", padding: 0, transition: "background 0.18s", flexShrink: 0 }}>
    <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: C.white, transition: "left 0.18s", display: "block" }} />
  </button>
);

// ─── RESULTS TABLE ─────────────────────────────────────────────────────────────
const TABLE_ROWS = [
  { key: "signups",      label: "Signups",      negDisplay: false, greyFirst: false },
  { key: "openingMAU",   label: "Opening MAU",  negDisplay: false, greyFirst: true  },
  { key: "newMAU",       label: "New MAU",       negDisplay: false, greyFirst: false },
  { key: "churned",      label: "Churned",       negDisplay: true,  greyFirst: false },
  { key: "reactivating", label: "Reactivating",  negDisplay: false, greyFirst: false },
  { key: "mau",          label: "MAU",           negDisplay: false, greyFirst: false, bold: true },
];

function DashTable({ title, subtitle, data, accent, accentLight }) {
  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        {subtitle && <span style={{ fontSize: 12, color: C.textFaint, marginLeft: 8 }}>{subtitle}</span>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 820, tableLayout: "fixed" }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
              <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: C.textMuted, width: 126 }}>Metric</th>

              {MONTHS.map((m, i) => <th key={i} style={{ padding: "7px 4px", textAlign: "right", fontWeight: 600, color: C.textMuted }}>{m} '26</th>)}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map(({ key, label, negDisplay, greyFirst, bold }) => (
              <tr key={key} style={{ borderBottom: `0.5px solid ${C.border}`, background: bold ? accentLight : "transparent" }}>
                <td style={{ padding: "6px 12px", fontWeight: bold ? 700 : 400, color: bold ? accent : C.text }}>{label}</td>

                {(data[key] || []).map((v, i) => {
                  const isGrey = greyFirst && i === 0;
                  // Churned: stored positive in uplift, negative in base — display as positive with red
                  const displayVal = negDisplay ? (v === null ? null : Math.abs(v)) : v;
                  return (
                    <td key={i} style={{
                      padding: "6px 4px", textAlign: "right", fontVariantNumeric: "tabular-nums",
                      background: isGrey ? C.bgSecondary : "transparent",
                      color: isGrey ? "transparent" : negDisplay ? "#dc2626" : bold ? accent : C.text,
                      fontWeight: bold ? 700 : 400,
                    }}>
                      {isGrey ? "" : fmtM(displayVal)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [s, dispatch] = useReducer(reducer, init);
  const { tab, country, riskAdj, cases, activeCaseId } = s;
  const activeCase = cases.find(c => c.id === activeCaseId);
  const selectedRegion = regionForCountry(country);

  // ── Compute model whenever active case metrics change ──
  const model = useMemo(() => {
    if (!activeCase) return null;
    return computeModel(activeCase.metrics, country);
  }, [activeCase, country]);

  // Chart data
  const chartData = useMemo(() => {
    return MONTHS.map((m, i) => ({
      month: m,
      "Uplift case": model ? Math.round(model.uplift.mau[i] / 1e5) / 10 : null,
      "Base case":   model ? Math.round(model.base.mau[i] / 1e5) / 10 : null,
    }));
  }, [model]);

  const totalIncrMAU = model ? model.incr.mau.reduce((s, v) => s + (v || 0), 0) : 0;
  const peakMAU      = model ? Math.max(...model.uplift.mau) : 0;
  const endMAU       = model ? model.uplift.mau[11] : 0;

  const tabStyle = (key) => ({
    padding: "10px 20px", background: "none", border: "none",
    borderBottom: tab === key ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
    cursor: "pointer", fontSize: 14, fontWeight: tab === key ? 700 : 400,
    color: tab === key ? C.text : C.textMuted, fontFamily: "inherit", transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", color: C.text }}>

      {/* TOP BAR */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ padding: "18px 0 0" }}>
            <h1 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>International initiative sizing</h1>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
              12 months · {REGION_ENTRIES.length} regions · {TOTAL_COUNTRY_BUTTONS} countries
            </div>
          </div>
          <div style={{ display: "flex", marginBottom: -1 }}>
            <button style={tabStyle("configure")} onClick={() => dispatch({ type: "SET_TAB", v: "configure" })}>Initiative sizing</button>
            <button style={tabStyle("results")}   onClick={() => dispatch({ type: "SET_TAB", v: "results"   })}>Results</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 32px 48px" }}>

        {/* ══════════════════ CONFIGURE ══════════════════ */}
        {tab === "configure" && (
          <div style={{ paddingTop: 24 }}>
            <Card style={{ marginBottom: 14 }}>
              {/* Regions (text) + country buttons; one country selected globally */}
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
                <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
                  {REGION_ENTRIES.map(([regionName, countryList]) => (
                    <div key={regionName} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 14px" }}>
                      <span style={{
                        minWidth: 112, fontSize: 13, fontWeight: 600, color: C.text,
                        letterSpacing: "0.01em",
                      }}>{regionName}</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
                        {countryList.map(c => (
                          <button key={`${regionName}-${c}`} type="button" onClick={() => dispatch({ type: "SET_COUNTRY", v: c })} style={{
                            padding: "5px 13px", borderRadius: 20,
                            border: `1.5px solid ${country === c ? C.tealDark : C.border}`,
                            background: country === c ? C.tealLight : C.white,
                            color: country === c ? C.tealDark : C.textMuted,
                            fontSize: 13, fontWeight: country === c ? 600 : 400,
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                          }}>{c}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <SL>Risk adj.</SL>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="number" min={0} max={100} value={riskAdj}
                      onChange={e => dispatch({ type: "SET_RISK", v: Math.max(0, Math.min(100, Number(e.target.value))) })}
                      style={{ width: 60, padding: "8px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "right", fontFamily: "inherit", color: C.text, outline: "none" }} />
                    <span style={{ fontSize: 13, color: C.textMuted }}>%</span>
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div style={{ borderTop: `0.5px solid ${C.border}`, marginBottom: 16 }} />
              {/* Row 2: Case selector */}
              <div>
                <SL>Case</SL>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {cases.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "stretch" }}>
                      <button onClick={() => dispatch({ type: "SET_ACTIVE", id: c.id })} style={{
                        padding: "5px 13px", borderRadius: cases.length > 1 ? "20px 0 0 20px" : "20px",
                        border: `1.5px solid ${c.id === activeCaseId ? C.tealDark : C.border}`,
                        borderRight: cases.length > 1 ? "none" : undefined,
                        background: c.id === activeCaseId ? C.tealLight : C.white,
                        color: c.id === activeCaseId ? C.tealDark : C.textMuted,
                        fontSize: 13, fontWeight: c.id === activeCaseId ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                      }}>{c.name}</button>
                      {cases.length > 1 && (
                        <button onClick={() => dispatch({ type: "REMOVE_CASE", id: c.id })} style={{
                          padding: "5px 8px", borderRadius: "0 20px 20px 0",
                          border: `1.5px solid ${c.id === activeCaseId ? C.tealDark : C.border}`,
                          background: c.id === activeCaseId ? C.tealLight : C.white,
                          color: c.id === activeCaseId ? C.tealDark : C.textFaint,
                          cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "inherit",
                        }}>×</button>
                      )}
                    </div>
                  ))}
                  {cases.length < 4 && (
                    <button onClick={() => dispatch({ type: "ADD_CASE" })} style={{
                      padding: "5px 13px", borderRadius: 20, border: `1.5px dashed #C8C8C4`,
                      background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.tealDark; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#C8C8C4"; e.currentTarget.style.color = C.textMuted; }}
                    >+ Add case</button>
                  )}
                </div>
              </div>
            </Card>

            <Card style={{ marginBottom: 14 }}>
              {/* Case name rename row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                {activeCase && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.textMuted }}>Case name:</span>
                    <input type="text" value={activeCase.name}
                      onChange={e => dispatch({ type: "RENAME_CASE", id: activeCase.id, v: e.target.value })}
                      style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, width: 120, fontFamily: "inherit", color: C.text, outline: "none" }}
                      onFocus={e => e.target.style.borderColor = C.teal}
                      onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                )}
              </div>

              {!activeCase ? (
                <div style={{ padding: 28, textAlign: "center", color: C.textMuted, fontSize: 13, background: C.bgSecondary, borderRadius: 10, border: `1.5px dashed ${C.border}` }}>
                  No cases yet — click <strong>+ Add case</strong> to get started.
                </div>
              ) : (
                <div>
                  <SL>Metric uplifts <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(monthly %)</span></SL>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                    Enter the % uplift per month. Jan–Mar 2026 are actuals — uplifts apply from Apr 2026 onwards.
                  </div>
                  <div style={{ background: C.bgSecondary, borderRadius: 10, padding: "0 16px" }}>
                    {activeCase.metrics.map((metric, mi) => {
                      const def = METRICS[mi];
                      return (
                        <div key={metric.key} style={{ padding: "14px 0", borderBottom: mi < activeCase.metrics.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <Toggle on={metric.enabled} onChange={() => dispatch({ type: "TOGGLE_METRIC", caseId: activeCase.id, key: metric.key })} />
                            <span style={{ fontSize: 13, fontWeight: metric.enabled ? 600 : 400, color: metric.enabled ? C.text : C.textFaint }}>{def.label}</span>
                            <span style={{ fontSize: 11, color: C.textFaint, flex: 1 }}>{def.desc}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
                            {MONTHS.map((mo, i) => {
                              const isActuals = ACTUALS_FLAG[i] === 1;
                              const raw = metric.values[i];
                              const num = parseFloat(raw);
                              // Display: blank/dash for empty or zero, "X.X%" for positive, "-X.X%" for negative
                              const displayVal = (raw === "" || raw === null || raw === undefined || isNaN(num) || num === 0)
                                ? "-"
                                : (num < 0 ? "-" : "") + Math.abs(num).toFixed(1) + "%";
                              return (
                                <div key={i}>
                                  <div style={{ fontSize: 10, color: isActuals ? C.tealDark : C.textFaint, textAlign: "center", marginBottom: 2, fontWeight: isActuals ? 600 : 400 }}>{mo}</div>
                                  <input
                                    type="text"
                                    disabled={!metric.enabled || isActuals}
                                    value={displayVal}
                                    onChange={e => {
                                      // Strip % and spaces so user can type naturally
                                      const cleaned = e.target.value.replace(/%/g, "").trim();
                                      dispatch({ type: "SET_VAL", caseId: activeCase.id, key: metric.key, idx: i, v: cleaned });
                                    }}
                                    onFocus={e => {
                                      if (!metric.enabled || isActuals) return;
                                      // Show raw number on focus for easy editing
                                      const raw2 = metric.values[i];
                                      const n2 = parseFloat(raw2);
                                      e.target.value = (raw2 === "" || isNaN(n2) || n2 === 0) ? "" : String(n2);
                                      e.target.style.borderColor = C.teal;
                                    }}
                                    onBlur={e => {
                                      e.target.style.borderColor = isActuals ? C.tealLight : metric.enabled ? C.border : C.bgSecondary;
                                    }}
                                    style={{
                                      width: "100%", padding: "5px 2px", textAlign: "center",
                                      border: `1px solid ${isActuals ? C.tealLight : metric.enabled ? C.border : C.bgSecondary}`,
                                      borderRadius: 6, fontSize: 12,
                                      background: isActuals ? C.tealLight : metric.enabled ? C.white : C.bgSecondary,
                                      color: isActuals ? C.tealDark : metric.enabled ? (num < 0 ? "#dc2626" : C.text) : C.textFaint,
                                      fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => dispatch({ type: "SET_TAB", v: "results" })} disabled={!activeCase} style={{
                padding: "11px 26px", background: activeCase ? C.text : C.border, color: activeCase ? C.white : C.textFaint,
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: activeCase ? "pointer" : "not-allowed", fontFamily: "inherit",
              }}
                onMouseEnter={e => { if (activeCase) e.currentTarget.style.opacity = "0.82"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >Calculate impact →</button>
              {activeCase && <span style={{ fontSize: 12, color: C.textMuted }}>{country} · {selectedRegion} · {activeCase.name} · Risk adj. {riskAdj}%</span>}
            </div>
          </div>
        )}

        {/* ══════════════════ RESULTS ══════════════════ */}
        {tab === "results" && (
          <div style={{ paddingTop: 24 }}>
            {/* Context chips */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              {[["Country", country], ["Region", selectedRegion], ["Case", activeCase?.name || "—"], ["Risk adj.", riskAdj + "%"]].map(([l, v]) => (
                <div key={l} style={{ background: C.bgSecondary, borderRadius: 8, padding: "6px 12px", fontSize: 13, border: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted }}>{l}: </span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <button onClick={() => dispatch({ type: "SET_TAB", v: "configure" })} style={{
                padding: "6px 14px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, cursor: "pointer", color: C.textMuted, fontFamily: "inherit",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.text; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
              >← Edit</button>
            </div>

            {!model ? (
              <Card><div style={{ padding: 24, textAlign: "center", color: C.textMuted }}>No case configured — go back and add a case.</div></Card>
            ) : (
              <>
                {/* KPI cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "End-of-year MAU",      value: fmtShort(endMAU),      sub: "Dec 2026 · uplift case",  color: C.tealDark,  bg: C.tealLight  },
                    { label: "Cumulative incr. MAU", value: fmtShort(totalIncrMAU),sub: "Total from uplifts",       color: C.purple,    bg: C.purpleLight },
                    { label: "Peak MAU",             value: fmtShort(peakMAU),     sub: "Highest monthly MAU",      color: C.greenDark, bg: C.greenLight  },
                  ].map(({ label, value, sub, color, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.03em", marginBottom: 2 }}>{value}</div>
                      <div style={{ fontSize: 12, color, opacity: 0.7 }}>{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Line chart */}
                <Card style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>MAU over time</span>
                    <span style={{ fontSize: 12, color: C.textFaint, marginLeft: 8 }}>Base case vs uplift case · Jan–Dec 2026</span>
                  </div>
                  <div style={{ display: "flex", gap: 20, margin: "10px 0 16px", fontSize: 12, color: C.textMuted }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 20, height: 3, background: C.teal, display: "inline-block", borderRadius: 2 }} />
                      Uplift case
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 20, borderTop: `2px dashed ${C.gray}`, display: "inline-block" }} />
                      Base case
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.textFaint }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: C.textFaint }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
                      <Tooltip
                        formatter={(v, name) => [`${v}M`, name]}
                        contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: "inherit" }}
                      />
                      <Line type="monotone" dataKey="Uplift case" stroke={C.teal} strokeWidth={2.5} dot={{ r: 3, fill: C.teal, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="Base case"   stroke={C.gray} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2, fill: C.gray, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Output tables — no 1.21 / 1.22 labels */}
                <DashTable
                  title="Uplift case"
                  subtitle="Absolute MAU and components with uplifts applied (M)"
                  data={model.uplift}
                  accent={C.tealDark}
                  accentLight={C.tealLight}
                />
                <DashTable
                  title="Incremental uplifts"
                  subtitle="Delta vs base case — uplift contribution only (M)"
                  data={model.incr}
                  accent={C.purple}
                  accentLight={C.purpleLight}
                />

                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                  Jan–Mar 2026 = actuals (highlighted in teal above). Uplifts applied from Apr 2026. Data: {country} / {selectedRegion}.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
