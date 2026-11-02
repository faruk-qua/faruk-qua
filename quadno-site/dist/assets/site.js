'use strict';
const english = document.documentElement.lang === 'en';
const translate = (tr, en) => english ? en : tr;
const locale = english ? 'en-GB' : 'tr-TR';
const num = new Intl.NumberFormat(locale, {maximumFractionDigits: 0});
const decimal = new Intl.NumberFormat(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});
const pctFormat = new Intl.NumberFormat(locale, {style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1});
const percent = value => pctFormat.format(value / 100);
const money = value => english ? '₺' + num.format(value) : num.format(value) + ' ₺';
const total = values => values.reduce((a, b) => a + b, 0);
const byId = id => document.getElementById(id);
const state = {property:'all', week:2, metric:'occ', mode:'ai', question:3};

// Fictional daily room sales, realised rates and channel mix for three consecutive weeks.
const properties = [
  {
    id:'coast', capacity:150,
    sold:[[97,104,107,114,119,126,118],[102,110,117,116,128,136,124],[110,118,127,125,138,142,131]],
    rates:[[3900,3950,3920,4060,4190,4260,4210],[4030,4090,4080,4150,4350,4480,4390],[4130,4090,4250,4310,4470,4590,4440]],
    direct:[.34,.36,.39], online:[.38,.39,.39]
  },
  {
    id:'city', capacity:100,
    sold:[[66,71,75,73,68,54,51],[72,79,82,86,78,61,58],[75,81,84,83,80,68,66]],
    rates:[[3100,3150,3250,3230,3070,2750,2680],[3230,3360,3440,3420,3260,2860,2740],[3300,3500,3540,3480,3360,2920,2860]],
    direct:[.47,.50,.52], online:[.36,.34,.32]
  }
];
const metrics = {
  occ:{label:translate('Oda doluluğu','Occupancy'),chart:translate('Günlük doluluk','Daily occupancy'),format:percent},
  rev:{label:translate('Oda geliri','Room revenue'),chart:translate('Günlük oda geliri','Daily room revenue'),format:money},
  adr:{label:translate('Ortalama oda fiyatı','Average daily rate'),chart:translate('Günlük ortalama oda fiyatı','Average daily rate'),format:money}
};
const channels = [translate('Doğrudan','Direct'),translate('Çevrim içi acente','Online agency'),translate('Tur operatörü','Tour operator')];
const colors = ['#267f70','#518fa3','#b69c6d'];
const weekDays = Array.from({length:7}, (_,i) => new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,9,19+i))));
const questions = [
  translate('Gelir en çok hangi gün elde edildi?','Which day earned the most room revenue?'),
  translate('En çok oda gecesini hangi kanal sağladı?','Which channel supplied the most room nights?'),
  translate('Doluluk geçen haftaya göre nasıl değişti?','How did occupancy change from the previous week?'),
  translate('Gelir değişiminde fiyat mı, satış adedi mi etkili?', 'Did rates or room nights drive the revenue change?')
];

function summarise(propertyId, week) {
  const selected = properties.filter(p => propertyId === 'all' || p.id === propertyId);
  const days = weekDays.map((_, i) => {
    const capacity = total(selected.map(p => p.capacity));
    const sold = total(selected.map(p => p.sold[week][i]));
    const revenue = total(selected.map(p => p.sold[week][i] * p.rates[week][i]));
    const direct = total(selected.map(p => Math.round(p.sold[week][i] * p.direct[week])));
    const online = total(selected.map(p => Math.round(p.sold[week][i] * p.online[week])));
    return {capacity, sold, occ:100 * sold/capacity, rev:revenue, adr:revenue/sold, mix:[direct,online,sold-direct-online]};
  });
  const sold = total(days.map(d => d.sold)), revenue = total(days.map(d => d.rev));
  return {days,sold,rev:revenue,occ:100*sold/total(days.map(d => d.capacity)),adr:revenue/sold,mix:channels.map((_,c) => total(days.map(d => d.mix[c])))};
}

function changeText(key, now, previous) {
  const difference = key==='occ' ? now-previous : 100*(now-previous)/previous;
  const sign = difference >= 0 ? '+' : '−';
  return sign + (key==='occ' ? decimal.format(Math.abs(difference))+translate(' puan',' pp') : percent(Math.abs(difference)));
}
function dayName(index, long = false) {
  return new Intl.DateTimeFormat(locale, {weekday:long?'long':'short', day:'numeric', month:long?'long':'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,9,5+7*state.week+index)));
}
function renderHero() {
  const current = summarise('all',2), previous = summarise('all',1);
  byId('hero-value').textContent = percent(current.occ);
  byId('hero-delta').textContent = changeText('occ',current.occ,previous.occ) + translate(' · önceki haftaya göre',' · vs previous week');
  const values = current.days.map(d=>d.occ), min=Math.min(...values), max=Math.max(...values);
  byId('hero-line').setAttribute('d',values.map((value,i)=>(i?'L':'M')+(3+17.6*i).toFixed(1)+' '+(33-26*(value-min)/(max-min)).toFixed(1)).join(' '));
}

function chartUnit(value, key) {
  if (key==='occ') return (english ? num.format(value)+'%' : '%'+num.format(value));
  if (key==='rev') return num.format(value/1000) + translate(' bin ₺','k ₺');
  return money(value);
}
function renderChart(current, previous) {
  const key = state.metric, container = byId('chart');
  const width = Math.max(260, container.clientWidth);
  const data = current.days.map(d=>d[key]), baseline = previous.days.map(d=>d[key]);
  const min = Math.min(...data,...baseline), max=Math.max(...data,...baseline);
  const targetStep = Math.max((max-min)/3, 1);
  const power = Math.pow(10,Math.floor(Math.log10(targetStep)));
  const step = [1,2,2.5,5,10].find(n=>n*power>=targetStep)*power;
  const bottom=Math.max(0,Math.floor((min-.04*(max-min))/step)*step);
  const top=Math.max(bottom+step,Math.ceil((max+.04*(max-min))/step)*step);
  const left = key==='occ'?37:62, right=width-16;
  const x=i=>left+i*(right-left)/6, y=v=>118-100*(v-bottom)/(top-bottom);
  const path=values=>values.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(' ');
  let grid='';
  for(let val=bottom;val<=top+step/10;val+=step) {
    grid += '<path d="M'+left+' '+y(val)+'H'+right+'" stroke="#dce5e2" stroke-dasharray="3 4"/><text x="'+(left-6)+'" y="'+(y(val)+3)+'" text-anchor="end">'+chartUnit(val,key)+'</text>';
  }
  const markers=data.map((v,i)=>'<g><title>'+dayName(i)+': '+metrics[key].format(v)+'</title><circle cx="'+x(i)+'" cy="'+y(v)+'" r="3.2" fill="#fff" stroke="#258575" stroke-width="1.8"/><circle cx="'+x(i)+'" cy="'+y(v)+'" r="9" fill="transparent"/></g>').join('');
  const labels=weekDays.map((d,i)=>'<text x="'+x(i)+'" y="140" text-anchor="middle">'+d+'</text>').join('');
  container.innerHTML='<svg viewBox="0 0 '+width+' 146" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#71bda4" stop-opacity=".32"/><stop offset="1" stop-color="#8ecbb7" stop-opacity=".02"/></linearGradient></defs>'+grid+'<path d="'+path(data)+'L'+right+' 118H'+left+'Z" fill="url(#fill)"/><path d="'+path(baseline)+'" stroke="#90a8ad" stroke-dasharray="4 5" stroke-width="1.8" fill="none"/><path d="'+path(data)+'" stroke="#258575" stroke-width="2.6" stroke-linejoin="round" fill="none"/>'+markers+labels+'</svg>';
  container.setAttribute('aria-label',metrics[key].chart+'. '+weekDays.map((d,i)=>d+' '+metrics[key].format(data[i])).join(', '));
  byId('chart-title').textContent=metrics[key].chart;
  byId('day-table').innerHTML='<table><thead><tr><th>'+translate('Gün','Day')+'</th><th>'+translate('Seçili hafta','Selected week')+'</th><th>'+translate('Önceki hafta','Previous week')+'</th></tr></thead><tbody>'+weekDays.map((d,i)=>'<tr><th scope="row">'+d+'</th><td>'+metrics[key].format(data[i])+'</td><td>'+metrics[key].format(baseline[i])+'</td></tr>').join('')+'</tbody></table>';
}

function renderAnswer(current,previous) {
  const key=state.question;
  let heading, description, value, evidence;
  if(key===0) {
    const values=current.days.map(d=>d.rev), i=values.indexOf(Math.max(...values)), day=current.days[i], name=dayName(i,true);
    heading=translate('En yüksek oda geliri','Peak room revenue');
    description=translate(name+' günü '+num.format(day.sold)+' oda satıldı. Ortalama oda fiyatı '+money(day.adr)+' oldu.',name+' recorded '+num.format(day.sold)+' rooms sold at an average rate of '+money(day.adr)+'.');
    value=money(day.rev); evidence=translate('Günlük oda geliri','Room revenue on that day');
  } else if(key===1) {
    const index=current.mix.indexOf(Math.max(...current.mix)), share=percent(current.mix[index]*100/current.sold);
    heading=channels[index];
    description=translate('Bu kanal '+num.format(current.sold)+' oda gecesinin '+num.format(current.mix[index])+' tanesini sağladı. Seçtiğiniz haftada en yüksek pay bu kanalda.', 'This channel accounted for '+num.format(current.mix[index])+' of '+num.format(current.sold)+' room nights, the largest share in the selected week.');
    value=share; evidence=translate('Oda gecesi içindeki pay','Share of room nights');
  } else if(key===3) {
    const volume = (current.sold - previous.sold) * previous.adr;
    const rate = current.sold * (current.adr - previous.adr);
    heading = Math.abs(rate) >= Math.abs(volume) ? translate('Fiyat etkisi daha büyük','Rates had the larger impact') : translate('Satış adedi etkisi daha büyük','Room nights had the larger impact');
    description = translate('Önceki haftanın fiyatıyla, satılan oda sayısındaki değişimin etkisi '+money(volume)+'. Seçili haftanın satış adedinde fiyat değişiminin etkisi '+money(rate)+'.','At last week’s rate, the change in room nights contributed '+money(volume)+'. At this week’s volume, the change in rate contributed '+money(rate)+'.');
    value = money(current.rev - previous.rev); evidence = translate('Oda gelirinde net değişim','Net change in room revenue');
  } else {
    heading=translate('Haftalık doluluk karşılaştırması','Weekly occupancy comparison');
    description=translate('Önceki haftanın doluluğu '+percent(previous.occ)+', seçili haftanın doluluğu '+percent(current.occ)+'. Karşılaştırma aynı otel seçimine göre hesaplandı.','Occupancy was '+percent(previous.occ)+' in the previous week and '+percent(current.occ)+' in the selected week, using the same property selection.');
    value=changeText('occ',current.occ,previous.occ); evidence=translate('Haftalık değişim','Week-on-week change');
  }
  byId('ai-answer').innerHTML='<div class="kicker">✧ &nbsp; QUBI AI / '+translate('ÖRNEK YANIT','SAMPLE ANSWER')+'</div><h3>'+heading+'</h3><p>'+description+'</p><div class="evidence"><strong>'+value+'</strong><span>'+evidence+'</span></div>';
}
function render() {
  const current=summarise(state.property,state.week), previous=summarise(state.property,state.week-1);
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  byId('dash-body').hidden=state.mode!=='dashboard';
  byId('ai-body').hidden=state.mode!=='ai';
  if(state.mode==='ai') {
    document.querySelectorAll('[data-question]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.question)===state.question)));
    renderAnswer(current,previous);
    return;
  }
  document.querySelectorAll('[data-metric]').forEach(button=>{
    const key=button.dataset.metric;
    button.setAttribute('aria-pressed',String(state.metric===key));
    button.querySelector('[data-value]').textContent=metrics[key].format(current[key]);
    const change=button.querySelector('[data-change]');
    change.textContent=changeText(key,current[key],previous[key])+translate(' · haftalık',' · week on week');
    change.classList.toggle('down',current[key]<previous[key]);
  });
  byId('channel-bars').innerHTML=channels.map((name,i)=>{
    const share=100*current.mix[i]/current.sold;
    return '<div class="chan"><div><span>'+name+'</span><b>'+percent(share)+'</b></div><span class="chan-track"><i style="--bar:'+colors[i]+';width:'+share+'%"></i></span></div>';
  }).join('');
  renderChart(current,previous);
}
function setMenu(open) {
  byId('menu').setAttribute('aria-expanded',String(open));
  byId('nav').classList.toggle('open',open);
}
byId('menu').addEventListener('click',()=>setMenu(!byId('nav').classList.contains('open')));
document.querySelectorAll('.head a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && byId('nav').classList.contains('open')) {setMenu(false);byId('menu').focus();}
});
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{
  const dialog=byId('dialog-'+b.dataset.open);
  dialog.showModal(); document.body.classList.add('has-dialog');
}));
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>document.body.classList.remove('has-dialog'));
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const rect=dialog.getBoundingClientRect();
    if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();
  });
});
questions.forEach((question,i)=>{
  const b=document.createElement('button'); b.type='button'; b.className='prompt'; b.dataset.question=String(i); b.textContent=question;
  b.addEventListener('click',()=>{state.question=i; render();}); byId('prompts').append(b);
});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;render();}));
document.querySelectorAll('[data-metric]').forEach(b=>b.addEventListener('click',()=>{state.metric=b.dataset.metric;render();}));
byId('property').addEventListener('change',e=>{state.property=e.target.value;render();});
byId('week').addEventListener('change',e=>{state.week=Number(e.target.value);render();});
document.querySelectorAll('[data-open-ai], nav a[href="#platform"]').forEach(link => link.addEventListener('click', () => { state.mode = 'ai'; render(); }));
renderHero();render();
new ResizeObserver(entries=>{
  if(entries[0].contentRect.width>0 && state.mode==='dashboard')renderChart(summarise(state.property,state.week),summarise(state.property,state.week-1));
}).observe(byId('chart'));

const gallery = document.querySelector('.hero-gallery');
const controls = document.querySelector('.gallery-controls');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const slideCount = gallery.children.length;
const heroTitle = byId('hero-title');
const heroDescription = document.querySelector('.hero-copy > p');
const heroSlides = [
  [heroTitle.firstChild.textContent, heroTitle.querySelector('em').textContent, heroDescription.textContent],
  [
    translate('Soruyu siz sorun.', 'Ask your question.'),
    translate('Veri sizde kalsın.', 'Keep data local.'),
    translate('“Ekimde hangi otelde daha fazla oda sattık?” QUBI AI sorunuzu kurumunuzdaki dil modeliyle yorumlar. Otel verileriniz bulut yapay zekâ servislerine gönderilmez.', '“Which hotel sold the most rooms in October?” QUBI AI interprets your question with a language model running in your own environment. Your hotel data stays off cloud AI services.')
  ],
  [
    translate('Oda geliri', 'Room revenue'),
    translate('neden arttı?', 'is up. Why?'),
    translate('Daha çok oda mı sattınız, yoksa odaları daha yüksek fiyata mı sattınız? Satılan geceleme, ortalama oda fiyatı ve oda gelirini geçen yılın aynı dönemiyle karşılaştırın.', 'Did you sell more room nights, or did guests pay a higher rate? Compare room nights sold, average daily rate and room revenue with the same period last year.')
  ],
  [
    translate('Misafirleriniz', 'Where do guests'),
    translate('nereden geliyor?', 'book their stay?'),
    translate('Doğrudan rezervasyonları ve acente satışlarını konaklama tarihine göre inceleyin. En çok geceleme getiren kanalla en yüksek oda fiyatını sağlayan kanalı yan yana görün.', 'Compare direct and agency bookings by stay date. See which channel fills the most room nights and which earns the highest average room rate.')
  ],
  [
    translate('Tek grup.', 'One group.'),
    translate('Farklı oteller.', 'Different hotels.'),
    translate('Grubun doluluk ortalaması yükselirken hangi tesis geride kaldı? Aynı hafta için otellerin doluluk ve oda gelirlerini karşılaştırın, ardından ilgilendiğiniz tesisin günlük sonuçlarına inin.', 'Group occupancy is rising, but is every property keeping pace? Compare occupancy and room revenue across hotels for the same week, then explore daily results for one property.')
  ]
];
let slide = 0;
let rotating = !motion.matches;
let timer;
function showSlide(step) {
  slide = (slide + step + slideCount) % slideCount;
  gallery.style.transform = 'translateX(-' + slide * 100 + '%)';
  const [opening, emphasis, description] = heroSlides[slide];
  heroTitle.firstChild.textContent = opening;
  heroTitle.querySelector('em').textContent = emphasis;
  heroDescription.textContent = description;
}
function syncRotation() {
  clearInterval(timer);
  const button = byId('slide-play');
  button.textContent = rotating ? 'Ⅱ' : '▷';
  button.setAttribute('aria-label', rotating ? translate('Slaytları duraklat','Pause slideshow') : translate('Slaytları oynat','Play slideshow'));
  if (rotating && !document.hidden) timer = setInterval(() => showSlide(1), 10000);
}
controls.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => {
  rotating = false;
  showSlide(Number(button.dataset.slide));
  syncRotation();
}));
byId('slide-play').addEventListener('click', () => { rotating = !rotating; syncRotation(); });
motion.addEventListener('change', () => { rotating = !motion.matches; syncRotation(); });
document.addEventListener('visibilitychange', syncRotation);
controls.hidden = false;
syncRotation();
