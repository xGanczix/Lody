async function fetchRaportSprzedazFormyPlatnosci() {
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedaz-formy-platnosci`
    );
    const data = await response.json();

    const formyPlatnosci = data.map((item) => item.DokFormaPlatnosci);
    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazy).toFixed(2)
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

async function fetchRaportSprzedazWartosc() {
  try {
    const response = await fetch(
      `${CONFIG.URL}/api/raport-sprzedazy-wartosci-dzien`
    );
    const data = await response.json();

    const wartosciSprzedazy = data.map((item) =>
      parseFloat(item.wartoscSprzedazyDzien).toFixed(2)
    );
    const dataSprzedazy = data.map((item) => item.SprzedazDzien.split("T")[0]);

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
        categories: dataSprzedazy,
      },
      title: {
        text: "Wartość sprzedaży według dni",
      },
      colors: colors.slice(0, dataSprzedazy.length),
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
});
