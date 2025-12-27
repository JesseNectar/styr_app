<script>
//IMPORTS ETC
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import * as d3 from 'd3';
import {onMount} from 'svelte'
let { trips, stations, time, start_of_day, end_of_day, selectedStation } = $props()
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import mapboxgl from 'mapbox-gl'; 
import {MapboxOverlay as DeckOverlay} from '@deck.gl/mapbox';
import {TripsLayer} from '@deck.gl/geo-layers';
import { ColumnLayer } from '@deck.gl/layers';

let time_animation_scale = $derived(d3.scaleTime().domain([start_of_day, end_of_day]).rangeRound([0,10000]))

let map;
let mapContainer;

let pathColor=[70, 130,180]
let deckOverlay = $state(new DeckOverlay({}))

$effect(() => {
  const layers = [
    new TripsLayer({
      id: 'trips-layer',
      data: trips,
      getPath: d => d.path_array,
      getTimestamps: d => d.timestamps.map(d => time_animation_scale(+d)),
      getColor: pathColor,
      opacity: 1,
      widthMinPixels: 3,
      fadeTrail: true,
      trailLength: 10,
      currentTime: time,
      coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      capRounded: true,
      jointRounded: true
    })
  ];

  if (selectedStation) {
    layers.push(
      new ColumnLayer({
        id: 'station-marker',
        data: [selectedStation],
        diskResolution: 25,
        radius: 10,
        elevationScale: 0.1,
        extruded: true,
        getPosition: d => [d.long, d.lat],
        getFillColor: pathColor,
        getElevation: 200,
        pickable: false
      })
    );
  }
  deckOverlay.setProps({ layers });
});

onMount(() => {
    map = new mapboxgl.Map({
    container: mapContainer,
    accessToken: 'pk.eyJ1IjoiamVzc2VuZWN0YXIiLCJhIjoiY2xtbHp5aXZ4MGhzYjJxbnkwcnFudnJldCJ9.ntcJa5PbkxwMQyVC1Tdobg',
    style: `mapbox://styles/mapbox/streets-v12?optimize=true`,
    center: [11.952377, 57.700481],
    zoom: 12.9,
    pitch:68,
    bearing:-90
    });   
    map.addControl(deckOverlay)
});

$effect(()=>{
    if (!map || !selectedStation) return;
    const container = map.getContainer();
    const width = container.clientWidth;
    map.flyTo({
        center: [selectedStation.long, selectedStation.lat],
        zoom: 16,
        speed: 0.4,
        bearing:0,
        pitch:50,
        curve: 2,
        offset: [width / 4, 0],
        easing: cubicOut
    });
})

</script>

<div class="map" bind:this={mapContainer} />
<div class="time-display">
  Current Time: {d3.timeFormat('%H:%M:%S')(time_animation_scale.invert(time))}
</div>

<style>
.map {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity:1;
  margin:auto;
}

</style>
    
    
    




  






