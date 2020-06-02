var worldData, obesityData, codesDataAvailable;
d3.json("https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries-sans-antarctica.json")
    .then(countriesApiData => {
        worldData = countriesApiData;
        return d3.json("data/json/obesity.json")
    })
    .then(obesityApiData => {
        obesityData = obesityApiData
        codesDataExists = obesityApiData.map(el => el.country_code)
        drawMap()
        drawD3TimeSlider()
        selectYear(1975)
    })

var color_no_data = "#444140"
var color_country = "#DD6031"
var mapHeight = 800;
var svg;
function drawMap(){
    //svg container
    let width = document.getElementById("map").clientWidth;
    let height = mapHeight;
    svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    //the map
    let projection = d3.geoMercator().translate([width/2,height/2 + 125]);
    let path = d3.geoPath().projection(projection);
    svg.selectAll("path.country")
        .data(topojson.feature(worldData, worldData.objects.countries1).features)
        .enter()
        .append("path")
        .classed("country", true)
        .attr("d", path)
        .attr("id", (d) => d.id)
        .style("fill", (d) => {
            return codesDataExists.includes(d.id) ? color_country : color_no_data;
        })
        .style("stroke", "black")
        .style("stroke-width", 0.5)

    //zoom effect
    let zoom = d3.zoom()
        .scaleExtent([1,8])
        .on('zoom', zoomed);

    svg.call(zoom);
}

//adapted from https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
function drawD3TimeSlider(){
    let lower = 1975, upper = 2016
    let sliderHeight = 700;
    var sliderStep = d3.sliderRight()
        .min(lower)
        .max(upper)
        .height(sliderHeight)
        .tickFormat(d3.format(''))
        .ticks(upper - lower)
        .step(1)
        .default(1975)
        .on('onchange', year => selectYear(year))

    var gStep = d3.select('div#slider-step')
        .append('svg')
        .attr('width', 100)
        .attr('height', mapHeight)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderStep);
}

function selectYear(year){
    let data_year = obesityData.filter(el => el.year == year);
    data_year.forEach(el => {
        if(el.country_code.length == 3){
            let perc = el.obesity_percentage
            let country = d3.select("#" + el.country_code + ".country")
            if(perc == "No data"){
                country.style("fill", color_no_data)
            } else {
                country.style("fill-opacity", (perc + 10) / 100)
            }
        } 
    })
}

function zoomed(){
    svg
        .selectAll('path')
        .attr('transform', d3.event.transform);
}