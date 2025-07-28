const hr1 = document.getElementById('hr-1');
const hr2 = document.getElementById('hr-2');
const mn1 = document.getElementById('mn-1');
const mn2 = document.getElementById('mn-2');

setInterval(()=> {
  const dd = new Date();
  const HH = dd.getHours();
  const hh = HH < 13? HH: HH - 12;
  const h1 = hh > 9 && hh < 13 ? 1: 0;
  const h2 = hh < 10? hh: hh.toString()[1];
  const mm = dd.getMinutes();
  const m1 = mm < 10? 0: mm.toString()[0];
  const m2 = mm < 10? mm: mm.toString()[1];
  mn1.setAttribute('data-digit', m1);
  mn2.setAttribute('data-digit', m2);
  hr1.setAttribute('data-digit', h1);
  hr2.setAttribute('data-digit', h2);
}, 1000)