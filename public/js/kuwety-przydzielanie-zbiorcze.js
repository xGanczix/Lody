document.addEventListener("DOMContentLoaded", async () => {
  const sklepSelect = document.getElementById("sklep-select");
  const kuwetyContainer = document.getElementById("kuwety-container");

  const sklepyRes = await fetch(`${CONFIG.URL}/api/sklepy-logowanie`);
  const sklepy = await sklepyRes.json();
  sklepy.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.SklId;
    opt.textContent = s.SklNazwa;
    sklepSelect.appendChild(opt);
  });

  const kuwetyRes = await fetch(`${CONFIG.URL}/api/kuwety-dostepne-centrala`);
  const kuwety = await kuwetyRes.json();

  const grupowane = {};
  kuwety.forEach((k) => {
    const key = `${k.KuwSmkId}|${k.KuwSmakNazwa}|${k.KuwRozmiarNazwa}|${k.KuwRozId}`;
    if (!grupowane[key]) grupowane[key] = 0;
    grupowane[key]++;
  });

  for (const key in grupowane) {
    const [smkId, smkNazwa, smkRozmiar, smkRozmiarId] = key.split("|");
    const dostepne = grupowane[key];
    const hr = document.createElement("hr");
    const div = document.createElement("div");
    let kolorId =
      smkRozmiarId >= 1 && smkRozmiarId <= 10
        ? `rozmiar-${smkRozmiarId}`
        : "nieznany-rozmiar";
    div.className = "kuweta-container";
    div.innerHTML = `
          <label>${smkNazwa} - <span id="${kolorId}">${smkRozmiar}</span> (dostępne: ${dostepne})</label>
          <select data-smak-id="${smkId}">
            <option value="0">0</option>
            ${Array.from(
              { length: dostepne },
              (_, i) => `<option value="${i + 1}">${i + 1}</option>`
            ).join("")}
          </select>
        `;
    kuwetyContainer.appendChild(hr);
    kuwetyContainer.appendChild(div);

    function updateSumaSelectow() {
      const selecty = kuwetyContainer.querySelectorAll("select");
      let suma = 0;
      selecty.forEach((sel) => {
        suma += parseInt(sel.value) || 0;
      });
      document.querySelector(
        "#licznik-przypisania-kuwet-wartosc"
      ).textContent = `${suma}`;
    }

    kuwetyContainer.querySelectorAll("select").forEach((sel) => {
      sel.addEventListener("change", updateSumaSelectow);
    });

    updateSumaSelectow();
  }

  document
    .getElementById("przydziel-btn")
    .addEventListener("click", async () => {
      const sklepId = sklepSelect.value;
      if (!sklepId) return alert("Wybierz sklep");

      const selecty = kuwetyContainer.querySelectorAll("select");
      const dane = [];

      selecty.forEach((sel) => {
        const ilosc = parseInt(sel.value);
        if (ilosc > 0) {
          dane.push({ smakId: parseInt(sel.dataset.smakId), ilosc });
        }
      });

      if (dane.length === 0) return alert("Nie wybrano żadnych kuwet");

      const requestData = { sklepId, przydzielenia: dane };

      console.log("Wysyłane dane:", requestData);

      const response = await fetch(`${CONFIG.URL}/api/przydziel-kuwety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        alert("Kuwety przypisane!");
        location.reload();
      } else {
        alert("Błąd przydzielania");
      }
    });
});
