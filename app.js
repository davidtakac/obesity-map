var worldData, obesityData, codesDataExists;
var tooltip;
d3.json("https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries-sans-antarctica.json")
    .then(countriesApiData => {
        worldData = countriesApiData;
        return d3.json("data/json/obesity.json")
    })
    .then(obesityApiData => {
        obesityData = obesityApiData
        codesDataExists = obesityApiData.filter(el => el.obesity_percentage != "No data").map(el => el.country_code)
        drawMap()
        drawD3TimeSlider()
        initTooltip()
        selectYear(1975)
    })

var color_no_data = "#444140"
var color_country = "#DD6031"
var color_country_selected = "#5BC3EB"
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
        .on('click', (d) => countrySelected(d))
        .on('mouseout', (d) => countryUnselected(d));

    //zooming
    let zoom = d3.zoom()
        .scaleExtent([1,8])
        .on('zoom', zoomed);
    //disables panning
    svg.call(zoom).on("mousedown.zoom", null);
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
        .default(lower)
        .on('onchange', year => selectYear(year))

    var gStep = d3.select('div#slider-step')
        .append('svg')
        .attr('width', 100)
        .attr('height', mapHeight)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderStep);
}

function initTooltip(){
    // Define the div for the tooltip
    tooltip = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
}

function countrySelected(data){
    if(!codesDataExists.includes(data.id)) return;
    //get country data from data.id
    showTooltip(data)
    //get country and change fill color to color_country_selected

    d3.select("#" + data.id + ".country")
        .style("fill", color_country_selected);
}

function countryUnselected(data){
    if(!codesDataExists.includes(data.id)) return;
    //get country with data.id and change color to match selected year
    hideTooltip()
    d3.select("#" + data.id + ".country")
        .style("fill", color_country);
}

function showTooltip(d){
    tooltip.transition()	
        .duration(200)		
        .style("opacity", .9)
    tooltip.html(d.id)
        .style("left", (d3.event.pageX) + "px")		
        .style("top", (d3.event.pageY) + "px");	
}

function hideTooltip(){
    tooltip.transition()
        .duration(200)
        .style("opacity", 0);
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