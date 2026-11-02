(() => {
  const form = document.getElementById('enquiry');
  const button = document.getElementById('enquiry-submit');
  const caption = button.querySelector('span');
  const status = document.getElementById('enquiry-status');
  const checkBox = document.getElementById('enquiry-check');
  const en = document.documentElement.lang === 'en';
  const t = (tr, english) => en ? english : tr;
  const endpoint = '/api/contact';
  let mode = 'loading', widget, token = '', sending = false;
  const say = (message, state = '') => { status.textContent = message; status.dataset.state = state; };
  const ready = () => { button.disabled = sending || (mode !== 'draft' && (mode !== 'direct' || !token)); };
  const sendLabel = t('Mesajı gönder', 'Send message');

  function useDraft() {
    mode = 'draft';
    caption.textContent = t('E-posta taslağı aç', 'Open email draft');
    say(t('Doğrudan gönderim şu anda kapalı. Mesajınızı bir e-posta taslağı olarak açabilirsiniz.',
          'Direct sending is currently unavailable. You can open your message as an email draft.'));
    ready();
  }

  async function activate() {
    let config;
    try {
      const response = await fetch(endpoint, {headers:{Accept:'application/json'}, cache:'no-store', signal:AbortSignal.timeout(6000)});
      config = response.ok && response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
    } catch { /* A static preview has no sending service. */ }
    if (!config?.siteKey) { useDraft(); return; }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const loadingTimer = setTimeout(useDraft, 12000);
    script.onerror = () => { clearTimeout(loadingTimer); useDraft(); };
    script.onload = () => {
      clearTimeout(loadingTimer);
      if (mode === 'draft') return;
      try {
        mode = 'direct';
        caption.textContent = sendLabel;
        say(t('Göndermek için güvenlik doğrulamasını bekleyin.', 'Please wait for the security check before sending.'));
        widget = window.turnstile.render(checkBox, {
          sitekey:config.siteKey, action:'contact', language:en?'en':'tr',
          size:form.clientWidth < 345 ? 'compact' : 'normal',
          callback: value => { token=value; if(status.dataset.state !== 'success' && status.dataset.state !== 'error') say(''); ready(); },
          'expired-callback': () => { token=''; ready(); },
          'error-callback': () => {
            token=''; ready();
            say(t('Güvenlik doğrulaması tamamlanamadı. Sayfayı yenileyebilir veya doğrudan e-posta yazabilirsiniz.',
                  'The security check could not finish. Reload the page or contact us by email.'),'error');
          }
        });
      } catch { useDraft(); }
    };
    document.head.append(script);
  }

  document.querySelectorAll('[data-enquire]').forEach(link => link.addEventListener('click', () => {
    form.elements.product.value = link.dataset.enquire;
    link.closest('dialog').close();
    form.elements.name.focus({preventScroll:true});
  }));
  form.addEventListener('input', event => {
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
    if (status.dataset.state === 'success') say('');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || button.disabled) return;
    const data = Object.fromEntries(new FormData(form));
    for (const field of ['name','email','message']) {
      data[field] = data[field].trim();
      if (!data[field]) {
        form.elements[field].setCustomValidity(t('Bu alanı doldurun.', 'Fill in this field.'));
        form.elements[field].reportValidity(); return;
      }
    }
    if (mode === 'draft') {
      const product = form.elements.product.selectedOptions[0].textContent;
      const message = data.name+' <'+data.email+'>\n\n'+data.message;
      window.location.href = 'mailto:admin@quadno.com?subject='+encodeURIComponent('Quadno | '+product)+'&body='+encodeURIComponent(message);
      return;
    }
    if (mode !== 'direct' || !token) return;
    sending = true; ready();
    const fields = [form.elements.name, form.elements.email, form.elements.product, form.elements.message];
    fields.forEach(field => { field.disabled=true; });
    caption.textContent=t('Gönderiliyor…','Sending…');
    say('');
    try {
      const response = await fetch(endpoint, {
        method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({name:data.name,email:data.email,product:data.product,message:data.message,token}),
        signal:AbortSignal.timeout(32000)
      });
      const result = await response.json();
      if (response.status===202 && result.accepted===true) {
        form.reset();
        say(t('Teşekkürler. Mesajınız ekibimize iletilmek üzere kabul edildi.',
              'Thank you. Your message has been accepted for delivery to our team.'),'success');
      } else if (result.error==='challenge' || result.error==='challenge_unavailable') {
        say(t('Güvenlik doğrulaması tamamlanamadı. Doğrulama yenilendikten sonra tekrar deneyin.',
              'The security check could not finish. Try again after it refreshes.'),'error');
      } else if (result.error==='fields') {
        say(t('Adınızı, e-posta adresinizi ve mesajınızı kontrol edin.', 'Check your name, email address and message.'),'error');
      } else { throw new Error('Unconfirmed submission'); }
    } catch {
      say(t('Gönderim doğrulanamadı. Mesajınız formda duruyor. Dilerseniz doğrudan admin@quadno.com adresine yazın.',
            'Sending could not be confirmed. Your message is still here. You can also email admin@quadno.com directly.'),'error');
    } finally {
      sending=false; token=''; fields.forEach(field=>{field.disabled=false;});
      caption.textContent=sendLabel; ready();
      if (widget !== undefined) window.turnstile.reset(widget);
    }
  });
  if ('IntersectionObserver' in window) {
    const nearby = new IntersectionObserver(entries => {
      if (entries.some(entry=>entry.isIntersecting)) { nearby.disconnect(); activate(); }
    }, {rootMargin:'400px'});
    nearby.observe(form);
  } else { activate(); }
})();
