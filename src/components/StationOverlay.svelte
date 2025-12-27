<script>
    import { onMount } from "svelte";
    import DailyTrips from "./DailyTrips.svelte";
    import 'iconify-icon'
    let {selectedStation = $bindable(), showDatabar=$bindable(), weather_data} = $props()
    import {fly, fade} from 'svelte/transition'
    import * as d3 from 'd3'
    
    let stationData = $state(undefined)
    
    let width = 450;
	let height = 200;
	let marginTop = 30;
	let marginRight = 10;
	let marginBottom = 20;
	let marginLeft = 20;

    let svg = $state(undefined)
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

    let gxArrivals = $state(undefined);
	let gyArrivals = $state(undefined);
    let gxDepartures = $state(undefined);
	let gyDepartures = $state(undefined);

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
    
      console.log('SCALE: ',d3.axisBottom().scale(xScale))  
    
    
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
        console.log(stationData)


        })

    $effect(() => {
        if (!gxDepartures || !stationData) return;

        const xAxis = d3.axisBottom(xScale)
            .ticks(24)
            //.tickFormat(d => `${d}:00`);

        d3.select(gxDepartures).call(xAxis);

        
        const yAxis = d3.axisLeft(departuresYScale)

        d3.select(gyDepartures).call(yAxis)
    });



</script>

<div
in:fade={{duration:1000, delay:2000}}
out:fly={{x:-200,duration:500}}
class="absolute z-20 w-1/2 top-0 left-0 p-10 h-full shadow-lg bg-white/90">
    <div class="text-4xl text-gray-600 font-extrabold">{selectedStation.station_name}</div>
    <button class="font-bold  btn btn-primary btn-circle hover:scale-105 absolute top-2 right-2 " onclick={()=>{selectedStation = undefined, showDatabar=true}}>
        <iconify-icon icon="lucide:x" width="24" height="24"></iconify-icon> 
    </button>

    <!--DAILY TRIPS WITH WEATHER ICONS-->
    {#if stationData}
    <DailyTrips weather_data={weather_data} dailyTrips={stationData.dailyTrips} />
    {/if}
    <!-- <div class="text-xl text-gray-600 font-extrabold mt-5">Avgångar (per timma)</div>
    {#if stationData}
    
    <svg bind:this={svg} width={width} height ={height}>
            <defs>
                <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stop-color="rgba(0, 211, 144,0)"/>
                  
                  <stop offset="100%" stop-color="rgb(0, 211, 144)"/>
                </linearGradient>
              </defs>
   
      <path fill="url(#gradient)" stroke="rgb(0, 211, 144)" stroke-width="1.5" d={departuresLine(stationData.departures)} />
      <g class="text-gray-600 mt-5" bind:this={gxDepartures} transform="translate(0,{height - marginBottom})" />
    <g class= "text-gray-600" bind:this={gyDepartures} transform="translate({marginLeft},0)" />

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
    {/if} -->

</div>

