/* === Video Codecs Course: Navigation & Progress === */

;(function() {
  'use strict';

  const LS_KEY = 'video-codecs-completed';
  const TOTAL_LESSONS = 6;
  const DRAWER_STATE_KEY = 'video-codecs-drawer';

  function getCompletions() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || {};
    } catch { return {}; }
  }

  function setComplete(lesson, val) {
    const c = getCompletions();
    c[lesson] = val;
    localStorage.setItem(LS_KEY, JSON.stringify(c));
    updateUI();
  }

  function isComplete(lesson) {
    return getCompletions()[lesson] === true;
  }

  function updateUI() {
    const total = TOTAL_LESSONS;
    const done = Object.values(getCompletions()).filter(Boolean).length;
    const pct = total > 0 ? (done / total) * 100 : 0;

    // Progress bar
    const fill = document.querySelector('.progress-bar-fill');
    if (fill) fill.style.width = pct + '%';

    // Lesson checkmarks
    document.querySelectorAll('.lesson-check').forEach(el => {
      const n = parseInt(el.dataset.lesson);
      if (isComplete(n)) el.classList.add('done');
      else el.classList.remove('done');
    });

    // Drawer progress text
    const pctText = document.querySelector('.drawer-progress-text');
    if (pctText) pctText.textContent = done + '/' + total + ' lessons';
  }

  // Drawer
  let drawerOpen = false;

  function openDrawer() {
    drawerOpen = true;
    document.querySelector('.lesson-drawer').classList.add('open');
    document.querySelector('.drawer-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    try { localStorage.setItem(DRAWER_STATE_KEY, 'open'); } catch {}
  }

  function closeDrawer() {
    drawerOpen = false;
    document.querySelector('.lesson-drawer').classList.remove('open');
    document.querySelector('.drawer-overlay').classList.remove('active');
    document.body.style.overflow = '';
    try { localStorage.setItem(DRAWER_STATE_KEY, 'closed'); } catch {}
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Menu button
    document.querySelector('.menu-btn').addEventListener('click', openDrawer);
    document.querySelector('.drawer-close').addEventListener('click', closeDrawer);
    document.querySelector('.drawer-overlay').addEventListener('click', closeDrawer);

    // Mark lesson completed
    const currentLesson = document.body.dataset.lesson;
    const completionBox = document.querySelector('.completion-box');
    if (completionBox && currentLesson) {
      const lessonNum = parseInt(currentLesson);
      if (isComplete(lessonNum)) {
        completionBox.classList.add('checked');
        completionBox.querySelector('.check-icon').textContent = '✓';
      }
      completionBox.addEventListener('click', function() {
        const nowComplete = !isComplete(lessonNum);
        setComplete(lessonNum, nowComplete);
        completionBox.classList.toggle('checked');
        completionBox.querySelector('.check-icon').textContent = nowComplete ? '✓' : '○';
      });
    }

    // Keyboard escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    });

    updateUI();
  });
})();
