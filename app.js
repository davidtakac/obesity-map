//data
var worldData;
var obesityData;
var availableCountries;
var selectedYearData;
//views
var tooltip, svg;
//colors
const colorNoData = "#9CAEA9";
const colorCountry = "#DD6031";
const colorSelected = "#EE4266";
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
        initTooltip();
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
            const dataExists = availableCountries.includes(d.id);
            return dataExists ? colorCountry : colorNoData;
        })
        .style("stroke", colorStroke)
        .style("stroke-width", strokeWidth)
        .on('mouseover', (d) => countrySelected(d))
        .on('mouseout', (d) => countryUnselected(d));

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

function initTooltip(){
    tooltip = d3.select("div.tooltip");
}

function countrySelected(data){
    if(!availableCountries.includes(data.id)) return;
    showTooltip(data)
    d3.select("#" + data.id + ".country")
        .style("fill", colorSelected);
}

function countryUnselected(data){
    if(!availableCountries.includes(data.id)) return;
    hideTooltip()
    d3.select("#" + data.id + ".country")
        .style("fill", getColor(selectedYearData.find(el => el.country_code == data.id).obesity_percentage));
}

function showTooltip(d){
    //populate tooltip with selected country data
    data = selectedYearData.find((el) => el.country_code == d.id)
    tooltip.select("#country").html(data.country)
    tooltip.select("#obesity_perc").html(data.obesity_percentage + " %")
    tooltip.select("#year").html(data.year)
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
    selectedYearData.forEach(el => {
        if(el.country_code.length == 3){
            let perc = el.obesity_percentage
            let country = d3.select("#" + el.country_code + ".country")
            if(perc == "No data"){
                country.style("fill", colorNoData)
            } else {
                //todo: replace with color gradient
                country.style("fill", getColor(perc))
            }
        } 
    })
}

function getColor(obesityPercentage){
    return d3.interpolateOrRd(obesityPercentage / 100)
}

function zoomed(){
    svg.selectAll('path')
        .attr('transform', d3.event.transform);
}