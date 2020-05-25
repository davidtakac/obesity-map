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
        drawTimeSlider()
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

//adapted from https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
function drawTimeSlider(){
    let lower = 1975, upper = 2016;
    var dataTime = d3.range(0, (upper + 1) - lower).map(d => new Date(lower + d, 10, 3));

    var sliderTime = d3
        .sliderBottom()
        .min(d3.min(dataTime))
        .max(d3.max(dataTime))
        .step(1000 * 60 * 60 * 24 * 365)
        .width(300)
        .tickFormat(d3.timeFormat('%Y'))
        .tickValues(dataTime)
        .default(new Date(lower, 10, 3))
        .on('onchange', val => {
            selectYear(d3.timeFormat('%Y')(val))
            d3.select('p#value-time').text(d3.timeFormat('%Y')(val));
        });

    var gTime = d3
        .select('div#slider-time')
        .append('svg')
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

    gTime.call(sliderTime);

    d3.select('p#value-time').text(d3.timeFormat('%Y')(sliderTime.value()));
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