let rcpData = [];

async function fetchRCP() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (startDate > endDate) {
    alert("Data początkowa jest większa od  końcowej!");
    return;
  } else {
    try {
      const response = await fetch(
        `${CONFIG.URL}/api/rcp?startDate=${startDate}&endDate=${endDate}`
      );

      const tableBody = document.getElementById("centrala-rcp-tbody");
      tableBody.innerHTML = "";

      rcpData = await response.json();
      rcpData.forEach((czas) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${czas.UzId}</td>
        <td>${czas.UzImie} ${czas.UzNazwisko}</td>
        <td>${czas.PrzepracowanyCzas}</td>
        <td style="display:none">
          <input type="number" id="rcp-format-${czas.RCPId}" value="${
          czas.PrzepracowaneGodzinyFormat || 0
        }">
        </td>
        <td>
          <input type="number" step="0.01" id="rcp-stawka-${
            czas.RCPId
          }" value="${czas.UzStawkaGodzinowa || 0}">
        </td>
        <td>
          <input type="number" step="0.01" id="rcp-wynagrodzenie-${
            czas.RCPId
          }" value="0.00" disabled>
        </td>
        <td>
          <button id="rcp-month" data-uzytkownik-id="${czas.UzId}">
            <img src="../img/white/calendar-white.png">
          </button>
        </td>
      `;
        tableBody.appendChild(row);

        const button = row.querySelector("#rcp-month");
        button.addEventListener("click", (event) => {
          const uzytkownikId = event.target
            .closest("button")
            .getAttribute("data-uzytkownik-id");
          window.location.href = `rcp-uzytkownik.html?uzytkownikId=${uzytkownikId}`;
        });
      });
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
    }
  }
}

document.getElementById("obliczRcp").addEventListener("click", async () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!startDate || !endDate) return;

  await fetchRCP(startDate, endDate);
  initCalculation();
});

function calculateSalary(rcpId) {
  const stawkaInput = document.getElementById(`rcp-stawka-${rcpId}`);
  const godzinyInput = document.getElementById(`rcp-format-${rcpId}`);
  const wynagrodzenieInput = document.getElementById(
    `rcp-wynagrodzenie-${rcpId}`
  );

  if (!stawkaInput || !godzinyInput || !wynagrodzenieInput) return;

  const stawka = parseFloat(stawkaInput.value) || 0;
  const godziny = parseFloat(godzinyInput.value) || 0;
  const wynagrodzenie = stawka * godziny;

  wynagrodzenieInput.value = wynagrodzenie.toFixed(2);
}

function initCalculation() {
  rcpData.forEach((czas) => {
    calculateSalary(czas.RCPId);
  });

  document.querySelectorAll('input[id^="rcp-stawka-"]').forEach((input) => {
    input.removeEventListener("input", handleStawkaChange);
    input.addEventListener("input", handleStawkaChange);
  });
}

function handleStawkaChange() {
  const rcpId = this.id.split("-")[2];
  calculateSalary(rcpId);
}

function wartoscDat() {
  const dzisiaj = new Date();
  const dzisiajFormatowane = dzisiaj.toISOString().split("T")[0];
  const tydzienWczesniej = new Date(dzisiaj);
  tydzienWczesniej.setDate(dzisiaj.getDate() - 7);

  const tydzienWczesniejFormatowane = tydzienWczesniej
    .toISOString()
    .split("T")[0];

  const poczatkowa = document.getElementById("startDate");
  const koncowa = document.getElementById("endDate");
  poczatkowa.value = tydzienWczesniejFormatowane;
  koncowa.value = dzisiajFormatowane;
}

document.addEventListener("DOMContentLoaded", () => {
  wartoscDat();
  fetchRCP().then(initCalculation);
});
