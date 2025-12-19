
<script>
    
  import "../app.css";
    import DeckMap from "../components/DeckMap.svelte";
    import DataBar from "../components/DataBar.svelte";
    import StationOverlay from "../components/StationOverlay.svelte";
    let { data } = $props()
    let trips = $derived(data.trips)
    let stations = data.stations
    let showDatabar = $state(true)

    let selectedStation = $state(undefined)

   


    let animationOn = $state(true)

    let time = $state(0)

        setInterval(() => {
        if(animationOn){
            time += 1
        }
        }, 30);


        // This is the start and end times of today
    let start_of_day = new Date(new Date().setHours(6, 0, 0, 0));

    let end_of_day = new Date()

    
</script>
<DeckMap selectedStation={selectedStation} stations={stations} trips={trips} time={time} start_of_day = {start_of_day.getTime()} end_of_day = {end_of_day.getTime()}/>

{#if showDatabar}
<DataBar bind:showDatabar={showDatabar} bind:selectedStation={selectedStation} stations = {stations} trips bind:time = {time} bind:animationOn = {animationOn} start_of_day = {start_of_day.getTime()} end_of_day = {end_of_day.getTime()} />
{/if}
{#if selectedStation}
<StationOverlay bind:showDatabar={showDatabar} bind:selectedStation = {selectedStation} />
{/if}




