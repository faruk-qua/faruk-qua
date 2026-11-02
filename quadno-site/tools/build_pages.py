"""Generate the two static, independently indexable language editions."""
from pathlib import Path

DIST = Path(__file__).resolve().parents[1] / "dist"
ARROW = '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>'
DIAGONAL = '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M7 6h11v11"/></svg>'
PLAY = '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/></svg>'
WAVE = '<svg viewBox="0 0 35 23" width="30" height="20" aria-hidden="true" fill="none"><path d="m2 17 7-6 6 3L26 4l7 2M2 22l8-5 5 3 13-10 5 1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
PRODUCTS = [
    ("designer", "QUBI Designer", "qubi-designer", ("Rapor tasarımı", "Dashboard design"),
     ("Yöneticinin sorusunu yanıtlayan panoyu oluşturun. Göstergeleri, grafikleri ve filtreleri aynı raporda düzenleyin.", "Build a dashboard around a management question. Arrange metrics, charts and filters in one report."),
     [("Raporun kapsamını seçin","Choose the scope","Gelir, satılan oda ve geceleme gibi ölçüleri otel veya tarih kırılımına göre yerleştirin.","Group measures such as revenue, rooms sold and room nights by property or date."),
      ("Görünümü tasarlayın","Design the view","Bir eğilimi çizgi grafikle, oteller arası farkı tabloyla gösterin. İhtiyaç duyulan filtreleri panoya ekleyin.","Plot a trend as a line, show differences between properties in a table and add the filters your team needs."),
      ("Ekibin kullanımına sunun","Put the dashboard to work","Hazırlanan panoyu QUBI Viewer üzerinden yetkili kullanıcıların takip edebileceği biçimde sunun.","Make the finished dashboard available to authorised users through QUBI Viewer.")]),
    ("viewer", "QUBI Viewer", "qubi-viewer", ("Performans analizi","Performance analysis"),
     ("Pano üzerinde otel, tarih ve kanal seçin. Veriyi inceleyin veya QUBI AI ile bir yönetim sorusu sorun.","Filter a dashboard by property, date and channel. Explore the figures or ask a management question with QUBI AI."),
     [("Dönemi karşılaştırın","Compare periods","Doluluk, oda geliri ve ortalama fiyatı seçtiğiniz tarih aralığında izleyin.","Track occupancy, room revenue and average rate over the dates you select."),
      ("Satışın kaynağını görün","Explore the source of sales","Satış kanalı kırılımında oda gecelerini inceleyin ve oteller arasındaki dağılımı karşılaştırın.","Review room nights by sales channel and compare the mix across properties."),
      ("QUBI AI ile sorgulayın","Ask with QUBI AI","Örneğin, belirli bir ayda satılan oda sayısını otellere göre sorun. Sonucu ilgili panonun bağlamında inceleyin.","Ask for rooms sold by property in a given month, for example, and review the result in its dashboard context.")]),
    ("doorlock", "Doorlock", "doorlock", ("Otel operasyonu","Hotel operations"),
     ("Otel kapı kilitlerine yönelik Quadno çözümü. Tesisinizdeki kilit altyapısını ve kullanım senaryosunu birlikte değerlendirelim.","Quadno’s solution for hotel door locks. Discuss your existing lock infrastructure and the way your property operates."),
     [("Mevcut sistemi tanımlayın","Describe your current system","Görüşme öncesinde kullandığınız kilit marka ve modelini, mevcut kart altyapısını ve tesis sayısını paylaşabilirsiniz.","For the initial discussion, share your lock make and model, current card infrastructure and property count."),
      ("Operasyon akışını görüşelim","Review the workflow","Resepsiyonun ve teknik ekibin hangi işlemleri yürüttüğünü, nerede desteğe ihtiyaç duyduğunuzu birlikte ele alalım.","Map the tasks handled by your front desk and technical team and identify where support is needed."),
      ("Tesis için kapsam belirleyelim","Define the property scope","Teknik uygunluğu ve uygulanabilir kapsamı tesis bilgilerinize göre değerlendirelim.","Review technical suitability and define the scope based on your property’s requirements.")])
]

def page(en):
    def t(tr,eng): return eng if en else tr
    base='../' if en else ''
    assets=base+'assets/'
    lang=t('tr','en')
    switch='../index.html' if en else 'en/index.html'
    email='admin@quadno.com'
    nav=[('platform','QUBI AI'),('products',t('Ürünler','Products')),('company',t('Şirket','Company'))]
    navlinks=''.join(f'<a href="#{i}">{n}</a>' for i,n in nav)
    cards=[]; dialogs=[]
    for i,(key,name,logo,category,description,sections) in enumerate(PRODUCTS,1):
        cards.append(f'''<article class="product-card">
          <div class="card-art"><img src="{assets}{key}-art.svg" loading="lazy" width="410" height="174" alt=""><span class="card-no">Q / 0{i}</span></div>
          <div class="card-info"><div class="card-eyebrow"><img src="{assets}{logo}.svg" width="36" height="36" alt=""><span>{t(*category)}</span></div>
          <h3>{name}</h3><p>{t(*description)}</p><button class="text-button" type="button" data-open="{key}" aria-haspopup="dialog">{t('Ürünü incele','Explore product')} {ARROW}</button></div></article>''')
        blocks=''.join(f'<li><h3>{t(a,b)}</h3><p>{t(c,d)}</p></li>' for a,b,c,d in sections)
        dialogs.append(f'''<dialog id="dialog-{key}" aria-labelledby="dialog-title-{key}">
          <div class="dialog-bar"><span class="kicker">{t('Ürün dosyası','Product profile')} / 0{i}</span><button class="close" type="button" data-close aria-label="{t('Kapat','Close')}">×</button></div>
          <img class="dialog-logo" src="{assets}{logo}.svg" width="54" height="54" alt=""><h2 id="dialog-title-{key}">{name}</h2><p class="dialog-intro">{t(*description)}</p>
          <ol class="detail-list">{blocks}</ol><a class="btn primary" href="#contact" data-enquire="{key}">{t('Ürün hakkında yazın','Enquire about this product')} {DIAGONAL}</a></dialog>''')
    title=t('Quadno Teknoloji | Otelcilik için iş zekâsı','Quadno Technology | Business intelligence for hospitality')
    desc=t('QUBI ile doluluk, oda geliri, ortalama oda fiyatı ve satış kanallarını inceleyin. Quadno’nun otelcilik yazılımlarını etkileşimli örnek verilerle keşfedin.','Explore occupancy, room revenue, average daily rate and sales channels with QUBI. Discover Quadno hospitality software with an interactive sample portfolio.')
    return f'''<!doctype html>
<html lang="{lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{title}</title><meta name="description" content="{desc}">
<!-- Resort photograph: Mikhail Nilov / Pexels, photo 9400988. Lobby photograph: Pexels, photo 8918652. Used under the Pexels License. -->
<meta name="theme-color" content="#092934"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="website">
<link rel="alternate" hreflang="tr" href="{base}index.html"><link rel="alternate" hreflang="en" href="{base}en/index.html"><link rel="icon" href="{assets}quadno.svg" type="image/svg+xml">
<link rel="preload" href="{assets}manrope.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="{assets}site.css"><script src="{assets}site.js" defer></script><script src="{assets}contact.js" defer></script></head>
<body id="top"><a class="skip" href="#main">{t('İçeriğe geç','Skip to content')}</a>
<header><div class="wrap head"><a class="home" href="#top" aria-label="{t('Quadno ana sayfa','Quadno home')}"><img src="{assets}quadno-header.svg" class="header-logo" width="56" height="56" alt="Quadno"></a>
<nav id="nav" aria-label="{t('Ana menü','Main navigation')}">{navlinks}</nav>
<a class="language" hreflang="{t('en','tr')}" href="{switch}" aria-label="{t('Switch to English','Türkçe sürüme geç')}"><svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg> {t('EN','TR')}</a>
<a class="nav-contact" href="#contact">{t('İletişim','Contact')} {DIAGONAL}</a><button class="menu" id="menu" type="button" aria-label="{t('Menü','Menu')}" aria-controls="nav" aria-expanded="false"><span></span><span></span></button></div></header>
<main id="main">
<section class="hero" aria-labelledby="hero-title"><div class="hero-gallery" aria-hidden="true"><picture><source media="(max-width:620px)" srcset="{assets}resort-mobile.webp"><img src="{assets}resort.webp" width="1700" height="950" alt="" fetchpriority="high"></picture><picture><img src="{assets}lobby.webp" alt="" decoding="async"></picture></div><div class="hero-shade"></div><div class="wrap hero-content">
  <div class="hero-copy"><div class="hero-kicker"><span></span>{t('QUBI AI · OTEL ANALİZİ','QUBI AI · HOTEL ANALYTICS')}</div>
  <h1 id="hero-title">{t('Otelinizde bugün','What changed at')}<br><em>{t('ne değişti?','your hotel today?')}</em></h1>
  <p>{t('Otel verileriniz kurumunuzda kalır. QUBI AI, sorunuzu yerel dil modeliyle yorumlar. Gelir, doluluk ve satış kanalı analizlerini örnek verilerle keşfedin.','Your hotel data stays in your environment. QUBI AI interprets questions with a local language model. Explore revenue, occupancy and channel analysis with sample data.')}</p>
  <div class="hero-actions"><a class="btn primary" data-open-ai href="#platform">{PLAY} {t('QUBI AI’ı deneyin','Try QUBI AI')}</a><a class="hero-link" href="#products">{t('Ürünlerimiz','Our products')} {ARROW}</a></div></div>
  <div class="hero-stat" aria-label="{t('Örnek portföy göstergesi','Sample portfolio indicator')}"><div><span class="mini-dot"></span>{t('ÖRNEK PORTFÖY','SAMPLE PORTFOLIO')}</div><p>{t('Haftalık doluluk','Weekly occupancy')}</p><div class="hero-stat-value"><b id="hero-value">{t("%81,6","81.6%")}</b><svg viewBox="0 0 112 39" aria-hidden="true"><path id="hero-line" d="M2 32L19 28 37 30 55 20 73 22 91 9 109 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg></div><small id="hero-delta">{t("+4,5 puan · önceki haftaya göre","+4.5 pp · vs previous week")}</small></div>
  <div class="hero-foot"><div class="gallery-controls" hidden role="group" aria-label="{t('Fotoğraf slaytları','Photo slideshow')}"><button type="button" data-slide="-1" aria-label="{t('Önceki görsel','Previous image')}">‹</button><span id="slide-caption">01 / 02 · {t('Otel manzarası','Resort view')}</span><button type="button" data-slide="1" aria-label="{t('Sonraki görsel','Next image')}">›</button><button type="button" id="slide-play"></button></div><a href="#platform" aria-label="{t('Platforma ilerle','Go to platform')}">↓</a></div>
</div></section>
<section class="workspace section wrap" id="platform"><div class="section-lead"><div><div class="kicker"><b>01</b><i></i>{t('QUBI PLATFORMU','QUBI PLATFORM')}</div><h2>{t('Bu hafta gelir nasıl değişti?','How did revenue change this week?')}</h2></div>
<p>{t('Bir otel ve hafta seçin. Göstergeler arasından seçim yaparak günlük sonuçları karşılaştırın veya QUBI AI’a örnek bir soru sorun.','Choose a property and a week. Select a metric to compare daily results, or ask QUBI AI a sample question.')}</p></div>
<div class="console" id="console"><div class="console-bar"><div class="console-brand">{WAVE}<strong>QUBI</strong><i></i><span>{t('Yönetim merkezi','Management workspace')}</span></div><span class="sample-badge"><i></i>{t('Örnek veri','Sample data')}</span></div>
<div class="toolbar"><div class="modes" role="group" aria-label="{t('Görünüm','View')}"><button type="button" data-mode="dashboard" aria-pressed="false"><span aria-hidden="true">▦</span>{t('Yönetim panosu','Dashboard')}</button><button type="button" data-mode="ai" aria-pressed="true"><span aria-hidden="true">✧</span>QUBI AI</button></div>
<div class="filters"><label>{t('Otel','Property')}<select id="property"><option value="all">{t('Tüm oteller','All properties')}</option><option value="coast">{t('Sahil Oteli','Coastal Hotel')}</option><option value="city">{t('Şehir Oteli','City Hotel')}</option></select></label>
<label>{t('Dönem','Period')}<select id="week"><option value="2">{t('19–25 Ekim','19–25 Oct')}</option><option value="1">{t('12–18 Ekim','12–18 Oct')}</option></select></label></div></div>
<div id="dash-body" hidden><div class="metrics" role="group" aria-label="{t('Grafik göstergesi','Chart metric')}">
{''.join(f'<button type="button" class="metric" data-metric="{k}" aria-pressed="{str(k=="occ").lower()}"><span class="metric-name">{t(tr,eng)}</span><strong data-value>—</strong><small data-change>—</small></button>' for k,tr,eng in [('occ','Oda doluluğu','Occupancy'),('rev','Oda geliri','Room revenue'),('adr','Ortalama oda fiyatı','Average daily rate')])}
</div><div class="dash-lower"><div class="trend"><div class="chart-title"><h3 id="chart-title">{t('Günlük doluluk','Daily occupancy')}</h3><div class="legend"><span>{t('Seçili hafta','Selected week')}</span><span>{t('Önceki hafta','Previous week')}</span></div></div>
<div id="chart" class="chart" role="img"></div><details class="values"><summary>{t('Günlük değerleri göster','Show daily values')}</summary><div id="day-table"></div></details></div>
<div class="channels"><h3>{t('Satış kanalları','Sales channels')}</h3><p>{t('Satılan oda gecesindeki pay','Share of room nights sold')}</p><div id="channel-bars"></div></div></div></div>
<div id="ai-body"><div class="ai-questions"><div class="kicker">QUBI AI</div><h3>{t('Yönetim soruları','Management questions')}</h3><p>{t('Seçtiğiniz dönem ve otel üzerinden ilerleyin.','Explore your selected period and property.')}</p><div id="prompts"></div></div><div class="ai-answer" aria-live="polite" id="ai-answer"></div></div>
<div class="console-foot"><span class="mini-dot"></span>{t('Demo ortamı · Kurgusal veriler · Ekim 2026','Demo workspace · Fictional data · October 2026')}</div><noscript><p>{t('Etkileşimli demo için JavaScript’i etkinleştirin.','Enable JavaScript to use the interactive demo.')}</p></noscript></div>
</section>
<section class="local-ai" aria-labelledby="local-title"><div class="wrap section">
<div class="kicker">QUBI AI · {t('YEREL DİL MODELİ','LOCAL LANGUAGE MODEL')}</div>
<h2 id="local-title">{t('Sorunuzdan rapora, kendi altyapınızda.','From question to report, on your infrastructure.')}</h2>
<p class="local-intro">{t('QUBI AI, otel verilerini analiz etmek için buluttaki bir yapay zekâ servisine açmaz. Soruyu yorumlayan dil modeli kurumun kendi ortamında çalışır. Raporun rakamlarını ise QUBI veri modeli hesaplar.','QUBI AI analyses hotel data without sending it to a cloud AI service. The language model that interprets the question runs in your own environment. The QUBI data model calculates the figures in the report.')}</p>
<div class="local-steps">
<article><span>01</span><h3>{t('Soruyu yorumlar','Interpret the question')}</h3><p>{t('“Ekim ayında otel bazında kaç oda gecesi sattık?” sorusunda yerel model, ölçü olarak satılan oda gecesini, gruplama olarak oteli ve dönem olarak ekim ayını belirler.','For “How many room nights did we sell at each hotel in October?”, the local model identifies room nights as the measure, hotel as the grouping and October as the period.')}</p></article>
<article><span>02</span><h3>{t('Yetkili veriyi sorgular','Query authorised data')}</h3><p>{t('Bu seçimler QUBI raporlama modeline uygulanır. Sorgu, kullanıcının erişebildiği rapor ve otel kapsamındaki verilerle çalışır. Gelir ve doluluk gibi ölçüler mevcut rapor tanımlarına göre hesaplanır.','QUBI applies these selections to its reporting model. The query runs within the reports and properties the user can access. Measures such as revenue and occupancy follow the definitions used in existing reports.')}</p></article>
<article><span>03</span><h3>{t('Sonucu bağlamıyla gösterir','Read the result in context')}</h3><p>{t('Otel bazındaki sonuçları seçtiğiniz dönemle birlikte inceleyebilirsiniz. Bir değişimi araştırırken aynı ölçüyü önceki dönemle karşılaştırabilir veya satış kanalı bazında yeniden sorabilirsiniz.','Read the results by property alongside the selected period. To investigate a change, compare the same measure with an earlier period or ask for a breakdown by sales channel.')}</p></article>
</div><p class="local-note">{t('Sitedeki demo, kurgusal otel verileriyle tarayıcınızda çalışır. Örnek soruların yanıtlarını görmek için oteli veya haftayı değiştirin.','The website demo runs in your browser using fictional hotel data. Change the property or week to explore answers to the sample questions.')}</p>
</div></section>
<section class="products-section" id="products"><div class="wrap section"><div class="section-lead"><div><div class="kicker"><b>02</b><i></i>{t('ÜRÜN AİLESİ','PRODUCT SUITE')}</div><h2>{t('Tasarım, analiz ve operasyon.','Design, analysis and operations.')}</h2></div><p>{t('Raporu hazırlayan analistten onu sabah toplantısında kullanan yöneticiye, her rol için farklı bir araç.','From the analyst building a report to the manager using it at a morning briefing, each role has a different tool.')}</p></div><div class="cards">{''.join(cards)}</div></div></section>
<section class="company section wrap" id="company"><figure><img src="{assets}lobby.webp" width="900" height="700" alt="{t('Aydınlatılmış resepsiyon ve otel lobisi','A softly lit hotel lobby and reception area')}" loading="lazy"></figure>
<div class="company-copy"><div class="kicker"><b>03</b><i></i>{t('QUADNO HAKKINDA','ABOUT QUADNO')}</div><h2>{t('Otelin çalışma biçiminden yola çıkıyoruz.','Software shaped by the way hotels work.')}</h2>
<p>{t('Quadno Teknoloji A.Ş., konaklama sektörü için yazılım geliştirir. Bir resepsiyon ekibi için gün, giriş yapacak odalarla başlar. Gelir yöneticisi aynı güne satılan oda ve ortalama fiyat üzerinden bakar.','Quadno Teknoloji A.Ş. develops software for hospitality. A front desk team starts the day with arriving rooms. A revenue manager looks at that same day through rooms sold and average rate.')}</p>
<p>{t('QUBI, bu farklı soruları ortak bir veri modeli üzerinde bir araya getirir. Designer raporun nasıl hazırlanacağını, Viewer ise yetkili ekiplerin o raporu nasıl inceleyeceğini belirler.','QUBI brings those questions together in a shared data model. Designer shapes the report, while Viewer gives authorised teams a way to explore the results.')}</p>
<a class="text-button" href="#contact">{t('Ekibimizle görüşün','Speak to our team')} {ARROW}</a></div></section>
<section class="contact" id="contact" aria-labelledby="contact-title"><div class="wrap contact-inner">
<div class="contact-copy"><div class="kicker"><i></i>{t('İLETİŞİM','GET IN TOUCH')}</div><h2 id="contact-title">{t('Oteliniz için konuşalım.','Let’s talk about your hotel.')}</h2>
<p>{t('Görmek istediğiniz raporu veya tesisinizdeki ihtiyacı anlatın. Ekibimiz size bıraktığınız e-posta adresinden ulaşabilir.','Tell us about the report you need or the workflow you want to improve. Our team can reply to the email address you provide.')}</p>
<a class="contact-mail" href="mailto:{email}">{email} {DIAGONAL}</a></div>
<form class="enquiry" id="enquiry" method="post" action="/api/contact" aria-labelledby="enquiry-title">
<h3 id="enquiry-title">{t('Ekibe mesaj yazın','Write to our team')}</h3>
<div class="enquiry-row">
<label>{t('Adınız ve soyadınız','Full name')}<input id="enquiry-name" name="name" autocomplete="name" required maxlength="100"></label>
<label>{t('E-posta adresiniz','Your email')}<input name="email" type="email" autocomplete="email" required maxlength="254"></label></div>
<label>{t('İlgilendiğiniz ürün','Product of interest')}<select name="product" id="enquiry-product"><option value="general">{t('Genel bilgi','General enquiry')}</option>
{''.join(f'<option value="{product[0]}">{product[1]}</option>' for product in PRODUCTS)}<option value="ai">QUBI AI</option></select></label>
<label>{t('Mesajınız','Your message')}<textarea name="message" rows="4" required maxlength="3000" placeholder="{t('Otelinizde hangi sorunu çözmek istiyorsunuz?','What would you like to improve at your hotel?')}"></textarea></label>
<div id="enquiry-check"></div><p id="enquiry-status" class="enquiry-status" role="status" aria-live="polite"></p>
<button type="submit" class="btn primary" id="enquiry-submit" disabled><span>{t('Gönder','Send message')}</span>{ARROW}</button>
<noscript><p>{t('Form için JavaScript’i etkinleştirin veya doğrudan e-posta gönderin.','Enable JavaScript to use the form, or email us directly.')}</p></noscript>
</form></div></section>
</main><footer><div class="wrap footer-inner"><img src="{assets}quadno.svg" alt="Quadno" width="42" height="42"><span>© 2026 Quadno Teknoloji A.Ş.</span><a href="#top">{t('Başa dön','Back to top')} ↑</a></div></footer>
{''.join(dialogs)}</body></html>'''

for en in (False,True):
    dest=DIST / ('en/index.html' if en else 'index.html')
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(page(en),encoding='utf-8')
