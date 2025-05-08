async function fetchUserData() {
  const urlParams = new URLSearchParams(window.location.search);
  const uzytkownikId = urlParams.get("uzytkownikId");

  if (!uzytkownikId) {
    console.error("Brak ID użytkownika w URL");
    return;
  }

  try {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const response = await fetch(
      `${CONFIG.URL}/api/rcp-uzytkownik/${uzytkownikId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const tableBody = document.getElementById("rcp-user-tbody");
    tableBody.innerHTML = "";

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${item.UzImie + " " + item.UzNazwisko}</td>
            <td>${item.data}</td>
            <td>${item.RoznicaCzasu}</td>
          `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Błąd pobierania danych użytkownika:", error);
  }
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
  fetchUserData();
});

document.getElementById("obliczRcp").addEventListener("click", () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  if (startDate > endDate) {
    alert("Data początkowa jest większa od  końcowej!");
    return;
  } else {
    document.getElementById("rcp-user-tbody").innerHTML = "";
    fetchUserData();
  }
});
