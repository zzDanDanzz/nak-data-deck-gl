import DeckGL from "@deck.gl/react";
import { scaleLinear } from "d3-scale";
import { MVTLayer, GeoJsonLayer, PathLayer } from "deck.gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Map } from "react-map-gl";
import { useImmer } from "use-immer";
import constants from "./constants";
import { useEffect, useState } from "react";

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
  const [styleUrl, setStyleUrl] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [derivedTileUrl, setDerivedTileUrl] = useState("");

  const [fillColorOptions, setFillColorOptions] = useImmer({
    propertyName: "rxlevel",
    beginColor: "green",
    endColor: "blue",
    beginRange: -100,
    endRange: 0,
  });

  useEffect(() => {
    const fetchTileStyles = async () => {
      const res = await fetch(styleUrl, {
        headers: {
          "x-api-key": constants.headers["x-api-key"],
        },
      });
      const data = await res.json();
      Object.entries(data.sources).map(([, srcDef]) => {
        const baseUrl = styleUrl.split("mym/styles")[0];
        const parts = srcDef["tiles"][0].split("tile/layers");
        const url = `${baseUrl}tile/layers${parts[1]}${
          fromCache ? "?data_from_cache=true" : ""
        }`;
        setDerivedTileUrl(url);
      });
    };
    fetchTileStyles();
  }, [fromCache, styleUrl]);

  const layers = [
    derivedTileUrl.length > 0
      ? new MVTLayer({
          data: derivedTileUrl,

          renderSubLayers: (props) => {
            const {
              bbox: { west, south, east, north },
            } = props.tile;
            return [
              new GeoJsonLayer({
                ...props,
                pointRadiusUnits: "pixels",
                stroked: false,
                getPointRadius: 5,
                pickable: true,
                tileSize: 256,

                getFillColor: (d) => {
                  const {
                    propertyName,
                    beginColor,
                    beginRange,
                    endColor,
                    endRange,
                  } = fillColorOptions;

                  const prop = d.properties?.[propertyName];

                  if (prop) {
                    const getColor = scaleLinear(
                      [beginRange, endRange],
                      [beginColor, endColor]
                    );

                    const rgbStr = getColor(prop);

                    return convertRGBStrToArr(rgbStr);
                  }
                  return [0, 0, 0];
                },
                updateTriggers: {
                  getFillColor: fillColorOptions,
                  data: derivedTileUrl,
                },
              }),
              new PathLayer({
                id: `${props.id}-border`,
                data: [
                  [
                    [west, north],
                    [west, south],
                    [east, south],
                    [east, north],
                    [west, north],
                  ],
                ],
                getPath: (d) => d,
                getColor: [255, 0, 0],
                widthMinPixels: 4,
              }),
            ];
          },
        })
      : null,
  ];

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2
        style={{
          margin: "0.5rem",
        }}
      >
        with deck.gl
      </h2>
      <form>
        <fieldset
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
          }}
        >
          <legend>tile service config: </legend>

          <div
            style={{
              width: "100%",
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <label htmlFor="styleUrl">styleUrl: </label>
            <input
              type="text"
              name="styleUrl"
              value={styleUrl}
              onChange={(e) => setStyleUrl(e.target.value.trim())}
              style={{
                flexGrow: "1",
              }}
            />
          </div>

          <div>
            <label htmlFor="fromCache">fromCache: </label>
            <input
              type="checkbox"
              name="fromCache"
              value={fromCache}
              onChange={(e) => setFromCache(e.target.checked)}
            />
          </div>

          <span
            style={{
              color: "gray",
            }}
          >
            derivedTileUrl: {derivedTileUrl}
          </span>
        </fieldset>
        <fieldset
          style={{
            display: "flex",
            gap: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          <legend>fill color options: </legend>
          <div>
            <label htmlFor="propertyName">propertyName: </label>
            <input
              type="text"
              name="propertyName"
              value={fillColorOptions.propertyName}
              onChange={(e) =>
                setFillColorOptions((s) => {
                  s.propertyName = e.target.value.trim();
                })
              }
            />
          </div>

          <div>
            <label htmlFor="beginColor">beginColor: </label>
            <input
              type="text"
              name="beginColor"
              value={fillColorOptions.beginColor}
              onChange={(e) =>
                setFillColorOptions((s) => {
                  s.beginColor = e.target.value.trim();
                })
              }
            />
          </div>

          <div>
            <label htmlFor="endColor">endColor: </label>
            <input
              type="text"
              name="endColor"
              value={fillColorOptions.endColor}
              onChange={(e) =>
                setFillColorOptions((s) => {
                  s.endColor = e.target.value.trim();
                })
              }
            />
          </div>

          <div>
            <label htmlFor="beginRange">beginRange: </label>
            <input
              type="number"
              name="beginRange"
              value={fillColorOptions.beginRange.toString()}
              onChange={(e) =>
                setFillColorOptions((s) => {
                  s.beginRange = Number(e.target.value.trim());
                })
              }
            />
          </div>

          <div>
            <label htmlFor="endRange">endRange: </label>
            <input
              type="number"
              name="endRange"
              value={fillColorOptions.endRange.toString()}
              onChange={(e) =>
                setFillColorOptions((s) => {
                  s.endRange = Number(e.target.value.trim());
                })
              }
            />
          </div>
        </fieldset>
      </form>
      <div
        style={{
          position: "relative",
          flexGrow: "1",
        }}
      >
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
          getTooltip={({ object }) => {
            if (!object?.properties) return null;

            const { propertyName } = fillColorOptions;
            const prop = object?.properties?.[propertyName];

            return `${propertyName} => ${prop ? prop : " 😿"}`;
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
      </div>
    </div>
  );
}

export default App;
