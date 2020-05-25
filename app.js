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
        selectYear("2016")
    })

var color_no_data = "red"
var color_country = "black"
function drawMap(){
    //svg container
    let width = 1000;
    let height = 700;
    let svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "beige");

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
        .style("stroke", "white")
        .style("stroke-width", 1)
}

function selectYear(year){
    let data_year = obesityData.filter(el => el.year == year);
    data_year.forEach(el => {
        if(el.country_code.length == 3){
            let perc = el.obesity_percentage
            let country = d3.select("#" + el.country_code + ".country")
            if(perc == "No data"){
                country.style("fill", "red")
            } else {
                country.style("fill-opacity", perc / 100)
            }
        } 
    })
}