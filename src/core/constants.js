// Datos fijos del juego: rarezas, días, niveles, clientes, decoración, personal, épocas de sobres…
// Solo datos: nada de DOM, canvas ni estado de la partida.
export const RAR={C:{n:"Común",c:"#8a94a3",def:.05},U:{n:"Poco común",c:"#4a86c9",def:.1},R:{n:"Rara",c:"#b48a1e",def:.4},DR:{n:"Doble rara",c:"#d9782a",def:2.5},IR:{n:"Ilustración rara",c:"#2fa557",def:8},UR:{n:"Ultra rara",c:"#8e4cb5",def:8},SIR:{n:"Ilustración especial",c:"#d9402a",def:40},HR:{n:"Hyper rara",c:"#c9950f",def:12}};
export const RMAP={"Common":"C","Uncommon":"U","Rare":"R","Rare Holo":"DR","Rare Holo EX":"DR","Rare Holo GX":"DR","Rare Holo V":"DR","Rare Holo VMAX":"DR","Rare Holo VSTAR":"DR","Rare Holo LV.X":"DR","Rare Holo Star":"DR","Rare Prime":"DR","LEGEND":"DR","Rare BREAK":"DR","Double Rare":"DR","ACE SPEC Rare":"DR","Rare ACE":"DR","Radiant Rare":"IR","Amazing Rare":"IR","Illustration Rare":"IR","Trainer Gallery Rare Holo":"IR","Classic Collection":"IR","Ultra Rare":"UR","Rare Ultra":"UR","Shiny Rare":"UR","Shiny Ultra Rare":"UR","Rare Shiny":"UR","Rare Shiny GX":"UR","Special Illustration Rare":"SIR","Hyper Rare":"HR","Rare Secret":"HR","Rare Rainbow":"HR","Mega Hyper Rare":"HR"};
export const COND={NM:1,LP:.85,MP:.7};
export const DEFAULT_SETS=["mew","pre","obf"];
export const LEGACY={sv3pt5:"mew",sv8pt5:"pre",sv3:"obf"};
export const DAYLEN=100;
export const RENT=15;
export const LV=[0,1600,3200,6500,14000,30000,70000,180000,700000];
export const VOL={C:.3,U:.3,R:.5,DR:.8,IR:1,UR:1,SIR:1.2,HR:1.3};
export const CT={
  kid:{w:.30,col:"#4a90d9",hair:"#4b2e1a",sc:.85,mult:.95},
  collector:{w:.28,col:"#4fa36a",hair:"#222",sc:1,mult:1.02},
  investor:{w:.12,col:"#3d4257",hair:"#111",sc:1,mult:.96},
  whale:{w:.05,col:"#d0a52a",hair:"#8a6a1a",sc:1.05,mult:1.12},
  seller:{w:.25,col:"#a25fb5",hair:"#5a3a2a",sc:1,mult:1},
  lot:{w:0,col:"#8a5a2b",hair:"#cfcfcf",sc:1,mult:1}
};
export const TIERS=[{n:"Poké Cards",sub:"Tienda de barrio"},{n:"Poké Cards",sub:"Tienda de cartas"},{n:"Poké Cards Center",sub:"Tienda especializada"},{n:"Poké Cards MEGASTORE",sub:"Megastore"}];
export const SEAS={auto:"Automática",spring:"🌸 Primavera",summer:"☀️ Verano",autumn:"🍂 Otoño",hallo:"🎃 Halloween",winter:"❄️ Invierno",xmas:"🎄 Navidad"};
export const UPS=[
  {k:"ads",n:"Publicidad local",d:"Entran más clientes cada día.",cost:[250,600,1400],max:3},
  {k:"case",n:"Vitrina grande",d:"Sube la capacidad de la vitrina de 8 a 16 cartas.",cost:[500],max:1},
  {k:"shelf",n:"Segunda fila de estanterías",d:"Pasas de 3 a 6 sets de sobres en las estanterías a la vez.",cost:[350],max:1}
];
export const DECOR=[
  {k:"plants",ic:"🪴",n:"Más plantas",d:"Tienda más acogedora: +5 % clientes.",cost:120,sp:.05},
  {k:"poster",ic:"🖼️",n:"Pósters de coleccionista",d:"Los clientes aceptan precios un 4 % más altos.",cost:250,tol:.04},
  {k:"rug",ic:"⭕",n:"Alfombra Pokéball",d:"+10 % clientes.",cost:300,sp:.1},
  {k:"coffee",ic:"☕",n:"Máquina de café",d:"+25 % de paciencia en la cola.",cost:350,pat:.25},
  {k:"sofa",ic:"🛋️",n:"Sofá de espera",d:"+20 % de paciencia en la cola.",cost:450,pat:.2},
  {k:"lights",ic:"💡",n:"Focos para la vitrina",d:"Las cartas de la vitrina se aceptan un 6 % más caras.",cost:500,tol:.06},
  {k:"neon",ic:"✨",n:"Letrero de neón",d:"+15 % clientes.",cost:600,sp:.15},
  {k:"table",ic:"🎲",n:"Mesa de juego",d:"Permite organizar torneos en la tienda.",cost:800},
  {k:"lux",ic:"💎",n:"Peanas de lujo",d:"3 peanas con foco para tus mejores cartas: se aceptan un 12 % más caras.",cost:1500}
];
export const STAFF=[
  {k:"cashier",ic:"🧑‍💼",n:"Cajero/a",d:"Cobra por ti a los clientes que compran (sin minijuego de caja).",sal:20},
  {k:"appraiser",ic:"🧐",n:"Tasador/a",d:"Revisa gratis 10 cartas de cada lote y afina a la mitad la estimación.",sal:25},
  {k:"cm",ic:"📣",n:"Community manager",d:"+1 de reputación al día y +10 % clientes.",sal:30}
];
export const ERA={
  wotc:{C:7,U:3,rv:false,slot:[["DR",.33],["R",.67]],d:"Época clásica (1999–2002): 11 cartas y 1 holo de cada 3 sobres."},
  mid:{C:5,U:3,rv:true,slot:[["HR",.025],["IR",.02],["UR",.1],["DR",.3],["R",.555]],d:"2003–2022: reverse en cada sobre, holo 1 de cada 3 y ultra rara ~1 de cada 10."},
  sv:{C:5,U:3,rv:true,slot:[["HR",.007],["UR",.02],["SIR",.018],["IR",.06],["DR",.18],["R",.715]],d:"Escarlata y Púrpura: ilustraciones especiales, hyper raras y doble raras."}
};
export const RORD=["HR","SIR","UR","IR","DR","R","U","C"];
export const GMULT={10:4,9:1.7,8:1.2,7:.95,6:.8,5:.7,4:.6,3:.55,2:.5,1:.45};
export const GTXT={10:"GEM MINT",9:"MINT",8:"NM-MT",7:"NEAR MINT",6:"EX-MT",5:"EXCELLENT",4:"VG-EX",3:"VERY GOOD",2:"GOOD",1:"POOR"};
export const GSVC={std:{n:"Estándar",cost:12,days:4},exp:{n:"Exprés",cost:35,days:1}};
export const NAMES=["Lucía","Dani","Marcos","Aitana","Pablo","Sara","Iker","Noa","Hugo","Carla","Jorge","Irene"];
export const MT=[
  {k:"open",n:"Abre {g} sobres",g:[2,4,6],r:[20,35,60]},
  {k:"sellpack",n:"Vende {g} sobres en la tienda",g:[4,7,12],r:[20,40,70]},
  {k:"serve",n:"Atiende a {g} clientes",g:[5,9,14],r:[25,45,70]},
  {k:"earn",n:"Ingresa {g} € en caja",g:[40,90,180],r:[20,45,80]},
  {k:"buycard",n:"Compra {g} carta(s) a clientes",g:[1,2,3],r:[15,30,50]},
  {k:"exact",n:"Da el cambio exacto {g} veces",g:[2,3,5],r:[20,30,50]},
  {k:"cardpay",n:"Cobra {g} veces con tarjeta",g:[2,3,4],r:[15,25,40]},
  {k:"bigsale",n:"Vende en vitrina una carta de {g} € o más",g:[5,15,30],r:[25,50,90]},
  {k:"sellprod",n:"Vende {g} productos sellados o accesorios",g:[2,4,7],r:[25,45,80]}
];
export const ACH=[
  {id:"pack1",n:"Primer sobre",d:"Abre tu primer sobre.",st:"packs",g:1,r:20},
  {id:"pack100",n:"Adicto a los sobres",d:"Abre 100 sobres.",st:"packs",g:100,r:300},
  {id:"serve50",n:"Atención al cliente",d:"Atiende a 50 clientes.",st:"served",g:50,r:150},
  {id:"serve500",n:"Tienda de barrio",d:"Atiende a 500 clientes.",st:"served",g:500,r:1000},
  {id:"exact20",n:"Cajero de oro",d:"Da el cambio exacto 20 veces.",st:"exact",g:20,r:80},
  {id:"hit",n:"¡Brilla!",d:"Consigue una Ilustración especial o una Hyper rara en un sobre.",st:"bighit",g:1,r:50},
  {id:"gem",n:"Gem Mint",d:"Consigue un 10 en el gradeo.",st:"gem",g:1,r:100},
  {id:"lot",n:"Cazador de lotes",d:"Compra un lote misterioso.",st:"lots",g:1,r:40},
  {id:"order5",n:"Por encargo",d:"Completa 5 encargos.",st:"orders",g:5,r:120},
  {id:"tour",n:"Organizador",d:"Organiza un torneo.",st:"tours",g:1,r:60},
  {id:"alb50",n:"Media colección",d:"Llega al 50 % de un set en el álbum.",st:"alb50",g:1,r:150},
  {id:"alb100",n:"Maestro del set",d:"Completa un set entero en el álbum.",st:"alb100",g:1,r:1000},
  {id:"nw10k",n:"Empresario",d:"Valor de la empresa: 10.000 €.",st:"nw",g:10000,r:200},
  {id:"nw100k",n:"Magnate",d:"Valor de la empresa: 100.000 €.",st:"nw",g:100000,r:2000}
];
// Contadores de por vida (S.lt): incluye las claves que la v15 añadía con Object.assign
export const LTK={open:"packs",serve:"served",exact:"exact",order:"orders",lot:"lots",tour:"tours",gem:"gem",bighit:"bighit",sellpack:"psold",earn:"earned",trade:"trades",mgwin:"mgwins",goodbuy:"goodbuys",boxopen:"boxes",caught:"caught",gem9:"gem9"};
export const ALBR=[[.25,40,1],[.5,120,2],[.75,300,3],[1,1000,5]];
export const PTYPES={box:{n:"Caja de 36 sobres",ic:"🗃️",packs:36,f:.85},etb:{n:"Elite Trainer Box",ic:"🎁",packs:9,f:1.35},tin:{n:"Lata",ic:"🥫",packs:4,f:1.2},col:{n:"Colección premium",ic:"💎",packs:6,f:1.45}};
export const ACC=[
  {id:"sleeves",n:"Fundas (65 u.)",ic:"🛡️",w:2.2,r:4.95,col:"#3f7fc4"},
  {id:"toploader",n:"Toploaders (25 u.)",ic:"🧊",w:1.6,r:3.95,col:"#9ad7e8"},
  {id:"deckbox",n:"Caja de mazo",ic:"📦",w:1.8,r:4.5,col:"#d9402a"},
  {id:"dice",n:"Dados y marcadores",ic:"🎲",w:1.2,r:3.5,col:"#f2b705"},
  {id:"playmat",n:"Tapete de juego",ic:"🟩",w:7,r:16.95,col:"#2fa557"},
  {id:"binder",n:"Carpeta de 9 bolsillos",ic:"📒",w:8,r:17.95,col:"#2f2f38"}
];
export const PPREF={kid:{tin:3,acc:4},collector:{etb:3,acc:2,col:1,tin:1},investor:{box:5,col:1},whale:{col:3,etb:3,box:2},player:{acc:5,etb:1}};
export const REGS=[
  {id:"lucia",n:"Lucía",e:"👩",t:"collector",col:"#2fa557",skin:"#f2c9a0",hair:"#6b3a1e",d:"Coleccionista de ilustraciones raras."},
  {id:"iker",n:"Iker",e:"🧒",t:"kid",col:"#4a90d9",skin:"#e0a878",hair:"#222",d:"Se gasta la paga en sobres."},
  {id:"marcos",n:"Marcos",e:"🧑‍💼",t:"investor",col:"#3d4257",skin:"#f2c9a0",hair:"#111",d:"Invierte en cajas y cartas top."},
  {id:"aitana",n:"Aitana",e:"🤑",t:"whale",col:"#d0a52a",skin:"#a9714b",hair:"#2a1a0a",d:"Gasta a lo grande."},
  {id:"hugo",n:"Hugo",e:"🎮",t:"collector",col:"#8e4cb5",skin:"#f2c9a0",hair:"#c47a45",d:"Jugador competitivo: fundas, tapetes y cartas.",acc:true},
  {id:"paco",n:"Don Paco",e:"👴",t:"lot",col:"#8a5a2b",skin:"#f2c9a0",hair:"#ddd",d:"Vende colecciones de toda la vida."},
  {id:"rafa",n:"Rafa",e:"🕶️",t:"seller",col:"#3a3a3a",skin:"#e0a878",hair:"#111",d:"Siempre trae «chollos»… ojo con él."}
];
export const RECO=["base1","swsh7","swsh12pt5","sv4pt5","sv8"];
export const DIFFS={facil:{n:"Fácil",d:"Sin tienda rival ni ladrones, pocas falsas, clientes más pacientes y alquiler más barato. Ideal para peques.",pat:1.5,tol:1.06,rent:.7,fake:.35,theft:0,rival:false,rStr:40},
  normal:{n:"Normal",d:"La experiencia completa.",pat:1,tol:1,rent:1,fake:1,theft:1,rival:true,rStr:55},
  dificil:{n:"Difícil",d:"Rival desde el día 3 y más fuerte, más robos y falsas, clientes exigentes y alquiler caro.",pat:.8,tol:.95,rent:1.3,fake:1.3,theft:1.6,rival:true,rStr:70,rDay:3}};
export const SHIRTC=["#e3350d","#3f7fc4","#2fa557","#f2b705","#8e4cb5","#e07a2f","#1abc9c","#222"];
export const HAIRC2=["#222","#6b3a1e","#c47a2c","#d9b36c","#8a8a8a","#b13e53"];
export const STYLES={clasico:{n:"Clásico",c:null},azul:{n:"Azul",c:"#3f7fc4"},rosa:{n:"Rosa",c:"#ff7ab8"},verde:{n:"Verde",c:"#2fa557"},morado:{n:"Morado",c:"#8e4cb5"},noche:{n:"Noche",c:"#1f2a44"}};
export const PETS={cat:"🐱 Gato",dog:"🐶 Perro",bunny:"🐰 Conejo",none:"Sin mascota"};
