/* Lucide-compatible inline SVG icons for the offline My Workout app. */
(function (root) {
  const paths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    external: '<path d="M7 17 17 7M7 7h10v10"/>',
    next: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
    previous: '<path d="M19 12H5m7 7-7-7 7-7"/>',
    share: '<path d="M12 16V4m-5 5 5-5 5 5"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>'
  };
  function svg(name, className = 'ui-icon') {
    const content = paths[name];
    if (!content) return '';
    return `<svg class="${className}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
  }
  root.WorkoutIcons = Object.freeze({ svg });
})(typeof window === 'undefined' ? globalThis : window);
