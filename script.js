//set the date
var d = new Date();
document.getElementById("date").innerHTML = d.toDateString().slice(4, 15);


//function for the clock
(function () {

    var clockElement = document.getElementById("clock");

    function updateClock(clock) {
        clock.innerHTML = new Date().toLocaleTimeString();
    }

    setInterval(function () {
        updateClock(clockElement);
    }, 1000);

}());


var dataReceived;

//function to return number with commas
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//function to update the data for states
function stateHandler() {
    // Create a request variable and assign a new XMLHttpRequest object to it.
    var request = new XMLHttpRequest();
    // Open a new connection, using the GET request on the URL endpoint
    request.open('GET', 'https://api.rootnet.in/covid19-in/stats/latest', true);

    request.onload = function () {
        // Begin accessing JSON data here
        dataReceived = JSON.parse(this.response);
        addStateOptionsInDropdown(dataReceived);
        //update country data
        countryHandler(dataReceived);
    }
    // Send request
    request.send();
}

stateHandler();

//function to update the data for country
function countryHandler() {
    $(".confirmed .countryVal").text(numberWithCommas(dataReceived.data.summary.total));
    $(".indians .countryVal").text(numberWithCommas(dataReceived.data.summary.confirmedCasesIndian));
    $(".foreign .countryVal").text(numberWithCommas(dataReceived.data.summary.confirmedCasesForeign));
    $(".discharged .countryVal").text(numberWithCommas(dataReceived.data.summary.discharged));
    $(".deaths .countryVal").text(numberWithCommas(dataReceived.data.summary.deaths));
}


//function to update the total samples tested
function updatedTotalSamplesTested() {
    // Create a request variable and assign a new XMLHttpRequest object to it.
    var request = new XMLHttpRequest();
    // Open a new connection, using the GET request on the URL endpoint
    request.open('GET', 'https://api.covid19india.org/data.json', true);

    request.onload = function () {
        // Begin accessing JSON data here
        var data = JSON.parse(this.response);
        var val = data.tested[data.tested.length - 1].totalsamplestested;
        if (val == '')
            val = data.tested[data.tested.length - 2].totalsamplestested;
        //update the field
        $(".samples .countryVal").text(numberWithCommas(val));

    }
    // Send request
    request.send();
}
updatedTotalSamplesTested();

//function to add the options for state dropdown
function addStateOptionsInDropdown(dataReceived) {
    //code to add options for state
    var min = 0,
        max = dataReceived.data.regional.length;
    select = document.getElementById('select-region');

    for (var i = min; i < max; i++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = dataReceived.data.regional[i].loc;
        select.appendChild(opt);
    }
}
var selectedStateName;
var selectedStateVal;
//function to set the selected state in heading
$("#select-region").change(function () {
    //show the state div
    $('.show-after-state-select').fadeIn();
    $('.show-after-resource-select').fadeOut();
    selectedStateVal = $("#select-region").val();
    //update the heading
    $("#selected-state").text("Coronavirus Stats in " + dataReceived.data.regional[selectedStateVal].loc);
    selectedStateName = dataReceived.data.regional[selectedStateVal].loc;
    //call function to populate state data
    populateStateStatistics(selectedStateVal);
    //scroll to the div after data populated
    $('html, body').animate({
        scrollTop: $("#select-region").offset().top
    }, 500);
});


//populate the selected state data
function populateStateStatistics(selectedStateVal) {
    $(".stateTotalConfirmed .statsVal").text(numberWithCommas(dataReceived.data.regional[selectedStateVal].totalConfirmed));
    $(".stateIndians .statsVal").text(numberWithCommas(dataReceived.data.regional[selectedStateVal].confirmedCasesIndian));
    $(".stateForeign .statsVal").text(numberWithCommas(dataReceived.data.regional[selectedStateVal].confirmedCasesForeign));
    $(".stateDischarge .statsVal").text(numberWithCommas(dataReceived.data.regional[selectedStateVal].discharged));
    $(".stateDeaths .statsVal").text(numberWithCommas(dataReceived.data.regional[selectedStateVal].deaths));
    //call function to update district level data for the state
    getDistrictLevelData();
}

//function to fetch the districtlevel data object
function getDistrictLevelData() {
    // Create a request variable and assign a new XMLHttpRequest object to it.
    var request = new XMLHttpRequest();
    // Open a new connection, using the GET request on the URL endpoint
    request.open('GET', 'https://api.covid19india.org/v2/state_district_wise.json', true);

    request.onload = function () {
        // Begin accessing JSON data here
        var data = JSON.parse(this.response);
        //call function to update the district table
        updateDistrictStatsInTable(data);
    }
    // Send request
    request.send();
}


//function to update the district stats on the table
function updateDistrictStatsInTable(districtData) {
    //update spelling errors for telangana and nagaland
    if (selectedStateName == 'Telengana')
        selectedStateName = 'Telangana';
    if (selectedStateName == 'Nagaland#')
        selectedStateName = 'Nagaland';
    var positionOfStateInDistrictObject;

    for (var i = 0; i < districtData.length; i++) {
        if (selectedStateName == districtData[i].state) {
            positionOfStateInDistrictObject = i;
            break;
        }
    }
    // update the table
    $("tbody").empty();
    for (var i = 0; i < districtData[positionOfStateInDistrictObject].districtData.length; i++) {
        var districtName = districtData[positionOfStateInDistrictObject].districtData[i].district;
        var confCasesInDistrict = districtData[positionOfStateInDistrictObject].districtData[i].confirmed;
        $('table > tbody:last-child').append('<tr><td>' + districtName + '</td><td>' + confCasesInDistrict + '</td></tr>');
    }
    //call function to sort table in descending order
    sortTable(1, 'd');
    getResourceObject();

}
var resourceData;
//function to get number of resources
function getResourceObject() {
    // Create a request variable and assign a new XMLHttpRequest object to it.
    var request = new XMLHttpRequest();
    // Open a new connection, using the GET request on the URL endpoint
    request.open('GET', 'https://api.covid19india.org/resources/resources.json', true);

    request.onload = function () {
        // Begin accessing JSON data here
        resourceData = JSON.parse(this.response);
        //get the resource count
        getResourceCountForState(resourceData);
    }
    // Send request
    request.send();
}

function getResourceCountForState(resourceData) {
    let myMap = new Map();
    //check if selected name has 'and', replace by '&'
    selectedStateName = selectedStateName.replace(" and ", ' & ');
    resourceData.resources.forEach(function (resource) {
        if (myMap.has(resource.category) && resource.state == selectedStateName) {
            var count = myMap.get(resource.category);
            ++count;
            //increment the value
            myMap.set(resource.category, count);
        } else if (resource.state == selectedStateName) {
            //set the value
            myMap.set(resource.category, 1);
        }
    });
    populateResourceData(myMap);
}

//function to populate the resources options for selected state
function populateResourceData(myMap) {
    //code to add options for resource
    var i = 0;
    select = document.getElementById('select-resource');
    //clear the previous options body
    $('#select-resource')
        .empty()
        .append('<option value="">Select Resource To View</option>');

    for (const [key, value] of myMap.entries()) {
        //add the keys to the table if option is not equal to other
        if (key !== 'Other' && key !== 'Government Helpline' && key !== 'Police' && key !== 'Ambulance' && key !== 'Transportation' && key !== 'Fire services' && key !== 'Hospitals and Centers' && key !== 'Hospitals and centers' && key !== 'Fire Brigade') {
            var opt = document.createElement('option');
            opt.value = i;
            ++i;
            opt.innerHTML = key;
            select.appendChild(opt);
        }
    }
}

//function to populate the resources based on the option selected
$("#select-resource").change(function () {
    //show that section on UI
    $('.show-after-resource-select').fadeIn();
    selectedResourceVal = $("#select-resource option:selected").text();
    console.log(selectedResourceVal);
    $('.category').text(selectedResourceVal);
    //iterate over resource Data to check for the selected resource
    $('.resource').empty();
    var listedMap = new Map();
    resourceData.resources.forEach(function (resource) {
        if (resource.category == selectedResourceVal && resource.state == selectedStateName && !listedMap.has(resource.nameoftheorganisation)) {
            //register on map
            console.log(listedMap.has(resource.nameoftheorganisation) + " is for " + resource.nameoftheorganisation);
            listedMap.set(resource.nameoftheorganisation, 1);
            //fill the details for the resource on UI level
            if (resource.phonenumber !== '')
                var htmlToAppend = '<div class="resource-card"><h1 class="nameOfOrg">' + resource.nameoftheorganisation + '</h1><h2 class="city">' + resource.city + '<h2 class="phone">Ph: ' + resource.phonenumber + '</h2></div>';
            else
                var htmlToAppend = '<div class="resource-card"><h1 class="nameOfOrg">' + resource.nameoftheorganisation + '</h1><h2 class="city">' + resource.city + '<h2 class="phone">Ph: Not Provided' + '</h2></div>';
            $(".resource").append(htmlToAppend);
        }


    });
    //scroll to the div after data populated
    $('html, body').animate({
        scrollTop: $("#select-resource").offset().top
    }, 500);

});

//function to sort the table
function sortTable(column, direction) {
    column = column || 0;
    var tbl = document.getElementById("sortableTable").tBodies[0];
    var store = [];
    for (var i = 0, len = tbl.rows.length; i < len; i++) {
        var row = tbl.rows[i];
        var sortnr = row.cells[column].textContent || row.cells[column].innerText;
        if (!isNaN(sortnr)) {
            sortnr = parseFloat(sortnr);
        }
        store.push([sortnr, row]);
    }
    store.sort(function (x, y) {
        return x[0] > y[0] ? 1 : x[0] < y[0] ? -1 : 0;
    });
    // look for "d" (descending) in the direction to switch sort direction
    if (direction && /d/.test(direction)) {
        store.reverse();
    }
    for (var i = 0, len = store.length; i < len; i++) {
        tbl.appendChild(store[i][1]);
    }
    store = null;
}