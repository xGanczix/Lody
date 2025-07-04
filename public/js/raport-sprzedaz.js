const decoded = parseJwt(token);
const uzytkownikId = decoded.id;

async function fetchRaportSprzedazFormyPlatnosci() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedaz-formy-platnosci/${uzytkownikId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const formyPlatnosci = data.map((item) => item.DokFormaPlatnosci);
    const wartosciSprzedazy = data.map((item) =>
      parseFloat((item.wartoscSprzedazy ?? "0").replace(/,/g, "")).toFixed(2)
    );

    var colors = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#FF4560",
      "#775DD0",
      "#3F51B5",
      "#546E7A",
      "#D4526E",
    ];

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Wartość Sprzedaży",
          data: wartosciSprzedazy,
        },
      ],
      xaxis: {
        categories: formyPlatnosci,
      },
      title: {
        text: "Wartość sprzedaży według formy płatności",
      },
      colors: colors.slice(0, formyPlatnosci.length),
      plotOptions: {
        bar: {
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return parseFloat(val).toFixed(2);
        },
      },
      legend: {
        show: false,
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#formy-platnosci"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazSmaki() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-ilosci-smaki/${uzytkownikId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const validData = data.filter(
      (item) =>
        item &&
        item.iloscSprzedana != null &&
        item.SmkNazwa != null &&
        item.SmkKolor != null &&
        item.SmkTekstKolor != null
    );

    const iloscSprzedana = validData.map((item) => item.iloscSprzedana);
    const SmkNazwa = validData.map((item) => item.SmkNazwa);
    const SmkKolor = validData.map((item) => item.SmkKolor);
    const SmkTekstKolor = validData.map((item) => item.SmkTekstKolor);

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Ilość Sprzedana",
          data: iloscSprzedana,
        },
      ],
      xaxis: {
        labels: {
          show: false,
        },
        categories: SmkNazwa,
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      title: {
        text: "Ilość sprzedanych smaków",
      },
      colors: SmkKolor,
      plotOptions: {
        bar: {
          horizontal: false,
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: SmkTekstKolor,
        },
        formatter: function (val) {
          return val;
        },
      },
      legend: {
        show: true,
        position: "right",
        markers: {
          fillColors: SmkKolor,
        },
        labels: {
          colors: "#000",
          useSeriesColors: false,
          formatter: function (val, index) {
            return SmkNazwa[index];
          },
        },
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedawane-smaki"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazTowaryWartosc() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-towary-sprzedaz-wartosc/${uzytkownikId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const nazwaTowaru = data.map((item) => item.TowNazwa);
    const wartoscSprzedazy = data.map((item) =>
      parseFloat(String(item.TowaryWartosc).replace(/,/g, "")).toFixed(2)
    );

    var colors = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#FF4560",
      "#775DD0",
      "#3F51B5",
      "#546E7A",
      "#D4526E",
    ];

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Wartość Sprzedaży",
          data: wartoscSprzedazy,
        },
      ],
      xaxis: {
        labels: {
          show: false,
        },
        categories: nazwaTowaru,
      },
      yaxis: {
        labels: {
          show: true,
        },
      },
      title: {
        text: "Wartość sprzedaży towarów",
      },
      colors: colors.slice(0, nazwaTowaru.length),
      plotOptions: {
        bar: {
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return parseFloat(val).toFixed(2);
        },
      },
      legend: {
        show: true,
        position: "bottom",
        markers: {
          fillColors: colors.slice(0, nazwaTowaru.length),
        },
        labels: {
          colors: "#000",
          useSeriesColors: false,
          formatter: function (val, index) {
            return TowNazwa[index];
          },
        },
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedawane-towary-wartosc"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazTowaryIlosc() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-towary-sprzedaz-wartosc/${uzytkownikId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const nazwaTowaru = data.map((item) => item.TowNazwa);
    const iloscSprzedana = data.map((item) =>
      parseFloat(String(item.TowaryIlosc).replace(/,/g, "")).toFixed(2)
    );

    var colors = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#FF4560",
      "#775DD0",
      "#3F51B5",
      "#546E7A",
      "#D4526E",
    ];

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Sprzedana Ilość",
          data: iloscSprzedana,
        },
      ],
      xaxis: {
        labels: {
          show: false,
        },
        categories: nazwaTowaru,
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      title: {
        text: "Ilość sprzedanych towarów",
      },
      colors: colors.slice(0, nazwaTowaru.length),
      plotOptions: {
        bar: {
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
      },
      legend: {
        show: true,
        position: "bottom",
        markers: {
          fillColors: colors.slice(0, nazwaTowaru.length),
        },
        labels: {
          colors: "#000",
          useSeriesColors: false,
          formatter: function (val, index) {
            return TowNazwa[index];
          },
        },
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedawane-towary-ilosc"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportSprzedazWartosc() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-wartosci-dzien/${uzytkownikId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazyDzien.replace(/,/g, "")).toFixed(2)
    );
    const dataSprzedazy = data.map((item) => {
      const date = new Date(item.SprzedazDzien);
      return date.toLocaleDateString("pl-PL");
    });

    const options = {
      chart: {
        type: "line",
      },
      series: [
        {
          name: "Wartość Sprzedaży",
          data: wartosciSprzedazy,
        },
      ],
      xaxis: {
        categories: dataSprzedazy,
      },
      title: {
        text: "Wartość sprzedaży według dni",
      },
      stroke: {
        curve: "smooth",
      },
      markers: {
        size: 4,
      },
      dataLabels: {
        enabled: true,
      },
      colors: ["#008FFB"],
      legend: {
        show: false,
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#sprzedaz-wartosci-dzien"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function fetchRaportPrzydzieloneKuwety() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-przydzielonych-kuwet/${uzytkownikId}?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const rekord = data[0];
    const nazwy = Object.keys(rekord);
    const ilosci = Object.values(rekord);

    const colors = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#FF4560",
      "#775DD0",
      "#3F51B5",
      "#546E7A",
      "#D4526E",
    ];

    const options = {
      chart: {
        type: "bar",
      },
      series: [
        {
          name: "Ilość",
          data: ilosci,
        },
      ],
      xaxis: {
        categories: nazwy,
        labels: {
          show: true,
        },
      },
      yaxis: {
        labels: {
          show: true,
        },
      },
      title: {
        text: "Ilość kuwet według rozmiaru",
      },
      colors: colors.slice(0, nazwy.length),
      plotOptions: {
        bar: {
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
      },
      legend: {
        show: false,
      },
    };

    const chart = new ApexCharts(
      document.querySelector("#przydzielone-kuwety"),
      options
    );
    chart.render();
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

// Funkcja ustawiająca daty
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
  fetchRaportSprzedazFormyPlatnosci();
  fetchRaportSprzedazWartosc();
  fetchRaportSprzedazSmaki();
  fetchRaportSprzedazTowaryWartosc();
  fetchRaportSprzedazTowaryIlosc();
  fetchRaportPrzydzieloneKuwety();
});

document.getElementById("raportujDaty").addEventListener("click", () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  if (startDate > endDate) {
    alert("Data początkowa jest większa od  końcowej!");
    return;
  } else {
    document.querySelector("#formy-platnosci").innerHTML = "";
    document.querySelector("#sprzedawane-towary-wartosc").innerHTML = "";
    document.querySelector("#sprzedaz-wartosci-dzien").innerHTML = "";
    document.querySelector("#sprzedawane-smaki").innerHTML = "";
    document.querySelector("#sprzedawane-towary-ilosc").innerHTML = "";
    document.querySelector("#przydzielone-kuwety").innerHTML = "";

    fetchRaportSprzedazFormyPlatnosci();
    fetchRaportSprzedazWartosc();
    fetchRaportSprzedazSmaki();
    fetchRaportSprzedazTowaryIlosc();
    fetchRaportSprzedazTowaryWartosc();
    fetchRaportPrzydzieloneKuwety();
  }
});

document.getElementById("raportujDatyNapis").addEventListener("click", () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  if (startDate > endDate) {
    alert("Data początkowa jest większa od  końcowej!");
    return;
  } else {
    document.querySelector("#formy-platnosci").innerHTML = "";
    document.querySelector("#sprzedawane-towary-wartosc").innerHTML = "";
    document.querySelector("#sprzedaz-wartosci-dzien").innerHTML = "";
    document.querySelector("#sprzedawane-smaki").innerHTML = "";
    document.querySelector("#sprzedawane-towary-ilosc").innerHTML = "";
    document.querySelector("#przydzielone-kuwety").innerHTML = "";

    fetchRaportSprzedazFormyPlatnosci();
    fetchRaportSprzedazWartosc();
    fetchRaportSprzedazSmaki();
    fetchRaportSprzedazTowaryIlosc();
    fetchRaportSprzedazTowaryWartosc();
    fetchRaportPrzydzieloneKuwety();

    document.querySelector(".centrala-filtrowanie-raporty").style.display =
      "none";
  }
});

document.getElementById("anulujRaportowanie").addEventListener("click", () => {
  document.querySelector(".centrala-filtrowanie-raporty").style.display =
    "none";
});

document.getElementById("pokazFiltrowanie").addEventListener("click", () => {
  document.querySelector(".centrala-filtrowanie-raporty").style.display =
    "flex";
});
