let sklepSelect = document.getElementById("centrala-ceny-sklep");
document.addEventListener("DOMContentLoaded", function () {
  function loadSklepy() {
    const token = localStorage.getItem("token");
    const decoded = parseJwt(token);
    const uzytkownikId = decoded.id;
    fetch(`${CONFIG.URL}/api/sklepy-raportowanie/${uzytkownikId}`)
      .then((response) => response.json())
      .then((data) => {
        sklepSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Wybierz sklep --";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        sklepSelect.appendChild(defaultOption);

        data.forEach((sklep) => {
          const option = document.createElement("option");
          option.value = sklep.SklId;
          option.textContent = sklep.SklNazwa;
          sklepSelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Błąd pobierania sklepów:", error));
  }

  loadSklepy();
});

async function fetchCeny(sklepId) {
  try {
    const response = await fetch(`${CONFIG.URL}/api/ceny/${sklepId}`);
    const ceny = await response.json();

    const tableBody = document.getElementById("centrala-ceny-tbody");
    tableBody.innerHTML = "";

    ceny.forEach((cena) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${cena.CId}</td>
          <td>${cena.TowNazwa}</td>
          <td><input type="number" step="0.01" class="cena-towaru" value="${cena.CCena}"></td>
          <td><input type="number" step="0.01" value="${cena.CPoprzedniaCena}" disabled></td>
          <td>${cena.CDataZmiany}</td>
          <td><button class="ceny-edycja-btn" data-towar="${cena.TowId}"><span>Zapisz</span><img src="../img/white/save-white.png" style="display:none"></button></td>
        `;
      tableBody.appendChild(row);
    });

    if (window.innerWidth < 992) {
      document.querySelectorAll(".ceny-edycja-btn img").forEach((img) => {
        img.style.display = "block";
      });
      document.querySelectorAll(".ceny-edycja-btn span").forEach((span) => {
        span.style.display = "none";
      });
    }
  } catch (error) {
    console.error("Błąd pobierania smaków:", error);
  }
}

document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("ceny-edycja-btn")) {
    const button = e.target;
    const towarId = button.dataset.towar;

    const sklepId = sklepSelect.value;
    console.log(sklepId);

    const row = button.closest("tr");
    const cena = row.querySelector(".cena-towaru").value;

    fetch(`${CONFIG.URL}/api/ceny-edycja/${towarId}/${sklepId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cena }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Sukces:", data);
        fetchCeny(sklepId);
      })
      .catch((error) => {
        console.error("Błąd:", error);
      });
  }
});

const headers = document.querySelectorAll("#centrala-ceny thead th");
const tbody = document.querySelector("#centrala-ceny-tbody");

function sortTable(column, direction) {
  headers.forEach((h, idx) => {
    h.setAttribute("data-order", "desc");
    h.textContent = h.textContent.replace(/[\u25B2\u25BC]/g, "");

    if (idx !== headers.length - 1) {
      if (idx === column) {
        h.setAttribute("data-order", direction);
        h.textContent += direction === "asc" ? " ▲" : " ▼";
      }
    }
  });

  const rows = Array.from(tbody.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const aCell = a.children[column];
    const bCell = b.children[column];

    let aText = aCell.textContent.trim();
    let bText = bCell.textContent.trim();

    if (aCell.querySelector("input")) {
      aText = aCell.querySelector("input").value;
    }
    if (bCell.querySelector("input")) {
      bText = bCell.querySelector("input").value;
    }

    const aNum = parseFloat(aText.replace("%", "").replace(",", "."));
    const bNum = parseFloat(bText.replace("%", "").replace(",", "."));
    const isNumeric = !isNaN(aNum) && !isNaN(bNum);

    if (isNumeric) {
      return direction === "asc" ? aNum - bNum : bNum - aNum;
    } else {
      return direction === "asc"
        ? aText.localeCompare(bText)
        : bText.localeCompare(aText);
    }
  });

  tbody.innerHTML = "";
  rows.forEach((row) => tbody.appendChild(row));
}

headers.forEach((header, index) => {
  header.addEventListener("click", () => {
    const currentOrder = header.getAttribute("data-order");
    const newOrder = currentOrder === "asc" ? "desc" : "asc";
    sortTable(index, newOrder);
  });
});

function applyDefaultSortAfterFetch() {
  sortTable(0, "asc");
}

sklepSelect.addEventListener("change", () => {
  const sklepId = sklepSelect.value;
  fetchCeny(sklepId);
});
