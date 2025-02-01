function toggleFilterMenu() {
    const filterMenu = document.getElementById('filter-dropdown');
    filterMenu.classList.toggle('hidden');
  }

  document.addEventListener('DOMContentLoaded', function() {
    const filterButton = document.getElementById('filter-button');
    filterButton.addEventListener('click', toggleFilterMenu);
  });
