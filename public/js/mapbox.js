/* eslint-disable */

export const displayMap = (locations)=>{
    mapboxgl.accessToken = 'pk.eyJ1IjoibmF5ZWVtLSIsImEiOiJjbDl0emgzMTYwbTB0M29tbmhocGllNDViIn0.hx-_cSCcPnEuzhAYSPvHOg';
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/nayeem-/cl9u1n0pi000o14rwxc1h4rx5', // style URL
        scrollZoom:false
 });
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc=>{
        //create marker
        const el = document.createElement('div');
        el.className = 'marker';
        //add marker
        new mapboxgl.Marker({
            element:el,
            achor:'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
        //add popup
        new mapboxgl.Popup({
            offset:30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);

        //extends map bounds to iclude current location
        bounds.extend(loc.coordinates);
    });
    map.fitBounds(bounds,{
        padding:{
            top:200,
            bottom:150,
            left:100,
            right:100
        }
    });
}

