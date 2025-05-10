const numbers = [1, 49, 80, 5, 7, 11, 101];
let current = 0;

function randomPosition() {
  const x = Math.random() * 340;
  const y = Math.random() * 340;
  return { x, y };
}

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  numbers.forEach((num, idx) => {
    const div = document.createElement('div');
    div.className = 'number';
    div.textContent = num;
    const pos = randomPosition();
    div.style.left = pos.x + 'px';
    div.style.top = pos.y + 'px';
    div.onclick = () => handleClick(idx, div);
    board.appendChild(div);
  });
}

function handleClick(idx, el) {
  if (idx === current) {
    el.classList.add('correct');
    current++;
    if (current === numbers.length) {
      document.getElementById('message').textContent = '通关成功！';
    }
  } else {
    el.classList.add('wrong');
    setTimeout(() => el.classList.remove('wrong'), 500);
  }
}

renderBoard();