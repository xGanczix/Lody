document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Brak tokena");
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded || !decoded.sklepId) {
      console.log("Nieprawidłowy token");
      return;
    }

    const sklepId = decoded.sklepId;

    const res = await fetch(`${CONFIG.URL}/api/ulozenie-kuwet-menu/${sklepId}`);
    let ulozenieData = {};
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        ulozenieData = data[0];
      }
      console.log("Dane o ułożeniu kuwet:", ulozenieData);
    } else {
      console.log("Brak przypisania kuwet w bazie.");
    }

    const kuwetResponse = await fetch(
      `${CONFIG.URL}/api/kuwety-sklep/${sklepId}`
    );
    if (!kuwetResponse.ok) {
      console.log("Błąd pobierania kuwet");
      return;
    }

    const kuwetData = await kuwetResponse.json();

    const przypisaneSmaki = {};
    const przypisaneSmakiSet = new Set();

    const kuwetContainers = document.querySelectorAll(".ulozenie-kuwet-kuweta");

    kuwetContainers.forEach((kuweta) => {
      const kuwetaId = kuweta.id.replace("kuweta", "");
      const przypisanySmakId = ulozenieData[`UKuw${kuwetaId}Id`];

      if (przypisanySmakId) {
        const przypisanySmak = kuwetData.find(
          (item) => item.Id === przypisanySmakId
        );
        if (przypisanySmak) {
          kuweta.style.backgroundColor = przypisanySmak.Kolor;
          kuweta.style.color = przypisanySmak.TekstKolor;
          kuweta.textContent = przypisanySmak.Nazwa;

          przypisaneSmaki[`kuweta${kuwetaId}`] = przypisanySmak.Id;
          przypisaneSmakiSet.add(przypisanySmak.Id);
        }
      }

      kuweta.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      kuweta.addEventListener("drop", (e) => {
        e.preventDefault();

        const droppedData = e.dataTransfer.getData("text");
        if (!droppedData) {
          console.log("Brak danych smaku");
          return;
        }

        const smak = JSON.parse(droppedData);
        const kuwetaId = kuweta.id.replace("kuweta", "");

        if (przypisaneSmaki[`kuweta${kuwetaId}`]) {
          console.log("Ta kuweta ma już przypisany smak");
          return;
        }

        kuweta.style.backgroundColor = smak.Kolor;
        kuweta.style.color = smak.TekstKolor;
        kuweta.textContent = smak.Nazwa;

        przypisaneSmaki[`kuweta${kuwetaId}`] = smak.Id;
        przypisaneSmakiSet.add(smak.Id);

        const smakRow = document.getElementById(`list-${smak.Id}`);
        if (smakRow) {
          smakRow.remove();
        }
      });

      kuweta.addEventListener("dblclick", () => {
        const kuwetaId = kuweta.id.replace("kuweta", "");
        const przypisanySmakId = ulozenieData[`UKuw${kuwetaId}Id`];

        if (przypisanySmakId) {
          const przypisanySmak = kuwetData.find(
            (item) => item.Id === przypisanySmakId
          );
          if (przypisanySmak) {
            kuweta.style.backgroundColor = "";
            kuweta.style.color = "";
            kuweta.textContent = "";

            delete przypisaneSmaki[`kuweta${kuwetaId}`];
            przypisaneSmakiSet.delete(przypisanySmakId);

            const row = document.createElement("tr");
            row.classList.add("kuweta-item");
            row.setAttribute("id", `list-${przypisanySmak.Id}`);
            row.setAttribute("draggable", "true");

            let nameCell = document.createElement("td");
            nameCell.textContent = przypisanySmak.Nazwa;
            nameCell.style.background = przypisanySmak.Kolor;
            nameCell.style.color = przypisanySmak.TekstKolor;

            let colorCell = document.createElement("td");
            colorCell.textContent = przypisanySmak.Porcje;
            colorCell.style.background = przypisanySmak.Kolor;
            colorCell.style.color = przypisanySmak.TekstKolor;

            row.appendChild(nameCell);
            row.appendChild(colorCell);
            tableBody.appendChild(row);

            row.addEventListener("dragstart", (e) => {
              e.dataTransfer.setData("text", JSON.stringify(przypisanySmak));
            });
          }
        }
      });
    });

    const tableBody = document.getElementById("kuwety-tbody");
    tableBody.innerHTML = "";

    kuwetData.forEach((smak) => {
      if (!przypisaneSmakiSet.has(smak.Id)) {
        let row = document.createElement("tr");
        row.classList.add("kuweta-item");
        row.setAttribute("id", `list-${smak.Id}`);
        row.setAttribute("draggable", "true");

        let nameCell = document.createElement("td");
        nameCell.textContent = smak.Nazwa;
        nameCell.style.background = smak.Kolor;
        nameCell.style.color = smak.TekstKolor;

        let colorCell = document.createElement("td");
        colorCell.textContent = smak.Porcje;
        colorCell.style.background = smak.Kolor;
        colorCell.style.color = smak.TekstKolor;

        row.appendChild(nameCell);
        row.appendChild(colorCell);
        tableBody.appendChild(row);

        row.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text", JSON.stringify(smak));
        });
      }
    });

    const zapiszMenuButton = document.getElementById("ulozenie-zapisz-menu");
    zapiszMenuButton.addEventListener("click", async () => {
      try {
        const response = await fetch(`${CONFIG.URL}/api/ulozenie-kuwet-menu`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sklepId,
            ...przypisaneSmaki,
          }),
        });

        const result = await response.json();
        if (response.ok) {
          window.location.href = "sklep-menu.html";
        } else {
          console.log(result.error);
        }
      } catch (err) {
        console.log("Błąd podczas zapisywania:", err);
      }
    });

    const zapiszSprzedazButton = document.getElementById(
      "ulozenie-zapisz-sprzedaz"
    );
    zapiszSprzedazButton.addEventListener("click", async () => {
      try {
        const response = await fetch(`${CONFIG.URL}/api/ulozenie-kuwet-menu`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sklepId,
            ...przypisaneSmaki,
          }),
        });

        const result = await response.json();
        if (response.ok) {
          window.location.href = "sprzedaz.html";
        } else {
          console.log(result.error);
        }
      } catch (err) {
        console.log("Błąd podczas zapisywania:", err);
      }
    });
  } catch (err) {
    console.log(err);
  }
});
