//data
var worldData;
var obesityData;
var availableCountries;
var selectedYearData;
//views
var tooltip;
var svg;
var countries;
//colors
const colorNoData = "#9CAEA9";
const colorSelected = "#8FA6CB";
const colorStroke = "black";
//dimensions
var mapHeight = 800;
var strokeWidth = 0.5;
//defaults
const defaultYear = 2000;

//fetches data and then initializes page
d3.json("https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries-sans-antarctica.json")
    .then(topojson => {
        worldData = topojson;
        return d3.json("data/json/obesity.json");
    })
    .then(data => {
        obesityData = data;
        availableCountries = obesityData
            .filter(el => el.obesity_percentage != "No data")
            .map(el => el.country_code);
        
        //initialize page
        drawMap();
        drawD3TimeSlider();
        drawColorLegend();
        initTooltip();
        initYearBanner();
        selectYear(defaultYear);
    });


function drawMap(){
    //svg container
    let width = document.getElementById("map").clientWidth;
    let height = mapHeight;
    svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("border", "black")

    //the map
    let projection = d3.geoMercator().translate([width/2,height/2 + 125]);
    let path = d3.geoPath().projection(projection);
    countries = svg.selectAll("path.country")
        .data(topojson.feature(worldData, worldData.objects.countries1).features)
        .enter()
        .append("path")
        .classed("country", true)
        .attr("d", path)
        .style("stroke", colorStroke)
        .style("stroke-width", strokeWidth)
        .on('mouseover', function(d, i){ countrySelected(d, this) })
        .on('mouseout', function(d, i){ countryUnselected(d, this) });

    //zooming
    let zoom = d3.zoom()
        .scaleExtent([1,8])
        .on('zoom', zoomed);
    svg.call(zoom)
        //disables panning
        //.on("mousedown.zoom", null);
}

//adapted from https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
function drawD3TimeSlider(){
    const lower = 1975, upper = 2016
    const sliderWidth = 100;
    const sliderHeight = mapHeight - 100;
    var sliderStep = d3.sliderRight()
        .min(lower)
        .max(upper)
        .height(sliderHeight)
        //outputs years as 1975 instead of 1,975
        .tickFormat(d3.format(''))
        .ticks(upper - lower)
        .step(1)
        .default(defaultYear)
        .on('onchange', year => selectYear(year))

    var gStep = d3.select('div#slider-step')
        .append('svg')
        .attr('width', sliderWidth)
        .attr('height', mapHeight)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gStep.call(sliderStep);
}

function drawColorLegend(){
    const legendHeight = mapHeight - 75;
    const legendWidth = 25;
    const legend = d3.select("#legend-container")
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
    
    const defs = legend.append("defs");
    const linearGradient = defs
        .append("linearGradient")
        .attr("id", "linear-gradient");

    //gradient direction bottom to top
    linearGradient
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    //gradient steps
    linearGradient.selectAll("stop")
        .data(d3.range(0, 100))
        .enter()
        .append("stop")
        .attr("offset", function(d) { return d + "%"; })
        .attr("stop-color", function(d) { return getColor(d) });

    //append a rectangle whose fill will be determined by created gradient
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)")
        .style("stroke", "black");
}

function initTooltip(){
    tooltip = d3.select("div.tooltip");
}

function initYearBanner(){
    yearBanner = d3.select("#year-banner");
}

function countrySelected(data, countryPath){
    if(!availableCountries.includes(data.id)) return;
    showTooltip(data)
    d3.select(countryPath).style("fill", colorSelected);
}

function countryUnselected(data, countryPath){
    if(!availableCountries.includes(data.id)) return;
    hideTooltip()
    d3.select(countryPath).style("fill", getColor(getObesityPercentage(data.id)));
}

function showTooltip(d){
    //populate tooltip with selected country data
    data = selectedYearData.find((el) => el.country_code == d.id)
    tooltip.select("#country").text(data.country)
    tooltip.select("#obesity_perc").text(data.obesity_percentage + " %")
    tooltip.select("#year").text(data.year)
    //move tooltip to cursor
    tooltip
        .style("left", (d3.event.pageX) + "px")		
        .style("top", (d3.event.pageY) + "px");	
    //fade into view
    tooltip.transition()	
        .duration(200)
        .style("opacity", 1)
}

function hideTooltip(){
    //fade out
    tooltip.transition()
        .duration(200)
        .style("opacity", 0);
}

function selectYear(year){
    selectedYearData = obesityData.filter(el => el.year == year);
    countries.each(function(d, i) {
            const perc = getObesityPercentage(d.id)
            d3.select(this).style("fill", perc ? getColor(perc) : colorNoData);
        });
    yearBanner.text(year)
}

function getColor(obesityPercentage){
    return d3.interpolateOrRd(obesityPercentage / 100)
}

/**
 * Returns obesity percentage for country code in currently selected year or false
 */
function getObesityPercentage(countryCode){
    const countryData = selectedYearData.find(el => el.country_code == countryCode)
    if(countryData){
        const perc = countryData.obesity_percentage
        return isNaN(perc) ? false : perc;
    } else {
        return false;
    }
}

function zoomed(){
    svg.selectAll('path').attr('transform', d3.event.transform);
}