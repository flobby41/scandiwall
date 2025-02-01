document.addEventListener('DOMContentLoaded', renderProducts);

async function renderProducts() {
  const tableBody = document.getElementById("product-table-body");
  
  try {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Laddar...</td></tr>';

    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const products = await response.json();
    
    tableBody.innerHTML = "";
    
    products.forEach((product, index) => {
      const row = createTableRow(product, index % 2 === 0);
      tableBody.appendChild(row);
    });
    
  } catch (error) {
    console.error("Fel vid hämtning av produkter:", error);
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-600">Kunde inte ladda produkterna</td></tr>';
  }
}

function createTableRow(product) {
  const row = document.createElement("tr");
  row.classList.add("border-b");

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const cells = [
    { text: product.id, class: "border-r border-black px-3 py-2" },
    { text: product.name, class: "border-r border-black px-3 py-2" },
    { text: product.price + ' kr', class: "border-r border-black px-3 py-2" },
    { text: product.stock_quantity, class: "border-r border-black px-3 py-2" },
    { text: product.image, class: "border-r border-black px-3 py-2" },
    { text: product.category || '-', class: "border-r border-black px-3 py-2" },
    { text: formatDate(product.created_at), class: "border-r border-black px-3 py-2" },
    { 
      html: `
        <div class="flex justify-center gap-2">
          <a href="/admin/products/edit/${product.id}" class="text-black px-1 edit-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </a>
          <button class="text-black px-1 delete-btn" data-id="${product.id}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      `,
      class: "text-center px-3 py-2",
      onClick: (e) => {
        if (e.target.closest('.delete-btn')) {
          e.preventDefault();
          handleDelete(e, product.id);
        }
      }
    }
  ];

  cells.forEach(cell => {
    const td = document.createElement("td");
    td.className = cell.class;
    if (cell.html) {
      td.innerHTML = cell.html;
      if (cell.onClick) {
        td.querySelector('button').addEventListener('click', cell.onClick);
      }
    } else {
      td.textContent = cell.text;
    }
    row.appendChild(td);
  });

  return row;
}


async function handleDelete(event, id) {
  event.preventDefault();
  
  if (!confirm('Är du säker på att du vill radera denna produkt?')) {
    return;
  }

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await renderProducts();
    
  } catch (error) {
    console.error("Fel vid radering av produkt:", error);
    alert("Kunde inte radera produkten. Försök igen senare.");
  }
}
