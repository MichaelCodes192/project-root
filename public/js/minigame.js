document.addEventListener('DOMContentLoaded', () => {
  const cookie = document.getElementById('cookie');
  const scoreDisplay = document.getElementById('score');

  let score = parseInt(localStorage.getItem('score')) || 0;
  scoreDisplay.textContent = `Score: ${score}`;

  cookie.addEventListener('click', () => {
    score += 1;
    scoreDisplay.textContent = `Score: ${score}`;
    localStorage.setItem('score', score);
  });
});
