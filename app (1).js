let user=null,cases=[];const $=s=>document.querySelector(s);
function headers(){return {"Content-Type":"application/json","x-user-id":user?.id||"demo_user"}}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2500)}
function money(n){return Number(n||0).toLocaleString("ru-RU")}
async function loadUser(){user=await fetch("/api/user",{headers:headers()}).then(r=>r.json());$("#username").textContent=user.username||user.firstName||"Профиль";$("#avatar").src=user.photo_url||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='100%25' height='100%25' fill='%23251b3d'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='white' font-size='35'%3E✦%3C/text%3E%3C/svg%3E";$("#headerBalance").textContent=`${money(user.balance)} ⭐`}
async function loadCases(){
  const data=await fetch("/api/cases").then(r=>r.json());
  cases=(Array.isArray(data)?data:[]).map(c=>({
    ...c,
    image:c.image||`/assets/cases/case-${String(c.id).padStart(2,"0")}.png`,
    items:(Array.isArray(c.items)?c.items:[]).map((i,n)=>({...i,image:i.image||`/assets/gifts/case-${String(c.id).padStart(2,"0")}-gift-${n+1}.png`}))
  }));
}
function setNav(name){document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x.dataset.nav===name))}
function go(){const p=location.hash.slice(2)||"cases";setNav(p.split("/")[0]);if(p.startsWith("case/"))renderCase(Number(p.split("/")[1]));else if(p==="profile")renderProfile();else if(p==="upgrade")renderUpgrade();else if(p==="bonus")renderBonus();else renderCases()}
function renderCases(){$("#view").innerHTML=`<section class="hero"><div><span class="eyebrow">ВИРТУАЛЬНАЯ КОЛЛЕКЦИЯ</span><h1>Открывай<br><em>редкие подарки.</em></h1><p class="muted">Выбирай кейс и смотри содержимое. Все Stars в этом проекте виртуальные.</p></div><div class="balance-card"><small>БАЛАНС</small><strong>${money(user.balance)} ⭐</strong></div></section><div class="section-title"><div><span class="eyebrow">КОЛЛЕКЦИЯ</span><h2>Все кейсы</h2></div></div><div class="cases">${cases.map(c=>`<article class="case-card" onclick="location.hash='#/case/${c.id}'"><img src="${c.image}"><div class="case-body"><h3>${c.name}</h3><p><span class="case-price">${money(c.price)} ⭐</span> · ${c.items.length} подарка</p></div></article>`).join("")}</div>`}
function renderCase(id){
  const c=cases.find(x=>x.id===id); if(!c)return renderCases();
  const gifts=c.items.map(i=>`<div class="gift"><div class="gift-art photo"><img src="${i.image}" alt="${i.name}" onerror="this.style.display='none'"></div><b>${i.name}</b><small>${i.type} · ${money(i.value)} ⭐</small></div>`).join("");
  const previewItems=Array(3).fill(c.items).flat().map(i=>`<div class="case-preview-item"><img src="${i.image}" alt="${i.name}" onerror="this.style.display='none'"><div><b>${i.name}</b><small>${money(i.value)} ⭐</small></div></div>`).join("");
  const enough=Number(user.balance)>=Number(c.price);
  const shortage=Math.max(0,Number(c.price)-Number(user.balance));
  const openMarkup=enough
    ? `<button class="open-btn" id="caseOpenBtn" onclick="openCase(${c.id})">Открыть кейс · ${money(c.price)} ⭐</button>`
    : `<div class="shortage">Не хватает <b>${money(shortage)} ⭐</b> на балансе</div><button class="open-btn" onclick="openTopup()">Пополнить баланс +</button>`;
  $("#view").innerHTML=`<section class="case-page">
    <div class="case-topbar"><a class="back" href="#/cases">← Назад</a><div class="case-page-title"><span class="eyebrow">${c.rarity.toUpperCase()}</span><h1>${c.name}</h1></div><button class="bonus-code" onclick="openPromo()">Бонус-код 🎟</button></div>
    <div class="case-opening-preview" id="caseOpeningPreview">
      <div class="case-preview-window" id="casePreviewWindow">
        <div class="case-preview-track" id="casePreviewTrack">${previewItems}</div>
        <div class="case-preview-pointer"></div>
        <div class="case-preview-fade left"></div><div class="case-preview-fade right"></div>
      </div>
      <div class="case-spotlight case-spotlight-hidden" id="caseSpotlight"></div>
      <div class="case-open-actions" id="caseOpenActions">
        <div class="case-roll-status" id="caseRollStatus">Готов к открытию</div>
        ${openMarkup}
      </div>
    </div>
    <div class="section-title"><div><span>СОДЕРЖИМОЕ КЕЙСА</span><h2>Подарки в кейсе</h2></div><span class="case-price">${money(c.price)} ⭐</span></div>
    <div class="items-grid">${gifts}</div>
  </section>`;
}

async function openCase(id){
  const c=cases.find(x=>x.id===id); if(!c)return;
  const btn=$("#caseOpenBtn"),track=$("#casePreviewTrack"),windowEl=$("#casePreviewWindow"),status=$("#caseRollStatus"),spotlight=$("#caseSpotlight");
  if(!btn||!track||!windowEl||!status)return;
  if(track.classList.contains('case-inline-rolling'))return;

  // Keep the same in-page roulette animation: no new window/modal.
  const targetItemIndex=Math.floor(Math.random()*c.items.length);
  const target=c.items[targetItemIndex];
  const targetPosition=30;
  const sequence=[];
  for(let n=0;n<38;n++){
    const item=n===targetPosition?target:c.items[Math.floor(Math.random()*c.items.length)];
    sequence.push(item);
  }
  track.innerHTML=sequence.map(i=>`<div class="case-preview-item"><img src="${i.image}" alt="${i.name}" onerror="this.style.display='none'"><div><b>${i.name}</b><small>${money(i.value)} ⭐</small></div></div>`).join('');
  track.classList.remove('case-inline-rolling');
  track.style.transform='translateX(0)';
  void track.offsetWidth;
  const itemEl=track.querySelector('.case-preview-item');
  const itemWidth=itemEl?.getBoundingClientRect().width||155;
  const targetCenter=targetPosition*itemWidth + itemWidth/2;
  const shift=(windowEl.clientWidth/2)-targetCenter;
  track.style.setProperty('--case-shift',`${shift}px`);
  track.style.setProperty('--case-duration','10s');
  btn.disabled=true;
  btn.textContent='Открытие…';
  status.textContent='Лента набирает скорость…';
  if(spotlight){spotlight.classList.add('case-spotlight-hidden');spotlight.innerHTML='';}
  track.classList.add('case-inline-rolling');
  setTimeout(()=>status.textContent='Замедление…',7200);
  setTimeout(()=>status.textContent='Останавливаемся…',9000);

  // The demo result is tied to the item shown under the center pointer.
  const r=await fetch(`/api/cases/${id}/open`,{method:'POST',headers:headers(),body:JSON.stringify({itemIndex:targetItemIndex})});
  const d=await r.json();
  if(!r.ok){
    track.classList.remove('case-inline-rolling');
    btn.disabled=false; btn.textContent=`Открыть кейс · ${money(c.price)} ⭐`;
    status.textContent=d.error||'Не удалось открыть кейс';
    return;
  }
  setTimeout(()=>{
    user.balance=d.balance;
    user.inventory=[d.item,...(user.inventory||[])];
    $("#headerBalance").textContent=`${money(user.balance)} ⭐`;
    status.textContent=`Получено: ${d.item.name}`;
    if(spotlight){
      spotlight.innerHTML=`<div class="spotlight-art"><img src="${d.item.image}" alt="${d.item.name}"><b>${d.item.name}</b><small>${d.item.type} · ${money(d.item.value)} ⭐</small></div>`;
      spotlight.classList.remove('case-spotlight-hidden');
    }
    btn.disabled=false;
    btn.textContent=`Открыть ещё раз · ${money(c.price)} ⭐`;
    track.classList.remove('case-inline-rolling');
    track.style.transform=`translateX(${shift}px)`;
  },10000);
}
function closeModal(){$("#modal").classList.remove("open")}
function renderProfile(){
  const inv=user.inventory||[];
  const cards=inv.map((i,n)=>{
    const ci=cases.find(c=>c.items.some(x=>x.name===i.name));
    const sell=Math.floor(Number(i.value||0)*0.8);
    return `<div class="inv"><div class="art"><img src="${i.image||`/assets/gifts/case-${String(ci?.id||1).padStart(2,"0")}-gift-1.png`}" alt="${i.name}"></div><b>${i.name}</b><small>${i.type} · ${money(i.value)} ⭐</small><button class="sell-btn" onclick="sellGift(${n})">Продать за ${money(sell)} ⭐</button></div>`;
  }).join('');
  $("#view").innerHTML=`<section class="profile-page"><div class="profile-head"><img src="${user.photo_url||$("#avatar").src}"><div><h1>${user.firstName||user.username||"Профиль"}</h1><span class="pill">@${user.username||"demo_user"}</span></div></div><div class="wallet-grid"><div class="stat"><small>БАЛАНС</small><strong>${money(user.balance)} ⭐</strong></div><div class="stat"><small>ПОДАРКОВ</small><strong>${inv.length}</strong></div><div class="stat"><small>ЛИМИТ</small><strong>500 000 ⭐ / 6 ч</strong></div></div><div class="section-title"><div><span>КОЛЛЕКЦИЯ</span><h2>Мои подарки</h2></div></div><p class="muted profile-note">Любой подарок можно продать за фиксированные 80% его виртуальной стоимости.</p><div class="inventory">${cards||`<div class="inv"><div class="art">◌</div><b>Пока пусто</b><small>Твоя коллекция появится здесь</small></div>`}</div></section>`
}
async function sellGift(index){
  const r=await fetch('/api/inventory/sell',{method:'POST',headers:headers(),body:JSON.stringify({index})});
  const d=await r.json();
  if(!r.ok)return toast(d.error);
  user.balance=d.balance; user.inventory=d.inventory;
  $("#headerBalance").textContent=`${money(user.balance)} ⭐`;
  toast(`Подарок продан за ${money(d.received)} ⭐`);
  renderProfile();
}
function renderUpgrade(){
  const a=user.inventory||[];
  if(!a.length){
    $("#view").innerHTML=`<section class="upgrade-page"><div class="section-title"><div><span>АПГРЕЙДЫ</span><h2>Апгрейд</h2></div><div class="upgrade-balance">Баланс <b>${money(user.balance)} ⭐</b></div></div><div class="upgrade-empty"><div class="upgrade-wheel empty"><div class="wheel-inner"><strong>—</strong><span>НЕТ ПОДАРКА</span></div></div><p class="muted">Сначала получи подарок, затем выбери его в апгрейде.</p></div></section>`;return
  }
  window.upgradeSelected=0; window.upgradeChance=50;
  const i=a[0];
  const img=i.image||cases.find(c=>c.items.some(x=>x.name===i.name))?.items.find(x=>x.name===i.name)?.image||cases[0]?.image||'';
  $("#view").innerHTML=`<section class="upgrade-page"><div class="section-title"><div><span>АПГРЕЙДЫ</span><h2>Апгрейд подарка</h2></div><div class="upgrade-balance">Баланс <b>${money(user.balance)} ⭐</b></div></div><div class="upgrade-layout"><div class="upgrade-wheel-wrap"><div class="upgrade-wheel" id="upgradeWheel" style="--chance:50%;--arrow:0deg"><div class="wheel-ticks"></div><div class="wheel-inner"><strong id="chanceValue">50.00%</strong><span id="upgradeResultText">Шанс входа</span></div><div class="wheel-arrow"></div></div><div class="upgrade-wheel-note" id="upgradeStatus">Выбери процент и запусти демо-анимацию</div></div><div class="upgrade-controls"><label>Выбери подарок</label><div class="upgrade-gift-list" id="upgradeGiftList">${a.map((g,n)=>{const gi=g.image||cases.find(c=>c.items.some(x=>x.name===g.name))?.items.find(x=>x.name===g.name)?.image||'';return `<button class="upgrade-gift-card ${n===0?'selected':''}" onclick="selectUpgradeGift(${n})"><span class="upgrade-gift-art"><img src="${gi}" alt="${g.name}"></span><span><b>${g.name}</b><small>${money(g.value)} ⭐</small></span></button>`}).join('')}</div><label>Шанс входа <b id="chanceLabel">50.00%</b></label><div class="chance-buttons">${[10,25,40,50,65,75,86].map(n=>`<button class="chance-btn ${n===50?'active':''}" onclick="updateUpgradeChance(${n})">${n}%</button>`).join('')}</div><div class="selected-gift"><div class="selected-art"><img id="upgradeGiftImage" src="${img}" alt="${i.name}"></div><div><b id="upgradeGiftName">${i.name}</b><small id="upgradeGiftValue">При выигрыше стоимость увеличится на 35%. Баланс не списывается.</small></div></div><button class="open-btn" id="upgradeRun" onclick="runUpgradeDemo()">Запустить апгрейд</button><p class="tiny-note">Это безопасное демо: Stars не списываются, а подарок не исчезает при проигрыше. При «ВЫИГРЫШЕ» подарок улучшается.</p></div></div></section>`
}
function selectUpgradeGift(value){
  window.upgradeSelected=Number(value);
  document.querySelectorAll('.upgrade-gift-card').forEach((x,n)=>x.classList.toggle('selected',n===window.upgradeSelected));
  const i=(user.inventory||[])[window.upgradeSelected];
  const img=i?.image||cases.find(c=>c.items.some(x=>x.name===i?.name))?.items.find(x=>x.name===i?.name)?.image||'/assets/gifts/case-01-gift-1.png';
  if($("#upgradeGiftName"))$("#upgradeGiftName").textContent=i?.name||'';
  if($("#upgradeGiftValue"))$("#upgradeGiftValue").textContent='При выигрыше стоимость увеличится на 35%. Баланс не списывается.';
  if($("#upgradeGiftImage"))$("#upgradeGiftImage").src=img;
  if($("#upgradeRun"))$("#upgradeRun").textContent=`Улучшить за ${money(cost)} ⭐`;
}
function updateUpgradeChance(value){
  const n=Math.min(86,Math.max(1,Number(value)||1)); window.upgradeChance=n;
  const wheel=$("#upgradeWheel"); if(wheel)wheel.style.setProperty('--chance',`${n}%`);
  if($("#chanceValue"))$("#chanceValue").textContent=`${n.toFixed(2)}%`;
  if($("#chanceLabel"))$("#chanceLabel").textContent=`${n.toFixed(2)}%`;
  document.querySelectorAll('.chance-btn').forEach(b=>b.classList.toggle('active',Number(b.textContent.replace('%',''))===n));
}
async function runUpgradeDemo(){
  const btn=$("#upgradeRun"),wheel=$("#upgradeWheel"),status=$("#upgradeStatus"),resultText=$("#upgradeResultText"); if(!btn||!wheel)return;
  const idx=window.upgradeSelected;
  if(!(user.inventory||[])[idx])return;
  btn.disabled=true; btn.textContent='Апгрейд идёт…'; status.textContent='Стрелка вращается…';
  if(resultText){resultText.textContent='Шанс входа';resultText.className='';}
  wheel.classList.remove('spinning','upgrade-win','upgrade-loss'); void wheel.offsetWidth;
  const stopDeg=9*360+(Math.random()*360); wheel.style.setProperty('--arrow',`${stopDeg}deg`); wheel.classList.add('spinning');
  setTimeout(async()=>{
    const r=await fetch('/api/upgrade',{method:'POST',headers:headers(),body:JSON.stringify({index:idx,chance:window.upgradeChance})});
    const d=await r.json();
    if(!r.ok){btn.disabled=false;btn.textContent='Запустить апгрейд';return toast(d.error)}
    user.balance=d.balance; user.inventory=d.inventory; $("#headerBalance").textContent=`${money(user.balance)} ⭐`;
    const win=d.result==='win';
    wheel.classList.add(win?'upgrade-win':'upgrade-loss');
    if(resultText){resultText.textContent=win?'ВЫИГРЫШ':'ПРОИГРЫШ';resultText.className=win?'result-win':'result-loss';}
    status.textContent=win?'Подарок успешно улучшен':'Подарок остался без изменений';
    btn.disabled=false;btn.textContent='Запустить ещё раз';
    if(win)toast(`ВЫИГРЫШ — ${d.item.name}`); else toast('ПРОИГРЫШ — подарок сохранён');
  },6800)
}
function renderBonus(){$("#view").innerHTML=`<section class="bonus-page"><div class="bonus-big"><div class="giftcoin">🎁</div><span class="eyebrow">БОНУСЫ</span><h1>Бесплатный бонус</h1><div class="bonus-balance">Текущий баланс <b>${money(user.balance)} ⭐</b></div><p class="muted">Фиксированный бонус +100 ⭐ раз в час. Бонус не зависит от проигрышей или списаний.</p><div class="bonus-reward">+100 <span>⭐</span></div><button class="claim" onclick="claimBonus()">Забрать бонус</button></div></section>`}
async function claimBonus(){const r=await fetch("/api/bonus",{method:"POST",headers:headers()});const d=await r.json();if(!r.ok)return toast(d.error);user.balance=d.balance;$("#headerBalance").textContent=`${money(user.balance)} ⭐`;toast(`Получено +${d.reward} ⭐`);renderBonus()}
$("#profileBtn").onclick=()=>location.hash="#/profile";$("#topupBtn").onclick=()=>openTopup();$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()}
function openTopup(){$("#modalBox").innerHTML=`<h2>Пополнение</h2><p class="muted">Виртуальные Stars. Лимит — 500 000 ⭐ за 6 часов.</p><div class="amounts"><button onclick="setAmount(1000)">1 000 ⭐</button><button onclick="setAmount(10000)">10 000 ⭐</button><button onclick="setAmount(50000)">50 000 ⭐</button><button onclick="setAmount(100000)">100 000 ⭐</button><button onclick="setAmount(250000)">250 000 ⭐</button><button onclick="setAmount(500000)">500 000 ⭐</button></div><input id="amount" class="amount-input" type="number" placeholder="Или введи свою сумму"><div class="modal-actions"><button class="open-btn" onclick="topup()">Пополнить</button><button class="close" onclick="closeModal()">Закрыть</button></div>`;$("#modal").classList.add("open")}
function setAmount(n){$("#amount").value=n}
async function topup(){const amount=Number($("#amount").value);const r=await fetch("/api/deposit",{method:"POST",headers:headers(),body:JSON.stringify({amount})});const d=await r.json();if(!r.ok)return toast(d.error);user.balance=d.balance;$("#headerBalance").textContent=`${money(user.balance)} ⭐`;closeModal();toast(`Баланс пополнен на ${money(amount)} ⭐`);go()}
loadCases().then(loadUser).then(go);window.addEventListener("hashchange",go);