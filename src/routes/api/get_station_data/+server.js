import { json } from '@sveltejs/kit';
import { pool } from '$lib/server/db';

export async function POST({ request }) {
    try {
        const { stationName } = await request.json();
        
        
        




        if (!stationName) {
            return json({ error: 'stationName is required' }, { status: 400 });
        }

        console.log(stationName)

        const departuresRes = await pool.query(
            `
            WITH hours AS (
                SELECT generate_series(0, 23) AS hour_of_day
            ),
            trips_per_hour AS (
                SELECT 
                    EXTRACT(HOUR FROM start_time)::int AS hour_of_day,
                    COUNT(*) AS number_of_trips
                FROM trips
                WHERE start_station_name = $1
                AND start_time >= (CURRENT_DATE - INTERVAL '3 months')
                AND end_time   >= (CURRENT_DATE - INTERVAL '3 months')
                GROUP BY EXTRACT(HOUR FROM start_time)::int
            )
            SELECT 
                h.hour_of_day,
                COALESCE(t.number_of_trips, 0) AS number_of_trips
            FROM hours h
            LEFT JOIN trips_per_hour t USING (hour_of_day)
            ORDER BY h.hour_of_day;
            `,
            [stationName] // array of parameters, $1 matches stationName
        );

        const arrivalsRes = await pool.query(
            `
            WITH hours AS (
                SELECT generate_series(0, 23) AS hour_of_day
            ),
            trips_per_hour AS (
                SELECT 
                    EXTRACT(HOUR FROM end_time)::int AS hour_of_day,
                    COUNT(*) AS number_of_trips
                FROM trips
                WHERE end_station_name = $1
                AND start_time >= (CURRENT_DATE - INTERVAL '3 months')
                AND end_time   >= (CURRENT_DATE - INTERVAL '3 months')
                GROUP BY EXTRACT(HOUR FROM end_time)::int
            )
            SELECT 
                h.hour_of_day,
                COALESCE(t.number_of_trips, 0) AS number_of_trips
            FROM hours h
            LEFT JOIN trips_per_hour t USING (hour_of_day)
            ORDER BY h.hour_of_day;
            `,
            [stationName] // array of parameters, $1 matches stationName
        );

        const departures = departuresRes.rows
        const arrivals = arrivalsRes.rows

        // Station daily trips

        const dailyTripsRes = await pool.query(
            `
            SELECT
            to_char(start_time AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD') AS start_date,
            count(*)::int as total
            FROM trips
            WHERE start_station_name = $1
            GROUP BY 1
            ORDER BY 1 ASC


            `,[stationName]
        )
        const dailyTrips = dailyTripsRes.rows
        console.log(dailyTrips)
        return json({
            departures,
            arrivals,
            dailyTrips
        })
    

       

    } catch (err) {
        console.error(err);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
