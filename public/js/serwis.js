document
  .getElementById("tworzenieTabel")
  .addEventListener("click", async () => {
    const button = document.getElementById("tworzenieTabel");
    let originalText = button.textContent;

    try {
      const userConfirmed = confirm(
        "Czy na pewno chcesz utworzyć tabele w bazie danych?"
      );
      if (!userConfirmed) return;

      button.textContent = "Tworzenie...";
      button.disabled = true;

      const response = await fetch(`${CONFIG.URL}/api/tworzenie-tabel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Sukces: ${result.message}`);
      } else {
        throw new Error(result.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd:", error);
      alert(`Błąd podczas tworzenia tabel: ${error.message}`);
    } finally {
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  });

document
  .getElementById("tworzenieRegul")
  .addEventListener("click", async () => {
    const btn = document.getElementById("tworzenieRegul");
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = "Tworzenie...";

      const response = await fetch("/api/tworzenie-procedur", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Nie udało się utworzyć procedury");
      }

      alert(data.message);
      console.log("Sukces:", data);
    } catch (error) {
      console.error("Błąd:", error);
      alert(`Błąd: ${error.message}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

document
  .getElementById("czyszczenieTabel")
  .addEventListener("click", async () => {
    const button = document.getElementById("czyszczenieTabel");
    let originalText = button.textContent;

    try {
      const userConfirmed = confirm(
        "Czy na pewno chcesz wyczyścić tabele w bazie danych?"
      );
      if (!userConfirmed) return;

      const userInput = prompt('Aby potwierdzić, wpisz: "czyszczenie"');

      if (userInput !== "czyszczenie") {
        alert("Nieprawidłowy tekst. Czyszczenie anulowane.");
        return;
      }

      button.textContent = "Czyszczenie...";
      button.disabled = true;

      const response = await fetch(`${CONFIG.URL}/api/czyszczenie-tabel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Sukces: ${result.message}`);
      } else {
        throw new Error(result.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Błąd:", error);
      alert(`Błąd podczas czyszczenia tabel: ${error.message}`);
    } finally {
      if (button) {
        button.textContent = originalText;
        button.disabled = false;
      }
    }
  });

document
  .getElementById("tworzenieAdministratora")
  .addEventListener("click", async () => {
    const btn = document.getElementById("tworzenieRegul");
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = "Tworzenie...";

      const response = await fetch("/api/tworzenie-administratora", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Nie udało się utworzyć administratora"
        );
      }

      alert(data.message);
      console.log("Sukces:", data);
    } catch (error) {
      console.error("Błąd:", error);
      alert(`Błąd: ${error.message}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

document
  .getElementById("czyszczenieBuforaZamowien")
  .addEventListener("click", async () => {
    const btn = document.getElementById("czyszczenieBuforaZamowien");
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = "Czyszczenie...";

      const response = await fetch("/api/czyszczenie-bufora-zamowien", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Nie udało się wyczyścić bufora");
      }

      alert(data.message);
      console.log("Sukces:", data);
    } catch (error) {
      console.error("Błąd:", error);
      alert(`Błąd: ${error.message}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

document
  .getElementById("zamowienieToPDF")
  .addEventListener("click", async function () {
    try {
      // Wysyłanie zapytania do endpointu
      const response = await fetch(
        `${CONFIG.URL}/api/generator-zamowien-sklepy`
      );
      const data = await response.json();

      // Tworzenie nowego PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Dodawanie tytułu
      doc.text("Serwisowe generowanie zamówień", 20, 10);

      // Tworzenie nagłówka tabeli
      const headers = ["SmkId", "SmkNazwa", "Liczba wystąpień", "ZamSklId"];
      const tableData = data.map((row) => [
        row.SmkId,
        row.SmkNazwa,
        row.liczba_wystapien,
        row.ZamSklId,
      ]);

      // Dodawanie tabeli do PDF
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 20,
        theme: "grid",
      });

      // Generowanie pliku PDF i pobieranie go
      doc.save("zamowienie_serwisowe.pdf");
    } catch (error) {
      console.error("Błąd przy generowaniu PDF:", error);
      alert("Błąd przy generowaniu PDF: " + error.message);
    }
  });
