<script>
import * as d3 from 'd3'
let {
  trips, 
  stations, 
  selectedStation=$bindable(), 
  time = $bindable(), 
  animationOn = $bindable(), 
  showDatabar = $bindable(),
  start_of_day, 
  end_of_day
} = $props()
import {fade, fly} from 'svelte/transition'
let time_animation_scale = $derived(d3.scaleTime().domain([start_of_day, end_of_day]).rangeRound([0,10000]))
let stationSearchString = $state('')
let filteredStationsArray = $derived(stations.filter(s=>s.station_name.toLowerCase().includes(stationSearchString.toLowerCase())))
</script>


<div 
in:fly={{y:-100,duration:400, delay:500}}
out:fly={{y:-100,duration:400}}
class="absolute left-1/2 -translate-x-1/2 w-1/2  p-3 bg-white/90 rounded-lg shadow-lg">
  <div class="text-gray-600 font-bold text-2xl">
      TID: {d3.timeFormat('%H:%M')(time_animation_scale.invert(time))}

  </div>
    <div>
        <input type="range" min="0" max="10000" bind:value={time} class="mt-3 mb-3 range range-sm range-success w-full" />

    </div>

    <input type="text" placeholder="Sök station..." class="input input-md focus:border-2 focus:border-success bg-white text-gray-600 w-full" bind:value={stationSearchString} />
    
    {#if stationSearchString !== ''}
    <div class="pt-5">
          {#each filteredStationsArray as station}
          <div onclick={()=>{
            selectedStation = undefined;

            setTimeout(()=>{selectedStation = station; showDatabar = false},50)
             
            
            stationSearchString=''}} class="mb-2 p-3 rounded shaddow-md hover:bg-success hover:cursor-pointer text-gray-600">{station.station_name}</div>
        {/each}
    </div>

    {/if}


</div>





<style>

</style>
