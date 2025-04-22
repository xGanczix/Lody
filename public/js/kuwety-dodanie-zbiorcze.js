let smaki = [];
let rozmiary = [];

document.addEventListener("DOMContentLoaded", async () => {
  const smakRes = await fetch(`${CONFIG.URL}/api/smaki`);
  smaki = await smakRes.json();

  const rozRes = await fetch(`${CONFIG.URL}/api/rozmiary`);
  rozmiary = await rozRes.json();

  document.getElementById("add-row").click();
});

document.getElementById("add-row").addEventListener("click", () => {
  const tbody = document.getElementById("kuwety-rows");
  const tr = document.createElement("tr");

  const smakSelect = document.createElement("select");
  smakSelect.innerHTML =
    `<option value="">-- Wybierz smak --</option>` +
    smaki
      .map((s) => `<option value="${s.SmkId}">${s.SmkNazwa}</option>`)
      .join("");

  const rozSelect = document.createElement("select");
  rozSelect.innerHTML =
    `<option value="">-- Wybierz rozmiar --</option>` +
    rozmiary
      .map(
        (r) =>
          `<option value="${r.RozId}">${r.RozNazwa} - ${r.RozPojemnosc} porcji</option>`
      )
      .join("");

  const iloscInput = document.createElement("input");
  iloscInput.type = "number";
  iloscInput.min = "1";
  iloscInput.value = "1";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Usuń";
  deleteBtn.className = "dodawanie-zbiorcze-usun-btn";
  deleteBtn.onclick = () => {
    tr.remove();
    hr.remove();
  };

  const hr = document.createElement("hr");

  [smakSelect, rozSelect, iloscInput, deleteBtn].forEach((el) => {
    const td = document.createElement("td");
    td.appendChild(el);
    tr.appendChild(td);
  });
  tbody.appendChild(hr);
  tbody.appendChild(tr);
});

document.getElementById("submit-bulk").addEventListener("click", async () => {
  const rows = document.querySelectorAll("#kuwety-rows tr");
  const data = [];

  rows.forEach((row) => {
    const smak = row.children[0].querySelector("select").value;
    const rozmiar = row.children[1].querySelector("select").value;
    const ilosc = parseInt(row.children[2].querySelector("input").value);

    if (smak && rozmiar && ilosc > 0) {
      data.push({ smak, rozmiar, ilosc });
    }
  });

  if (data.length === 0) {
    alert("Dodaj przynajmniej jedną poprawną pozycję!");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.URL}/api/kuwety-zbiorczo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kuwetki: data }),
    });

    const resData = await res.json();

    if (res.ok) {
      alert("Dodano kuwetki!");
      window.location.href = "kuwety.html";
    } else {
      alert(resData.error || "Wystąpił błąd");
    }
  } catch (err) {
    console.error("Błąd:", err);
    alert("Błąd podczas wysyłania danych.");
  }
});
