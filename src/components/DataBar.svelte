<script>
import * as d3 from 'd3'
let {
  trips, 
  stations, 
  selectedStation=$bindable(), 
  time = $bindable(), 
  animationOn = $bindable(), 
  start_of_day, 
  end_of_day
} = $props()
let time_animation_scale = $derived(d3.scaleTime().domain([start_of_day, end_of_day]).rangeRound([0,10000]))
let stationSearchString = $state('')
let filteredStationsArray = $derived(stations.filter(s=>s.station_name.toLowerCase().includes(stationSearchString.toLowerCase())))
</script>


<div class="time-display">
  Klockslag: {d3.timeFormat('%H:%M:%S')(time_animation_scale.invert(time))}
    <div>
        <input bind:value={time} type="range" id="time" name="time" min="0" max="10000" />

    </div>

    <input placeholder="Sök station..." class="input bg-base-100" type="text" bind:value={stationSearchString}>
    {#if stationSearchString !== ''}
    <div class="pt-5">
          {#each filteredStationsArray as station}
          <div onclick={()=>{
            selectedStation = undefined;
            
            setTimeout(()=>{selectedStation = station},100)
             
            
            stationSearchString=''}} class="mb-2 p-3 rounded shaddow-md hover:bg-base-300 hover:cursor-pointer">{station.station_name}</div>
        {/each}
    </div>

    {/if}


</div>





<style>
    .time-display {
  position: absolute;
  width: 400px;
  top: 10px;
  left: 900px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-family: sans-serif;
  font-size: 14px;
  border-radius: 4px;
}
#time{
    width:400px;
}
</style>
