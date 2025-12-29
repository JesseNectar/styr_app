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
            WITH days AS (
            SELECT generate_series(current_date - interval '29 days', current_date, interval '1 day')::date as day
            ),

            daily_totals AS (

            SELECT 
            (start_time AT TIME ZONE 'Europe/Stockholm')::date AS start_date, 
            count(*)::int as total 
            FROM trips 
            WHERE start_station_name = $1
            GROUP BY 1 
            ORDER BY 1 ASC
            )

            SELECT
            to_char(d.day, 'YYYY-MM-DD') as start_date,
            coalesce(dt.total, 0)::int as total
            FROM days d 
            LEFT JOIN daily_totals dt on d.day = dt.start_date;
            `,[stationName]
        )
        const dailyTrips = dailyTripsRes.rows
        
        // total trips for day so far

        const dailyTotalRes = await pool.query(
            `
            SELECT
            count(*) as total_trips,
            SUM(distance_in_m) as total_m
            FROM trips 
            WHERE start_station_name = $1
            --AND start_time::date = current_date
            `,[stationName]
        )
        const dailyTotals = dailyTotalRes.rows
        
        // top 5 most popular end stations
        
        const top5DestinationsRes = await pool.query(
            `
            WITH end_station_top_list AS (
            
            SELECT
            end_station_name,
            COUNT(*) as total
            FROM trips
            WHERE start_station_name = $1
            GROUP BY 1

            )

            SELECT
            *
            FROM end_station_top_list
            ORDER BY total DESC
            LIMIT 5
            `,[stationName]


        )
        const top5Destinations = top5DestinationsRes.rows
        console.log(top5Destinations)

        
        return json({
            departures,
            arrivals,
            dailyTrips,
            dailyTotals,
            top5Destinations
        })
    

       

    } catch (err) {
        console.error(err);
        return json({ error: 'Server error' }, { status: 500 });
    }
}
