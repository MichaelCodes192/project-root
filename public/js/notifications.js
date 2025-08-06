async function fetchNotifCount() {
  const res = await fetch('/api/notifications/count');
  const data = await res.json();
  const countSpan = document.getElementById('notif-count');
  if (data.count > 0) {
    countSpan.style.display = 'inline-block';
    countSpan.textContent = data.count;
  } else {
    countSpan.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchNotifCount();

  // Optionally refresh every minute
  setInterval(fetchNotifCount, 60000);
});
