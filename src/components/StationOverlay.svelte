<script>
    import { onMount } from "svelte";
    let {selectedStation = $bindable()} = $props()
    import {fly, fade} from 'svelte/transition'
    import * as d3 from 'd3'
    
    let stationData = $state(undefined)
    $inspect(stationData)

    let width = 700;
	let height = 300;
	let marginTop = 20;
	let marginRight = 20;
	let marginBottom = 50;
	let marginLeft = 40;

    let xScale = d3.scaleLinear([0,23], [marginLeft, width - marginRight]);
    let yScale = $derived(d3.scaleLinear([0,200], [height - marginBottom, marginTop]));

    let line = d3.line()
        .x(function(d) { return xScale(d.hour_of_day) }) 
        .y(function(d) { return yScale(d.number_of_trips)}) 
        .curve(d3.curveMonotoneX)
    
        $effect(async ()=>{
            let res = await fetch('/api/get_station_data',{
            method:'POST',
            headers: {
                'Content-Type': 'application/json'
            },
             body: JSON.stringify({
                stationName: selectedStation.station_name
            })
        })

        
        
        stationData = await res.json()

        })

</script>

<div
in:fade={{duration:1000, delay:2000}}
out:fade={{duration:500}}
class="absolute z-20 w-1/2 top-10 left-10 p-10 h-7/8 rounded-2xl shadow bg-white/90">
    <div class="text-4xl text-gray-600 font-extrabold">{selectedStation.station_name}</div>
    <button class="btn btn-primary btn-circle absolute top-2 right-2" onclick={()=>{selectedStation = undefined}}>
        X
    </button>
    {#if stationData}
 
    <svg width={width} height ={height}>
            <defs>
                <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stop-color="rgba(100, 149, 237,0)"/>
                  
                  <stop offset="100%" stop-color="rgb(65, 105, 225)"/>
                </linearGradient>
              </defs>
   
      <path fill="url(#gradient)" stroke="rgb(65, 105, 225)" stroke-width="1.5" d={line(stationData.departures)} />
    </svg>

        <svg width={width} height ={height}>
            <defs>
                <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stop-color="rgba(17,30,41,0)"/>
                  
                  <stop offset="100%" stop-color="rgb(65, 105, 225)"/>
                </linearGradient>
              </defs>
   
      <path fill="url(#gradient)" stroke="rgb(65, 105, 225)" stroke-width="1.5" d={line(stationData.arrivals)} />
    </svg>
    {/if}

</div>

