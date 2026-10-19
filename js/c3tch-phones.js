// C3tch: корпус телефона с экраном открывает лайтбокс не только по клику, но и с клавиатуры (Enter / пробел).
document.querySelectorAll('.phone[data-lb-group]').forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.target !== el) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
  });
});
