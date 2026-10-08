export function AboutPage() {
  return (
    <div className="page about-page">
      <div className="page-heading">
        <h1 className="page-title">About</h1>
      </div>

      <div className="content-card prose">
        <p>
          ParkStamp is a personal passport for U.S. <strong>state parks</strong>{" "}
          and <strong>national parks</strong>. Browse by state, filter by park
          type, find a park on the list or map, and stamp it when you’ve been
          there.
        </p>
        <p>
          Your visit stamps are stored <strong>only on this device</strong> in
          your browser. Nothing is uploaded to a server.
        </p>

        <h2>Park data</h2>
        <p>
          Park names and locations come from the U.S. Geological Survey{" "}
          <em>Protected Areas Database of the United States (PAD-US)</em>,
          limited to state parks and national parks. Parks that appear as
          multiple parcels in the source data are combined into a single stamp.
        </p>
        <p>
          Citation: U.S. Geological Survey (USGS) Gap Analysis Project (GAP),
          Protected Areas Database of the United States (PAD-US) 4.1:{" "}
          <a
            href="https://doi.org/10.5066/P96WBCHS"
            target="_blank"
            rel="noreferrer"
          >
            https://doi.org/10.5066/P96WBCHS
          </a>
          .
        </p>
        <p>
          Location labels use county names from U.S. Census boundaries. Street
          addresses aren’t available in PAD-US. Other National Park Service
          units (monuments, recreation areas, and similar) aren’t included yet.
        </p>

        <h2>Map</h2>
        <p>
          Maps use{" "}
          <a href="https://maplibre.org/" target="_blank" rel="noreferrer">
            MapLibre GL
          </a>{" "}
          with basemap tiles from{" "}
          <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
            OpenFreeMap
          </a>
          . © OpenStreetMap contributors.
        </p>
      </div>
    </div>
  );
}
