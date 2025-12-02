// LAKY'S VIRTUAL TOUR v1.0.0

/* Map Types */
let osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})


const satelliteBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

const labels = L.esri.basemapLayer('ImageryLabels');
const transportation = L.esri.basemapLayer('ImageryTransportation');

const satelliteMap = L.layerGroup([satelliteBase, transportation, labels ]);

let baseMaps = {
    "Default": osm,
    "Satellite": satelliteMap
};

var map = L.map('map',
    {
        minZoom: 6,
        maxZoom: 19,
        layers: [osm]
    }
);
map.setView([28.412631731045128, -16.544176864035325], 13);

let layer_control = L.control.layers(baseMaps).addTo(map);

loadLocations().then(
  function(locations)
  {
    placeLocations(locations);
  }  
);

function placeLocations(locations)
{
    locations.forEach(location => {
        var marker = L.marker([location.lat, location.lon]);

        marker.on('click', function(){
            openPanel(location);
        });

        marker.addTo(map);
    });
}

async function loadLocations()
{
    const url = "locations.json";

    try
    {
        const response = await fetch(url);
        let responseJSON = await response.json();

        console.log(responseJSON);
        return responseJSON;
    }
    catch (error)
    {
        console.error(error.message);
    }
}