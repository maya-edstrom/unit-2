//declare map variable globally so all functions have access
let map;
let minValue;
let attributes;
let geojsonData;


//step 1 create map
function createMap(){
    map = L.map('map', {
        center: [45.7, -93.4],
        zoom: 8
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
}

function calculateMinValue(data){
    //create empty array to store all data values
    let allValues = [];
    //loop through each city
    for(let city of data.features){
        //loop through each year
        for(let year = 2010; year <= 2019; year+=5){
            //get population for current year
            let value = city.properties["AvgComTime"+ String(year)];
            //add value to array
            allValues.push(value);
        }
    }
    //get minimum value of our array
    minValue = Math.min(...allValues)
    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    let minRadius = 5;
    //Flannery Appearance Compensation formula
    let radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
    return radius;
}

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    let geojsonMarkerOptions = {
        fillColor: "#ff7800",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        radius: 8  // Adjusted to match the calculated radius
    };

    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            let attValue = Number(feature.properties[attributes]);
            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);  // Changed from options to geojsonMarkerOptions
            //create circle marker layer
            let layer = L.circleMarker(latlng, geojsonMarkerOptions);  // Changed from options to geojsonMarkerOptions
            //build popup content string starting with city
            let popupContent = "<p><b>City:</b> " + feature.properties.city + "</p>";
            // Add the attribute value to the popup content string
            popupContent += "<p><b>Avg Commute Time (" + attributes.slice(-4) + "):</b> " + attValue + " minutes" + "</p>";
            layer.bindPopup(popupContent);
            return layer;
        }
    }).addTo(map);
}

function createSequenceControls(){
    // Create an HTML input element of type 'range' for the slider
    var slider = "<input class='range-slider' type='range'>";
    // Insert the slider into the DOM under the element with the ID 'panel'
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    // Insert a 'Reverse' button into the DOM
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    // Insert a 'Forward' button into the DOM
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

    // Grab the slider element from the DOM
    var sliderElement = document.querySelector(".range-slider");
    // Set the maximum value of the slider to be one less than the length of the attributes array
    sliderElement.max = attributes.length - 1;
    // Set the minimum value of the slider to 0
    sliderElement.min = 0;
    // Set the initial value of the slider to 0
    sliderElement.value = 0;
    // Set the step size to 1, so the slider moves in increments of 1
    sliderElement.step = 1;

    // Add an event listener to the slider to call 'updateMap' function when the value changes
    sliderElement.addEventListener('input', function(){
        updateMap(sliderElement.value);
    });

    // Get the 'Reverse' button by its ID
    var reverseButton = document.getElementById("reverse");
    // Get the 'Forward' button by its ID
    var forwardButton = document.getElementById("forward");

    // Add an event listener to the 'Reverse' button
    reverseButton.addEventListener("click", function() {
        // Re-grab the slider element
        let sliderElement = document.querySelector(".range-slider");
        // Check if the slider value is greater than 0
        if(sliderElement.value > 0) {
            // Decrease the slider value by 1
            sliderElement.value--;
            // Update the map with the new slider value
            updateMap(sliderElement.value);
        }
    });

    // Add an event listener to the 'Forward' button
    forwardButton.addEventListener("click", function() {
        // Re-grab the slider element
        let sliderElement = document.querySelector(".range-slider");
        // Check if the slider value is less than the maximum allowed value
        if(sliderElement.value < attributes.length - 1) {
            // Increase the slider value by 1
            sliderElement.value++;
            // Update the map with the new slider value
            updateMap(sliderElement.value);
        }
    });
}


//build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    let attributes = [];

    //properties of the first feature in the dataset
    let properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (let attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("AvgComTime") > -1){
            attributes.push(attribute);
        }
    }

    return attributes;
}

function updateMap(value){
    let attribute = attributes[value];
    map.eachLayer(function(layer) {
        if (layer instanceof L.CircleMarker) {
            map.removeLayer(layer);

        }
    });
    createPropSymbols(geojsonData, attribute);
}
//Step 2: Import GeoJSON data
function getData(map) {
    //load the data
    fetch("data/AvgComTimesGJSON.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            geojsonData = json;
            attributes = processData(json);
            minValue = calculateMinValue(json);
            createPropSymbols(json, attributes[0]);
            createSequenceControls();

        })
}


document.addEventListener('DOMContentLoaded',createMap)
