import DeckGL from "@deck.gl/react";
import { MVTLayer } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Map } from "react-map-gl";
import constants from "./constants";
import { scaleLinear } from "d3-scale";

// Viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 51.414178828767945,
  latitude: 35.68490079732125,
  zoom: 11,
  pitch: 0,
  bearing: 0,
};

/**
 *
 * @param {string} str
 * @returns
 */
const convertRGBStrToArr = (str) => {
  const rgbArray = str
    .substring(4, str.length - 1)
    .replace(/ /g, "")
    .split(",");
  return rgbArray.map((color) => Number(color));
};

function App() {
  const nakLayer = new MVTLayer({
    data: "https://my-dev.map.ir/share/204d955d-601e-42fd-965f-80e314736d13/api/tile/layers/5d793942-16db-43ef-8e88-e7c139b81611@EPSG:3857@pbf/{z}/{y}/{x}.pbf?data_from_cache=true",
    pointRadiusUnits: "pixels",
    stroked: false,
    getPointRadius: 5,
    pickable: true,
    getFillColor: (d) => {
      const rxlevel = d.properties?.rxlevel;
      if (rxlevel) {
        const rxRange = rxlevel > 0 ? [0, 100] : [-100, 0];
        const colorRange = rxlevel > 0 ? ["green", "blue"] : ["red", "blue"];

        const getColor = scaleLinear(rxRange, colorRange);

        const rgbStr = getColor(rxlevel);

        return convertRGBStrToArr(rgbStr);
      }
      return [0, 0, 0];
    },
  });

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={[nakLayer]}
      // style={{
      //   width: 800,
      //   height: 800,
      // }}
      getTooltip={({ object }) => {
        return object?.properties?.rxlevel
          ? `RXLEVEL => ${object?.properties?.rxlevel}`
          : object?.properties
          ? "RXLEVEL => 😿"
          : null;
      }}
      getCursor={({ isHovering }) => (isHovering ? "help" : "grab")}
    >
      <Map
        mapStyle={
          "https://dev.map.ir/vector/styles/main/mapir-xyz-light-style.json"
        }
        transformRequest={(url) => {
          return {
            url,
            headers: {
              "x-api-key": constants.headers["x-api-key"],
            },
          };
        }}
        hash
      />
    </DeckGL>
  );
}

export default App;
