(function(){
  var root=document.documentElement, btn=document.getElementById('theme');
  function cur(){return root.getAttribute('data-theme')==='dark'?'dark':'light';}
  function label(){
    var d=cur()==='dark';
    var text=d?btn.getAttribute('data-light'):btn.getAttribute('data-dark');
    btn.textContent=text;btn.setAttribute('aria-label',text);btn.setAttribute('data-mode',d?'dark':'light');
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#121214':'#FCFCFB');
  }
  if(btn){
    label();
    btn.addEventListener('click',function(){
      var n=cur()==='dark'?'light':'dark';
      if(n==='dark')root.setAttribute('data-theme','dark');else root.removeAttribute('data-theme');
      try{localStorage.setItem('theme',n);}catch(e){}
      label();
    });
  }

  var c=document.getElementById('copy'), st=document.getElementById('copy-status');
  if(c){
    c.addEventListener('click',function(){
      var m=c.getAttribute('data-mail');
      var ok=function(){st.textContent=c.getAttribute('data-ok');}, fail=function(){st.textContent=c.getAttribute('data-fail');};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(m).then(ok,fail);}else{fail();}
      setTimeout(function(){st.textContent='';},3000);
    });
  }

  document.querySelectorAll('.more-btn').forEach(function(b){
    b.addEventListener('click',function(){
      var open=b.getAttribute('aria-expanded')!=='true';
      b.setAttribute('aria-expanded',String(open));
      var panel=document.getElementById(b.getAttribute('aria-controls'));panel.classList.toggle('open',open);var inner=panel.firstElementChild;if(open){inner.removeAttribute('inert');}else{inner.setAttribute('inert','');}
    });
  });

  var links=[].slice.call(document.querySelectorAll('#toc a'));
  var toc=document.getElementById('toc');
  if(toc){toc.addEventListener('focusin',function(ev){var a=ev.target.closest('a');var nav=toc.closest('nav');if(a&&nav&&window.innerWidth<1024){nav.scrollLeft=Math.max(0,a.offsetLeft-20);}});}
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          links.forEach(function(a){
            var on=a.getAttribute('href')==='#'+e.target.id;
            a.setAttribute('aria-current',on?'true':'false');
            if(on&&window.innerWidth<1024&&a.scrollIntoView){
              var nav=a.closest('nav');if(nav){nav.scrollTo({left:a.offsetLeft-20,behavior:'smooth'});}
            }
          });
        }
      });
    },{rootMargin:'-35% 0px -60% 0px'});
    document.querySelectorAll('main section').forEach(function(s){io.observe(s);});
  }
})();
