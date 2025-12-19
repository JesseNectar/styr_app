// +page.server.js
import { pool } from '$lib/server/db';

function shiftTimestampsToToday(timestamps) {
  if (!timestamps.length) return [];

  const first = new Date(timestamps[0]);
  const today = new Date();

  // Set today to the same time-of-day as the first timestamp
  today.setHours(
    first.getHours(),
    first.getMinutes(),
    first.getSeconds(),
    first.getMilliseconds()
  );

  const delta = today.getTime() - timestamps[0];

  return timestamps.map(ts => ts + delta);
}

export async function load() {
    
    const stationsResult = await pool.query(
        
        `
        SELECT
        station_data
        FROM station_data_raw
        LIMIT 1
        
        `
    )
    let stations = stationsResult.rows[0].station_data.stations.map((s)=>{
        
        return {station_name: s.station_name, lat: s.lat, long: s.lng}
    
    })
    
    
    
    const tripsResult = await pool.query(
        `
        SELECT 
        *
        FROM trips

        -- Filter out only trips made the same weekday
        WHERE EXTRACT(DOW FROM start_time) = EXTRACT(DOW FROM CURRENT_DATE)

        -- Filter out any trip older than 3 months
        AND start_time >= (CURRENT_DATE - INTERVAL '3 months')
        AND end_time   >= (CURRENT_DATE - INTERVAL '3 months')
        ORDER BY start_time ASC;

        `
        );

        
        let trips = tripsResult.rows.map(t=>{
            return {...t, timestamps:shiftTimestampsToToday(t.timestamps)}
        })
    return {
        trips,
        stations
    };
}


//1766012403862
