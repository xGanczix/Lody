async function fetchUserData() {
  const urlParams = new URLSearchParams(window.location.search);
  const uzytkownikId = urlParams.get("uzytkownikId");
  console.log("ID użytkownika:", uzytkownikId);

  if (!uzytkownikId) {
    console.error("Brak ID użytkownika w URL");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.URL}/api/rcp-uzytkownik/${uzytkownikId}`
    );
    const data = await response.json();
    console.log("Otrzymane dane:", data);

    const tableBody = document.getElementById("rcp-user-tbody");
    tableBody.innerHTML = "";

    data.forEach((item) => {
      // Załóżmy, że item.data zawiera datę w formacie UTC

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

fetchUserData();
