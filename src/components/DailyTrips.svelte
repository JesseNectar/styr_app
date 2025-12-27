<script>
    let { dailyTrips, weather_data } = $props()


  
    import { onMount } from 'svelte';
    import * as d3 from 'd3'

    let width = $state(0);
 
    let height = 350;
    let svg;

    const parseDate = d3.timeParse('%Y-%m-%d');

    const weatherDataWithParsedDate = weather_data.map(d => ({
        ...d,
        date: parseDate(d.date)
    }));

    const parsedData = $derived.by(() => {
    if (!dailyTrips || dailyTrips.length === 0) return [];

    const data = dailyTrips.map(d => ({
    date: parseDate(d.start_date),
    total: +d.total
    }));

    const first = data[0];
    const last = data[data.length - 1];

    return [
    { date: first.date, total: 0 },
    ...data,
    { date: last.date, total: 0 }
    ];
    });


    const margin = { top: 20, right: 40, bottom: 40, left: 25 };

    let chartWidth = $derived((width / 2)-margin.left -margin.right)

    let xScale = $derived.by(()=>{
        return d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.date))
        .range([margin.left, chartWidth - margin.right]);
    });

    let xAxis = $derived(d3.axisBottom(xScale)
    .ticks(d3.timeDay.every(1))
    .tickFormat(d3.timeFormat('%a %d')));

    let dailyTripsMax = $derived.by(()=>{
        return dailyTrips.length ? d3.max(dailyTrips, d => +d.total) : 0;
    })
    const arr = $derived(Array.from({ length: dailyTripsMax }, (_, i) => i));
    
    let dailyTripsYScale = $derived.by(()=>{
        return d3.scaleLinear([0,dailyTripsMax], [height - margin.bottom, margin.top + 35])
        }
    );

    let yAxis = $derived.by(() =>{
         return d3.axisLeft(dailyTripsYScale).ticks(10)
        } 
    );


    let yAxisG;
    let axisG;
   $effect(() => {

            // Remove old axes
        d3.select(svg).selectAll('.x-axis').remove();
        d3.select(svg).selectAll('.y-axis').remove();
    
        axisG = d3.select(svg)
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
            
        
        axisG.selectAll('text')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(-45)')
            .attr('dx', '-0.6em')
            .attr('dy', '0.15em')
            .attr('fill', d => {
                const day = d.getDay(); // 0 = Sunday, 6 = Saturday
                return (day === 0 || day === 6) ? '#C41E3A' : '#555';
            });

        yAxisG = d3.select(svg)
            .append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(yAxis);
        
        yAxisG.selectAll('text')
            .attr('text-anchor', 'end')
            .attr('dx', '-0.6em')
            .attr('dy', '0.15em')
            .attr('fill', '#555');


    });

    let dailyTripsLine = d3.line()
        .x(function(d) { return xScale(d.date) }) 
        .y(function(d) { return dailyTripsYScale(+d.total)}) 
        .curve(d3.curveMonotoneX)

    
   


</script>
<svelte:window bind:innerWidth={width} />

<div class="text-xl mt-3 mb-3 font-extrabold text-gray-600">Totalt antal avgångar per dag</div>

<svg {height} width = {chartWidth} bind:this={svg}>
    <defs>
    <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%"   stop-color="rgba(70, 130,180,0)"/>
        
        <stop offset="100%" stop-color="rgb(70, 130,180)"/>
    </linearGradient>
    </defs>

        {#each parsedData as pd}
        <line 
            x1={xScale(pd.date)}
            y1={height -margin.bottom}
            x2={xScale(pd.date)}
            y2={0+margin.top +35}
            stroke="lightgray"
            stroke-dasharray="1,2"

        />

        {/each}
        {#each arr as a}
        <line 
            x1={0+margin.left}
            y1={dailyTripsYScale(a+1)}
            x2={chartWidth-margin.right}
            y2={dailyTripsYScale(a+1)}
            stroke="lightgray"
            stroke-dasharray="1,2"

        />

        {/each}

        {#each weatherDataWithParsedDate as d}
        <image
            class=""
            href={`/wicons/animated/${d.icon}`}
            x={xScale(d.date) - 30}  
            y={-10}
            width="60"
            height="60"
        />
        {/each}
   
      <path fill="url(#gradient)" stroke="rgb(70, 130,180)" stroke-width="2.0" d={dailyTripsLine(parsedData)} />
  



</svg>


