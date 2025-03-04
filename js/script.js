/*!
* Start Bootstrap - Resume v7.0.4 (https://startbootstrap.com/theme/resume)
* Copyright 2013-2021 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
*/
//
// Scripts

window.addEventListener('DOMContentLoaded', event => {
    // Activate Bootstrap scrollspy on the main nav element
    const sideNav = document.body.querySelector('#sideNav');
    if (sideNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // The list-view and map-view buttons
    document.getElementById('list-view').style.display = 'block';
    document.getElementById('map-view').style.display = 'none';

    document.getElementById('list-view-button').addEventListener('click', function () {
        document.getElementById('list-view-button').classList.remove('btn-outline-primary');
        document.getElementById('list-view-button').classList.add('btn-primary');
        document.getElementById('map-view-button').classList.remove('btn-primary');
        document.getElementById('map-view-button').classList.add('btn-outline-primary');
        document.getElementById('list-view').style.display = 'block';
        document.getElementById('map-view').style.display = 'none';
    });

    document.getElementById('map-view-button').addEventListener('click', function () {
        document.getElementById('map-view-button').classList.remove('btn-outline-primary');
        document.getElementById('map-view-button').classList.add('btn-primary');
        document.getElementById('list-view-button').classList.remove('btn-primary');
        document.getElementById('list-view-button').classList.add('btn-outline-primary');
        document.getElementById('map-view').style.display = 'block';
        document.getElementById('list-view').style.display = 'none';
    });
});

// Leaflet maps
var map = L.map('map').setView([30, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var locations = [
    { name: "Jeju, South Korea", coords: [33.4996, 126.5312], date: "2024/08" },
    { name: "San Francisco, USA", coords: [37.7749, -122.4194], date: "2024/02" },
    { name: "Vancouver, Canada", coords: [49.2827, -123.1207], date: "2024/02" },
    { name: "Tokyo, Japan", coords: [35.682839, 139.759455], date: "2023/03" },
    { name: "Dubai, UAE", coords: [25.276987, 55.296249], date: "2022/12" },
    { name: "Abu Dhabi, UAE", coords: [24.453884, 54.3773438], date: "2022/12" },
    { name: "Bangkok, Thailand", coords: [13.7563, 100.5018], date: "2018/07" },
    { name: "Nagoya, Japan", coords: [35.1815, 136.9066], date: "2017/06 - 2017/07" },
    { name: "Kyushu, Japan", coords: [32.7502, 129.8675], date: "2016/02" },
    { name: "Hokkaido, Japan", coords: [43.0642, 141.3469], date: "2015/08" },
    { name: "Kyoto, Japan", coords: [35.0116, 135.7681], date: "2014/07" },
    { name: "Kobe, Japan", coords: [34.6901, 135.1955], date: "2014/07" },
    { name: "Osaka, Japan", coords: [34.6937, 135.5023], date: "2014/07" },
    { name: "Chiang Mai, Thailand", coords: [18.7883, 98.9853], date: "2013/08" }
];

locations.forEach(location => {
    L.marker(location.coords)
        .addTo(map)
        .bindPopup(`<b>${location.name}</b><br>${location.date}`);
});