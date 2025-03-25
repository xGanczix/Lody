document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Brak tokena w localStorage");

    const decoded = parseJwt(token);
    if (!decoded || !decoded.sklepId) throw new Error("Nieprawidłowy token");

    const sklepId = decoded.sklepId;
    let przypisaneKuwety = [];

    const response = await fetch(`${CONFIG.URL}/api/ulozenie-kuwet/${sklepId}`);
    if (response.ok) {
      const ulozenie = await response.json();
      console.log("Otrzymane ułożenie kuwet:", ulozenie);
      przypiszSmakiDoKuwet(ulozenie);
    } else {
      console.warn("Brak ułożenia kuwet – przechodzimy dalej.");
    }

    const res = await fetch(`${CONFIG.URL}/api/smaki-sklep/${sklepId}`);
    if (!res.ok) throw new Error("Błąd pobierania kuwet");

    const data = await res.json();
    console.log("Otrzymane smaki:", data);

    const tableBody = document.getElementById("smaki-tbody");
    if (!tableBody) throw new Error("Element #smaki-tbody nie istnieje.");

    data.forEach((smak) => {
      if (przypisaneKuwety.includes(smak.Id.toString())) return;

      let row = document.createElement("tr");
      row.classList.add("smak-item");
      row.setAttribute("draggable", true);
      row.setAttribute("id", `${smak.Id}`);
      row.setAttribute("ondragstart", "drag(event)");

      let nameCell = document.createElement("td");
      nameCell.textContent = smak.Nazwa;
      nameCell.style.background = smak.Kolor;
      nameCell.style.color = smak.TekstKolor;

      let colorCell = document.createElement("td");
      colorCell.textContent = smak.Pojemnosc;
      colorCell.style.background = smak.Kolor;
      colorCell.style.color = smak.TekstKolor;

      row.append(nameCell, colorCell);
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Błąd inicjalizacji strony:", error);
  }
});

let draggedElement = null;

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function touchStart(ev) {
  draggedElement = ev.target.closest("tr");
  if (!draggedElement) return;

  draggedElement.style.position = "absolute";
  draggedElement.style.zIndex = "1000";

  document.body.appendChild(draggedElement);
  moveAt(ev.touches[0].pageX, ev.touches[0].pageY);

  function moveAt(pageX, pageY) {
    draggedElement.style.left = pageX - draggedElement.offsetWidth / 2 + "px";
    draggedElement.style.top = pageY - draggedElement.offsetHeight / 2 + "px";
  }

  function onTouchMove(event) {
    moveAt(event.touches[0].pageX, event.touches[0].pageY);
  }

  document.addEventListener("touchmove", onTouchMove);

  draggedElement.ontouchend = function (event) {
    document.removeEventListener("touchmove", onTouchMove);
    let touch = event.changedTouches[0];
    let dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    if (dropTarget && dropTarget.classList.contains("ulozenie-kuwet-kuweta")) {
      let smakId = draggedElement.id.replace("smak-", "");
      let smakNazwa = draggedElement.querySelector("td").textContent;
      let smakKolor = draggedElement.querySelector("td").style.backgroundColor;
      let smakTekstKolor = draggedElement.querySelector("td").style.color;

      dropTarget.textContent = smakNazwa;
      dropTarget.style.backgroundColor = smakKolor;
      dropTarget.style.color = smakTekstKolor;
      dropTarget.setAttribute("data-smak-id", smakId);

      draggedElement.remove();
    } else {
      document.body.removeChild(draggedElement);
    }

    draggedElement = null;
  };

  ev.preventDefault();
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  let smakId = ev.dataTransfer.getData("text");
  let element = document.getElementById(smakId);
  let smakNazwa = element.querySelector("td").textContent;
  let smakKolor = element.querySelector("td").style.backgroundColor;
  let smakTekstKolor = element.querySelector("td").style.color;

  let kuweta = ev.target.closest(".ulozenie-kuwet-kuweta");
  if (!kuweta) return console.warn("Nie znaleziono kuwety docelowej.");

  kuweta.textContent = smakNazwa;
  kuweta.style.backgroundColor = smakKolor;
  kuweta.style.color = smakTekstKolor;
  kuweta.setAttribute("data-smak-id", smakId);

  element.remove();
}

document.querySelectorAll("tr").forEach((el) => {
  el.addEventListener("touchstart", touchStart);
});

async function zapiszUlozenie(url, redirectPage) {
  try {
    const kuwety = {};
    for (let i = 1; i <= 10; i++) {
      kuwety[`kuweta${i}`] =
        document.getElementById(`kuweta${i}`)?.getAttribute("data-smak-id") ||
        null;
    }

    const token = localStorage.getItem("token");
    const decoded = parseJwt(token);
    const sklepId = decoded.sklepId;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...kuwety, sklepId }),
    });

    const data = await response.json();
    if (response.ok) {
      window.location.href = redirectPage;
    } else {
      wyswietlKomunikat(data.error || "Wystąpił błąd.");
    }
  } catch (error) {
    console.error("Błąd zapisu ułożenia:", error);
    wyswietlKomunikat("Wystąpił błąd podczas zapisu ułożenia.");
  }
}

document
  .getElementById("ulozenie-zapisz-menu")
  ?.addEventListener("click", (event) => {
    event.preventDefault();
    zapiszUlozenie(`${CONFIG.URL}/api/ulozenie-kuwet-menu`, "sklep-menu.html");
  });

document
  .getElementById("ulozenie-zapisz-sprzedaz")
  ?.addEventListener("click", (event) => {
    event.preventDefault();
    zapiszUlozenie(`${CONFIG.URL}/api/ulozenie-kuwet-menu`, "sprzedaz.html");
  });

function wyswietlKomunikat(tresc) {
  const messageElement = document.getElementById("message");
  const messageContainer = document.querySelector(".message");
  if (!messageElement || !messageContainer) return;

  messageElement.textContent = tresc;
  messageContainer.style.opacity = 1;
  setTimeout(() => {
    messageContainer.style.opacity = 0;
  }, 3000);
}

function przypiszSmakiDoKuwet(ulozenie) {
  for (let i = 1; i <= 10; i++) {
    const kuwetaElement = document.getElementById(`kuweta${i}`);
    const smakId = ulozenie[`UKuw${i}Id`];
    if (!smakId) continue;

    const smakElement = document.getElementById(`smak-${smakId}`);
    if (!smakElement) {
      console.warn(`Nie znaleziono smaku o ID ${smakId}.`);
      continue;
    }

    const smakNazwa = smakElement.querySelector("td").textContent;
    const smakKolor = smakElement.querySelector("td").style.backgroundColor;

    kuwetaElement.textContent = smakNazwa;
    kuwetaElement.style.backgroundColor = smakKolor;
    kuwetaElement.setAttribute("data-smak-id", smakId);

    smakElement.remove();
  }
}
