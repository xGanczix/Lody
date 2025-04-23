const decoded = parseJwt(token);
const uzytkownikId = decoded.id;

async function fetchRaportSprzedazFormyPlatnosci() {
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedaz-formy-platnosci/${uzytkownikId}`
    );
    const data = await response.json();

    const formyPlatnosci = data.map((item) => item.DokFormaPlatnosci);
    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazy.replace(/,/g, "")).toFixed(2)
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
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-ilosci-smaki/${uzytkownikId}`
    );
    const data = await response.json();

    const iloscSprzedana = data.map((item) => item.iloscSprzedana);
    const SmkNazwa = data.map((item) => item.SmkNazwa);
    const SmkKolor = data.map((item) => item.SmkKolor);
    const SmkTekstKolor = data.map((item) => item.SmkTekstKolor);

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

async function fetchRaportSprzedazWartosc() {
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-wartosci-dzien/${uzytkownikId}`
    );
    const data = await response.json();

    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazyDzien.replace(/,/g, "")).toFixed(2)
    );
    const dataSprzedazy = data.map((item) => item.SprzedazDzien.split("T")[0]);

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
        formatter: function (val) {
          return parseFloat(val).toFixed(2);
        },
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

document.addEventListener("DOMContentLoaded", () => {
  fetchRaportSprzedazFormyPlatnosci();
  fetchRaportSprzedazWartosc();
  fetchRaportSprzedazSmaki();
});
