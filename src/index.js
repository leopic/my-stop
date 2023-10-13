import "./base.css";
import "./alt-01.css";
import { getDepartures, getStop } from "./api.js";
import { parse } from "./tmpl";
import { formatTime, formatDate, formatIcon, formatWaitTime } from "./format";

const REFRESH_INTERVAL = 10_1000;

const DEPARTURE_TMPL = `
<tr>
<td><strong>{formatIcon(line.product)}&nbsp;{line.name}</strong></td>
<td>{formatWaitTime(when)}</td>
<td>{formatTime(when)}</td>
<td>{destination.name}</td>
</tr>
`;

function d(s) {
  return document.querySelector(s);
}

function render(line) {
  const checkedLines = localStorage.getItem("lines");
  const isChecked = checkedLines.split(",").includes(line) ? "checked" : "";

  return `<li style="display: inline-block; margin-right: 20px;">
            <input type="checkbox" id="line-${line}" data-line="${line}" name="lines" style="height: 24px; width: 24px;" ${isChecked}/>  
            <label for="line-${line}">${line}</label>
          </li>`;
}

function filterDepartures(departures) {
  let listOfLines = [... new Set(departures.map(ride => ride.line.productName).sort())];
  lines.innerHTML = listOfLines.map(line => render(line)).join("");
  const lineList = Array.from(document.getElementsByName("lines"));
  const selectedLines = lineList.filter(e => e.checked);
  const checkedLines = selectedLines.map(e => e.dataset.line);
  return departures.filter(ride => checkedLines.includes(ride.line.productName));
}

function storeFilters() {
  const lineList = Array.from(document.getElementsByName("lines"));
  lineList.forEach(el => el.addEventListener('change', function(chk) {
      const selectedLines = lineList.filter(e => e.checked);
      const checkedLines = selectedLines.map(e => e.dataset.line);
      window.localStorage.setItem("lines", checkedLines);
      init();
  }));
}

async function init() {
  const depTitle = d("#dep-title");
  const depContainer = d("#dep-container");
  const lastUpdated = d("#last-updated");
  const footer = d("#footer");
  const status = d("#status");
  const lines = d("#lines");
  const ctx = { formatTime, formatIcon, formatWaitTime };
  const stopSearch = document.location.hash || "Storkower";

  async function refresh(stop) {
    // TODO: realtimeDataUpdatedAt sometimes goes back in time (upstream caching issue?)
    const { departures, realtimeDataUpdatedAt } = await getDepartures(stop.id);
    depTitle.innerText = stop.name;
    document.title = stop.name + " Departures";
    const filteredDepartures = filterDepartures(departures);
    storeFilters();
    depContainer.innerHTML = filteredDepartures.map(dep => parse(DEPARTURE_TMPL, dep, ctx)).join("");
    lastUpdated.innerText = formatDate(new Date().getTime());
    footer.style.visibility = "visible";
    setTimeout(() => refresh(stop), REFRESH_INTERVAL);
  }

  const stop = await getStop(stopSearch);
  if (!stop) {
    status.innerText = "Stop not found!";
    status.className = "error";
  }

  refresh(stop);
}

init();