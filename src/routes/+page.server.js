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

function classifyDailyCloudiness(hourlySunData) {
  const dailySunSeconds = {};

  // 1. Summera solskenstid per dag
  hourlySunData.forEach(item => {
    const dateStr = new Date(item.date).toISOString().split('T')[0];
    if (!dailySunSeconds[dateStr]) dailySunSeconds[dateStr] = 0;
    dailySunSeconds[dateStr] += Number(item.value);
  });

  const result = [];

  // 2. Klassificera per dag
  for (const date in dailySunSeconds) {
    const sunHours = dailySunSeconds[date] / 3600;
    const month = new Date(date).getMonth() + 1;

    let cloudiness;

    // 🌨️ Vinter (dec–feb)
    if (month === 12 || month <= 2) {
      if (sunHours < 0.5) cloudiness = 'molnigt';
      else if (sunHours < 2) cloudiness = 'halvklart';
      else cloudiness = 'soligt';
    }
    // 🌱 Vår & 🍂 höst
    else if (month <= 5 || month >= 9) {
      if (sunHours < 1) cloudiness = 'molnigt';
      else if (sunHours < 4) cloudiness = 'halvklart';
      else cloudiness = 'soligt';
    }
    // ☀️ Sommar (jun–aug)
    else {
      if (sunHours < 2) cloudiness = 'molnigt';
      else if (sunHours < 6) cloudiness = 'halvklart';
      else cloudiness = 'soligt';
    }

    result.push({
      date,
      cloudiness
    });
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}



export async function load() {
    
    // STATIONS

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
    
    
    // TRIPS
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

    // WEATHER
    //fetching
    const temperature_data = await fetch('https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/2/station/71420/period/latest-months/data.json')
    const average_temperatures = await temperature_data.json()
    const avg_temps = average_temperatures.value.slice(-30)
    
    const min_temperature_data = await fetch('https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/19/station/71420/period/latest-months/data.json')
    const min_temperatures = await min_temperature_data.json()
    const min_temps = min_temperatures.value.slice(30)
 
    const cloud_data = await fetch('https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/10/station/71415/period/latest-months/data.json')
    const cloud_data_per_hour = await cloud_data.json()
    const cloudy_percent = classifyDailyCloudiness(cloud_data_per_hour.value).slice(-31,-1)
    
    const precipitation_data = await fetch('https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/5/station/71420/period/latest-months/data.json')
    const precipitation = await precipitation_data.json()
    const precip = precipitation.value.slice(-30)

    function generate_weather_data(at,mt,cp,pre){
  
        let weather_data = []
        cp.forEach((c)=>{
            
            console.log('DATE: ', c.date)

            let avg_temp_obj_for_day = at.find(a =>c.date === a.ref)
            let avg_temp_for_day = avg_temp_obj_for_day.value
            console.log('AVG TEMP: ', avg_temp_for_day)
            let min_temp_obj_for_day = mt.find(m =>c.date === m.ref)
            let min_temp_for_day = min_temp_obj_for_day.value

            console.log('MIN TEMP: ', min_temp_for_day)

            let precipitation_obj_for_day = pre.find(p =>c.date === p.ref)
            let precipitation_for_day = precipitation_obj_for_day.value

            console.log('PRECIPITATION: ', precipitation_for_day)

            if(precipitation_for_day == 0.0){
                // This means no precipitation so we should return based on the cloudiness
                if(c.cloudiness === 'soligt'){

                    weather_data.push({
                        date: c.date,
                        avg_temp:avg_temp_for_day,
                        icon: 'day.svg'
                    })

                }
                if(c.cloudiness === 'halvklart'){

                    weather_data.push({
                        date: c.date,
                        avg_temp:avg_temp_for_day,
                        icon: 'cloudy-day-3.svg'
                    })

                }
                if(c.cloudiness === 'molnigt'){

                    weather_data.push({
                        date: c.date,
                        avg_temp:avg_temp_for_day,
                        icon: 'cloudy.svg'
                    })

                }



            } else {
                //this means there was precipitation
                // First we check whether the min temperature was below -1, in which case precipitation is now
                if(min_temp_for_day <= -1){

                    if(c.cloudiness === 'molnigt'){
                        if(precipitation_for_day <= 1.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'snowy-4.svg'
                            })
                        }

                        if(precipitation_for_day > 1.0 && precipitation_for_day <= 5.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'snowy-5.svg'
                            })
                        }
                        if(precipitation_for_day > 5){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'snowy-6.svg'
                            })
                        }
        
                    }

                    if(c.cloudiness === 'halvklart'){
                           if(precipitation_for_day <= 1.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'snowy-2.svg'
                            })
                        }

                        if(precipitation_for_day > 1.0 && precipitation_for_day <= 5.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'snowy-3.svg'
                            })
                        }
                    }

                    if(c.cloudiness === 'soligt'){
                        weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'snowy-1.svg'
                        })

                    }


                } else{
                    // This means that the precipitation is rain
                    if(c.cloudiness === 'molnigt'){
                        if(precipitation_for_day <= 1.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'rainy-4.svg'
                            })
                        }

                        if(precipitation_for_day > 1.0 && precipitation_for_day <= 5.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'rainy-5.svg'
                            })
                        }
                        if(precipitation_for_day > 5 && precipitation_for_day <= 15){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'rainy-6.svg'
                            })
                        }
                        if(precipitation_for_day > 15){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'rainy-7.svg'
                            })
                        }
                    }

                    if(c.cloudiness === 'halvklart'){

                        if(precipitation_for_day <= 1.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'rainy-2.svg'
                            })
                        }

                        if(precipitation_for_day > 1.0 && precipitation_for_day <= 5.0){
                            weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'rainy-3.svg'
                            })
                        }

                    }

                    if(c.cloudiness === 'soligt'){
                        weather_data.push({
                                date: c.date,
                                avg_temp:avg_temp_for_day,
                                icon: 'rainy-1.svg'
                        })

                    }
                }
            }

            console.log('----------')
        })


        return weather_data
    }
    
    const weather_data = generate_weather_data(avg_temps,min_temps,cloudy_percent, precip)
    console.log('--------- WEATHER DATA --------')
    console.log(weather_data)
    
 
    
    return {
        trips,
        stations,
        weather_data
    };
}


//1766012403862
