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

  document.getElementById('tworzenieRegul').addEventListener('click', async () => {
    const btn = document.getElementById('tworzenieRegul');
    const originalText = btn.textContent;
    
    try {
      btn.disabled = true;
      btn.textContent = 'Tworzenie...';
      
      const response = await fetch('/api/tworzenie-procedur', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Nie udało się utworzyć procedury');
      }
  
      alert(data.message);
      console.log('Sukces:', data);
    } catch (error) {
      console.error('Błąd:', error);
      alert(`Błąd: ${error.message}`);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

document.getElementById("czyszczenieTabel").addEventListener("click", () => {
  alert("Kliknięcie czyszczenia tabel");
});
