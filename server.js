const express = require("express");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const adminSessions = new Set();

const users = new Map();
const promoCodes = new Map([
  ["WELCOME", { reward: 500, used: new Set() }],
  ["GIFTROLL", { reward: 1000, used: new Set() }]
]);

const cases = [
  {id:1,name:"Лесной",price:100,rarity:"common",accent:"#6ee7ff",items:[
    {name:"Лесная искра",type:"Gift",value:80},{name:"Изумрудный талисман",type:"NFT",value:120},{name:"Сердце леса",type:"Gift",value:180}
  ]},
  {id:2,name:"Снежный",price:500,rarity:"common",accent:"#8b5cf6",items:[
    {name:"Снежный кристалл",type:"Gift",value:420},{name:"Морозная звезда",type:"NFT",value:700},{name:"Полярный подарок",type:"Gift",value:900}
  ]},
  {id:3,name:"Новогодний",price:1000,rarity:"rare",accent:"#a78bfa",items:[
    {name:"Праздничная звезда",type:"NFT",value:800},{name:"Красный сюрприз",type:"Gift",value:1500},{name:"Новогодний шар",type:"NFT",value:2200}
  ]},
  {id:4,name:"Королевский",price:2500,rarity:"rare",accent:"#22d3ee",items:[
    {name:"Королевская корона",type:"NFT",value:1800},{name:"Фиолетовый рубин",type:"Gift",value:3200},{name:"Королевский свет",type:"NFT",value:4500}
  ]},
  {id:5,name:"Богатый",price:5000,rarity:"epic",accent:"#38bdf8",items:[
    {name:"Золотой слиток",type:"Gift",value:3800},{name:"Бриллиантовый подарок",type:"NFT",value:6500},{name:"Золотая звезда",type:"NFT",value:9000}
  ]},
  {id:6,name:"Драконий",price:10000,rarity:"epic",accent:"#f59e0b",items:[
    {name:"Драконий коготь",type:"Gift",value:7000},{name:"Синий дракон",type:"NFT",value:13000},{name:"Огненный амулет",type:"Gift",value:18000}
  ]},
  {id:7,name:"Романтичный",price:15000,rarity:"epic",accent:"#c084fc",items:[
    {name:"Розовое сердце",type:"NFT",value:11000},{name:"Романтическая роза",type:"Gift",value:20000},{name:"Неоновый купидон",type:"NFT",value:28000}
  ]},
  {id:8,name:"Элитный",price:25000,rarity:"legendary",accent:"#6366f1",items:[
    {name:"Элитный кейс",type:"NFT",value:18000},{name:"Чёрный бриллиант",type:"Gift",value:33000},{name:"Королевский жетон",type:"NFT",value:50000}
  ]},
  {id:9,name:"Молния",price:40000,rarity:"legendary",accent:"#fb7185",items:[
    {name:"Громовой импульс",type:"NFT",value:30000},{name:"Молниеносный кристалл",type:"Gift",value:55000},{name:"Синий разряд",type:"NFT",value:75000}
  ]},
  {id:10,name:"Токсичный",price:60000,rarity:"legendary",accent:"#67e8f9",items:[
    {name:"Токсичный череп",type:"NFT",value:45000},{name:"Зелёный яд",type:"Gift",value:80000},{name:"Радиоактивное ядро",type:"NFT",value:110000}
  ]},
  {id:11,name:"Бездна",price:80000,rarity:"mythic",accent:"#fbbf24",items:[
    {name:"Врата бездны",type:"NFT",value:65000},{name:"Тёмная сфера",type:"Gift",value:100000},{name:"Осколок пустоты",type:"NFT",value:140000}
  ]},
  {id:12,name:"Феникс",price:100000,rarity:"mythic",accent:"#e879f9",items:[
    {name:"Перо феникса",type:"NFT",value:80000},{name:"Огненное сердце",type:"Gift",value:130000},{name:"Восход феникса",type:"NFT",value:190000}
  ]},
  {id:13,name:"Кристальный",price:150000,rarity:"mythic",accent:"#fb7185",items:[
    {name:"Кристальная корона",type:"NFT",value:110000},{name:"Ледяной кристалл",type:"Gift",value:190000},{name:"Сапфировое ядро",type:"NFT",value:280000}
  ]},
  {id:14,name:"Бабочка",price:200000,rarity:"ultra",accent:"#f97316",items:[
    {name:"Неоновая бабочка",type:"NFT",value:150000},{name:"Крылья ауры",type:"Gift",value:260000},{name:"Фиолетовый мотылёк",type:"NFT",value:380000}
  ]},
  {id:15,name:"Демонический",price:300000,rarity:"ultra",accent:"#818cf8",items:[
    {name:"Демоническая маска",type:"NFT",value:220000},{name:"Красный рог",type:"Gift",value:400000},{name:"Кровавый кристалл",type:"NFT",value:600000}
  ]},
  {id:16,name:"Лев",price:400000,rarity:"ultra",accent:"#2dd4bf",items:[
    {name:"Золотой лев",type:"NFT",value:300000},{name:"Львиная корона",type:"Gift",value:520000},{name:"Солнечный медальон",type:"NFT",value:750000}
  ]},
  {id:17,name:"Космос",price:500000,rarity:"supreme",accent:"#f472b6",items:[
    {name:"Космический портал",type:"NFT",value:380000},{name:"Планета неона",type:"Gift",value:650000},{name:"Звёздное ядро",type:"NFT",value:900000}
  ]},
  {id:18,name:"Аниме",price:650000,rarity:"supreme",accent:"#fde047",items:[
    {name:"Аниме-звезда",type:"NFT",value:480000},{name:"Неоновая героиня",type:"Gift",value:800000},{name:"Кибер-сердце",type:"NFT",value:1100000}
  ]},
  {id:19,name:"Ангельский",price:800000,rarity:"supreme",accent:"#fda4af",items:[
    {name:"Крылья ангела",type:"NFT",value:600000},{name:"Небесная корона",type:"Gift",value:950000},{name:"Светлый кристалл",type:"NFT",value:1300000}
  ]},
  {id:20,name:"Легендарный",price:1000000,rarity:"supreme",accent:"#facc15",items:[
    {name:"Emperor",type:"NFT",value:750000},{name:"Emperor Gift",type:"Gift",value:1200000},{name:"Emperor Core",type:"NFT",value:1800000}
  ]}
];

function getUser(id) {
  if (!users.has(id)) users.set(id, {
    id, username:"Demo", firstName:"Guest", photo_url:"",
    balance:0, inventory:[], deposits:[], lastBonus:0, usedPromos:[]
  });
  return users.get(id);
}
function getAuthUser(req) {
  return getUser(req.headers["x-user-id"] || "demo_user");
}
function checkAdmin(req,res,next) {
  const token = req.headers["x-admin-token"];
  if (!token || !adminSessions.has(token)) return res.status(401).json({error:"Unauthorized"});
  next();
}
function publicUser(u) {
  return {id:u.id,username:u.username,firstName:u.firstName,photo_url:u.photo_url,balance:u.balance,inventory:u.inventory};
}

app.get("/api/health",(req,res)=>res.json({ok:true,message:"Server is working"}));

app.get("/api/user",(req,res)=>{
  const u=getAuthUser(req);
  res.json(publicUser(u));
});

app.post("/api/demo-login",(req,res)=>{
  const id=String(req.body.id||"demo_user");
  const u=getUser(id);
  res.json(publicUser(u));
});

// Safe demo auth endpoint: accepts verified Telegram identity data supplied by an external auth layer.
// In production, validate Telegram's hash on the server before calling this endpoint.
app.post("/api/auth/telegram",(req,res)=>{
  const t=req.body||{};
  if(!t.id) return res.status(400).json({error:"Telegram identity is required"});
  const u=getUser(`tg_${t.id}`);
  u.username=t.username||u.username;
  u.firstName=t.first_name||u.firstName;
  u.photo_url=t.photo_url||u.photo_url;
  res.json(publicUser(u));
});

app.get("/api/cases",(req,res)=>res.json(cases.map(c=>({...c,image:`/assets/cases/case-${String(c.id).padStart(2,"0")}.png`,items:c.items.map((i,n)=>({...i,image:`/assets/gifts/case-${String(c.id).padStart(2,"0")}-gift-${n+1}.png`}))}))));

app.post("/api/cases/:id/open",(req,res)=>{
  const u=getAuthUser(req);
  const c=cases.find(x=>x.id===Number(req.params.id));
  if(!c) return res.status(404).json({error:"Кейс не найден"});
  const requestedIndex=Number(req.body?.itemIndex);
  const itemIndex=Number.isInteger(requestedIndex)&&requestedIndex>=0&&requestedIndex<c.items.length
    ? requestedIndex
    : Math.floor(Math.random()*c.items.length);
  const item=c.items[itemIndex];
  const withImage={...item,image:`/assets/gifts/case-${String(c.id).padStart(2,"0")}-gift-${itemIndex+1}.png`};
  u.inventory.unshift({...withImage,caseName:c.name,receivedAt:Date.now()});
  res.json({balance:u.balance,item:withImage});
});

app.get("/api/profile",(req,res)=>{
  const u=getAuthUser(req);
  res.json({...publicUser(u),deposits:u.deposits});
});

app.post("/api/deposit",(req,res)=>{
  const amount=Number(req.body.amount);
  if(!Number.isInteger(amount)||amount<=0) return res.status(400).json({error:"Некорректная сумма"});
  const u=getAuthUser(req);
  const six=6*60*60*1000;
  u.deposits=(u.deposits||[]).filter(x=>Date.now()-x.time<six);
  const used=u.deposits.reduce((a,x)=>a+x.amount,0);
  if(used+amount>500000) return res.status(400).json({error:`Лимит пополнения 500 000 ⭐ за 6 часов. Осталось ${(500000-used).toLocaleString("ru-RU")} ⭐`});
  u.balance+=amount; u.deposits.push({amount,time:Date.now()});
  res.json({success:true,balance:u.balance,used:used+amount,remaining:500000-used-amount});
});

app.post("/api/bonus",(req,res)=>{
  const u=getAuthUser(req);
  const hour=60*60*1000;
  if(Date.now()-u.lastBonus<hour) return res.status(400).json({error:"Бонус доступен раз в час"});
  u.lastBonus=Date.now();
  u.balance+=100;
  res.json({success:true,balance:u.balance,reward:100});
});

app.post("/api/promo",(req,res)=>{
  const code=String(req.body.code||"").trim().toUpperCase();
  const p=promoCodes.get(code);
  const u=getAuthUser(req);
  if(!p) return res.status(404).json({error:"Промокод не найден"});
  if(p.used.has(u.id)) return res.status(400).json({error:"Промокод уже использован"});
  p.used.add(u.id); u.usedPromos.push(code); u.balance+=p.reward;
  res.json({success:true,reward:p.reward,balance:u.balance});
});

app.post("/api/upgrade",(req,res)=>{
  const u=getAuthUser(req);
  const index=Number(req.body.index);
  const chance=Number(req.body.chance||50);
  if(!Number.isInteger(index)||!u.inventory[index]) return res.status(400).json({error:"Подарок не найден"});
  if(!Number.isFinite(chance)||chance<1||chance>86) return res.status(400).json({error:"Максимальный шанс — 86%"});

  // Безопасный демо-апгрейд: Stars и сам подарок не ставятся на риск.
  // При проигрыше предмет остаётся в инвентаре без изменений.
  const item=u.inventory[index];
  const success=Math.random()*100 < chance;
  let resultItem={...item};
  if(success){
    resultItem.value=Math.floor(Number(item.value||100)*1.35);
    resultItem.name=item.name.replace(/ \+$/,'')+" +";
    u.inventory[index]=resultItem;
  }
  res.json({success:true,result:success?"win":"loss",balance:u.balance,item:resultItem,index,inventory:u.inventory});
});

app.post("/api/inventory/sell",(req,res)=>{
  const u=getAuthUser(req);
  const index=Number(req.body.index);
  if(!Number.isInteger(index)||!u.inventory[index]) return res.status(400).json({error:"Подарок не найден"});
  const item=u.inventory[index];
  const received=Math.floor(Number(item.value||0)*0.8);
  u.inventory.splice(index,1);
  u.balance+=received;
  res.json({success:true,received,balance:u.balance,inventory:u.inventory});
});

app.get("/api/admin/users",checkAdmin,(req,res)=>{
  res.json([...users.values()].map(u=>({id:u.id,username:u.username,balance:u.balance,inventoryCount:u.inventory.length})));
});
app.get("/api/admin/cases",checkAdmin,(req,res)=>res.json(cases));
app.get("/api/admin/promos",checkAdmin,(req,res)=>res.json([...promoCodes.entries()].map(([code,p])=>({code,reward:p.reward,uses:p.used.size}))));

app.post("/api/admin/login",(req,res)=>{
  const {login,password}=req.body;
  if(login!==ADMIN_LOGIN||password!==ADMIN_PASSWORD) return res.status(401).json({error:"Неверный логин или пароль"});
  const token=crypto.randomBytes(32).toString("hex"); adminSessions.add(token);
  res.json({success:true,token});
});

app.listen(PORT,()=>console.log(`🚀 Server: http://localhost:${PORT}`));
