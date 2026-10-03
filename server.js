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
  {id:1,name:"STARTER",price:100,rarity:"common",accent:"#6ee7ff",items:[
    {name:"Blue Spark",type:"Gift",value:80},{name:"Mini Cloud",type:"NFT",value:120},{name:"Pixel Heart",type:"Gift",value:180}
  ]},
  {id:2,name:"NEON",price:500,rarity:"common",accent:"#8b5cf6",items:[
    {name:"Neon Star",type:"Gift",value:420},{name:"Purple Drop",type:"NFT",value:700},{name:"Cyber Rose",type:"Gift",value:900}
  ]},
  {id:3,name:"VIOLET",price:1000,rarity:"rare",accent:"#a78bfa",items:[
    {name:"Violet Gem",type:"NFT",value:800},{name:"Moon Gift",type:"Gift",value:1500},{name:"Night Orb",type:"NFT",value:2200}
  ]},
  {id:4,name:"AURORA",price:2500,rarity:"rare",accent:"#22d3ee",items:[
    {name:"Aurora",type:"NFT",value:1800},{name:"Ice Bloom",type:"Gift",value:3200},{name:"Polar Star",type:"NFT",value:4500}
  ]},
  {id:5,name:"CYBER",price:5000,rarity:"epic",accent:"#38bdf8",items:[
    {name:"Cyber Cat",type:"Gift",value:3800},{name:"Chrome Mask",type:"NFT",value:6500},{name:"Laser Core",type:"NFT",value:9000}
  ]},
  {id:6,name:"ROYAL",price:10000,rarity:"epic",accent:"#f59e0b",items:[
    {name:"Royal Crown",type:"Gift",value:7000},{name:"Gold Tiger",type:"NFT",value:13000},{name:"Golden Star",type:"Gift",value:18000}
  ]},
  {id:7,name:"GALAXY",price:15000,rarity:"epic",accent:"#c084fc",items:[
    {name:"Galaxy",type:"NFT",value:11000},{name:"Cosmic Rose",type:"Gift",value:20000},{name:"Nova",type:"NFT",value:28000}
  ]},
  {id:8,name:"PHANTOM",price:25000,rarity:"legendary",accent:"#6366f1",items:[
    {name:"Phantom",type:"NFT",value:18000},{name:"Dark Angel",type:"Gift",value:33000},{name:"Void Crown",type:"NFT",value:50000}
  ]},
  {id:9,name:"INFERNO",price:40000,rarity:"legendary",accent:"#fb7185",items:[
    {name:"Inferno",type:"NFT",value:30000},{name:"Fire Gift",type:"Gift",value:55000},{name:"Hellstar",type:"NFT",value:75000}
  ]},
  {id:10,name:"DIAMOND",price:60000,rarity:"legendary",accent:"#67e8f9",items:[
    {name:"Diamond",type:"NFT",value:45000},{name:"Crystal Swan",type:"Gift",value:80000},{name:"Blue Crown",type:"NFT",value:110000}
  ]},
  {id:11,name:"ROYAL X",price:80000,rarity:"mythic",accent:"#fbbf24",items:[
    {name:"Royal X",type:"NFT",value:65000},{name:"Golden Wing",type:"Gift",value:100000},{name:"Sun Core",type:"NFT",value:140000}
  ]},
  {id:12,name:"VOID",price:100000,rarity:"mythic",accent:"#e879f9",items:[
    {name:"Void",type:"NFT",value:80000},{name:"Void Rose",type:"Gift",value:130000},{name:"Black Hole",type:"NFT",value:190000}
  ]},
  {id:13,name:"OMEGA",price:150000,rarity:"mythic",accent:"#fb7185",items:[
    {name:"Omega",type:"NFT",value:110000},{name:"Omega Gift",type:"Gift",value:190000},{name:"Omega Core",type:"NFT",value:280000}
  ]},
  {id:14,name:"TITAN",price:200000,rarity:"ultra",accent:"#f97316",items:[
    {name:"Titan",type:"NFT",value:150000},{name:"Titan Crown",type:"Gift",value:260000},{name:"Titan Core",type:"NFT",value:380000}
  ]},
  {id:15,name:"COSMOS",price:300000,rarity:"ultra",accent:"#818cf8",items:[
    {name:"Cosmos",type:"NFT",value:220000},{name:"Cosmic Crown",type:"Gift",value:400000},{name:"Stellar Core",type:"NFT",value:600000}
  ]},
  {id:16,name:"ETERNAL",price:400000,rarity:"ultra",accent:"#2dd4bf",items:[
    {name:"Eternal",type:"NFT",value:300000},{name:"Eternal Gift",type:"Gift",value:520000},{name:"Eternal Heart",type:"NFT",value:750000}
  ]},
  {id:17,name:"INFINITY",price:500000,rarity:"supreme",accent:"#f472b6",items:[
    {name:"Infinity",type:"NFT",value:380000},{name:"Infinity Gift",type:"Gift",value:650000},{name:"Infinity Core",type:"NFT",value:900000}
  ]},
  {id:18,name:"LEGACY",price:650000,rarity:"supreme",accent:"#fde047",items:[
    {name:"Legacy",type:"NFT",value:480000},{name:"Legacy Crown",type:"Gift",value:800000},{name:"Legacy Star",type:"NFT",value:1100000}
  ]},
  {id:19,name:"ULTIMATE",price:800000,rarity:"supreme",accent:"#fda4af",items:[
    {name:"Ultimate",type:"NFT",value:600000},{name:"Ultimate Gift",type:"Gift",value:950000},{name:"Ultimate Core",type:"NFT",value:1300000}
  ]},
  {id:20,name:"EMPEROR",price:1000000,rarity:"supreme",accent:"#facc15",items:[
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

app.get("/api/cases",(req,res)=>res.json(cases.map(c=>({...c,image:`/assets/cases/case-${String(c.id).padStart(2,"0")}.png`,items:c.items.map(i=>({...i}))}))));

app.post("/api/cases/:id/open",(req,res)=>{
  const u=getAuthUser(req);
  const c=cases.find(x=>x.id===Number(req.params.id));
  if(!c) return res.status(404).json({error:"Кейс не найден"});
  const item=c.items[Math.floor(Math.random()*c.items.length)];
  u.inventory.unshift({...item,caseName:c.name,receivedAt:Date.now()});
  res.json({balance:u.balance,item});
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
  if(!Number.isInteger(index)||!u.inventory[index]) return res.status(400).json({error:"Подарок не найден"});
  const item=u.inventory[index];
  const cost=Math.max(50,Math.floor(Number(item.value||100)*0.25));
  if(u.balance<cost) return res.status(400).json({error:`Недостаточно ⭐. Не хватает ${(cost-u.balance).toLocaleString("ru-RU")} ⭐`});
  u.balance-=cost;
  item.value=Math.floor(Number(item.value||100)*1.35);
  item.name=item.name+" +";
  res.json({success:true,balance:u.balance,item,index});
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
