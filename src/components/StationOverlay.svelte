<script>
    import { onMount } from "svelte";
    import 'iconify-icon'
    let {selectedStation = $bindable(), showDatabar=$bindable()} = $props()
    import {fly, fade} from 'svelte/transition'
    import * as d3 from 'd3'
    
    let stationData = $state(undefined)
    $inspect(stationData)

    let width = 600;
	let height = 200;
	let marginTop = 30;
	let marginRight = 10;
	let marginBottom = 10;
	let marginLeft = 10;
    let departuresMax = $derived.by(()=>{
        if(stationData){
            let max_number_of_trips = d3.max(stationData.departures.map(d=>+d.number_of_trips))
            return max_number_of_trips
            
        }
    })

    let arrivalsMax = $derived.by(()=>{
        if(stationData){
            let max_number_of_trips = d3.max(stationData.arrivals.map(d=>+d.number_of_trips))
            return max_number_of_trips
            
        }
    })

    
   
    let xScale = d3.scaleLinear([0,23], [marginLeft, width - marginRight]);
    let departuresYScale = $derived(d3.scaleLinear([0,departuresMax], [height - marginBottom, marginTop]));
    let arrivalsYScale = $derived(d3.scaleLinear([0,arrivalsMax], [height - marginBottom, marginTop]));

    let departuresLine = d3.line()
        .x(function(d) { return xScale(+d.hour_of_day) }) 
        .y(function(d) { return departuresYScale(+d.number_of_trips)}) 
        .curve(d3.curveMonotoneX)

    let arrivalsLine = d3.line()
        .x(function(d) { return xScale(+d.hour_of_day) }) 
        .y(function(d) { return arrivalsYScale(+d.number_of_trips)}) 
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
class="absolute z-20 w-1/2 top-5 left-5 p-10 h-full rounded-lg shadow-lg bg-white/90">
    <div class="text-4xl text-gray-600 font-extrabold">{selectedStation.station_name}</div>
    <button class="font-bold  btn btn-circle btn-outline hive:scale-105 absolute top-2 right-2 bg-accent " onclick={()=>{selectedStation = undefined, showDatabar=true}}>
        <iconify-icon icon="lucide:x" width="24" height="24"></iconify-icon> 
    </button>
    <div class="text-xl text-gray-600 font-extrabold mt-5">Avgångar (per timma)</div>
    {#if stationData}
    
    <svg width={width} height ={height}>
            <defs>
                <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stop-color="rgba(0, 211, 144,0)"/>
                  
                  <stop offset="100%" stop-color="rgb(0, 211, 144)"/>
                </linearGradient>
              </defs>
   
      <path fill="url(#gradient)" stroke="rgb(0, 211, 144)" stroke-width="1.5" d={departuresLine(stationData.departures)} />
    </svg>
    <div class="text-xl text-gray-600 font-extrabold mt-5">Ankomster (per timma)</div>

        <svg width={width} height ={height}>
            <defs>
                <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stop-color="rgba(0, 211, 144,0)"/>
                  
                  <stop offset="100%" stop-color="rgb(0, 211, 144)"/>
                </linearGradient>
              </defs>
   
      <path fill="url(#gradient)" stroke="rgb(0, 211, 144)" stroke-width="1.5" d={arrivalsLine(stationData.arrivals)} />
    </svg>
    {/if}

</div>

