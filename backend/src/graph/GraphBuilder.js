import pool from '../config/db.js';
let graphCache = null;

export async function buildGraph() {
  const result = await pool.query(`
    SELECT
      rs.route_id,
      rs.stop_id,
      rs.stop_order,
      rs.travel_time_to_next,
      s.name   AS stop_name,
      s.code   AS stop_code,
      r.name   AS route_name,
      r.color  AS route_color
    FROM route_stops rs
    JOIN stops  s ON s.id = rs.stop_id
    JOIN routes r ON r.id = rs.route_id
    ORDER BY rs.route_id, rs.stop_order
  `);

  const rows = result.rows;

  const adjacencyList = new Map(); // "stopId:routeId" → [{ node, travelTime, isTransfer, routeId }]
  const stopRouteMap  = new Map(); // stopId → [routeIds]
  const nodeMetaMap   = new Map(); // "stopId:routeId" → { stopId, stopName, stopCode, routeId, routeName, routeColor }

  for (const row of rows) {
    const key = `${row.stop_id}:${row.route_id}`;
    if (!adjacencyList.has(key)) adjacencyList.set(key, []);
    if (!stopRouteMap.has(row.stop_id)) stopRouteMap.set(row.stop_id, []);
    if (!stopRouteMap.get(row.stop_id).includes(row.route_id)) {
      stopRouteMap.get(row.stop_id).push(row.route_id);
    }
    nodeMetaMap.set(key, {
      stopId:     row.stop_id,
      stopName:   row.stop_name,
      stopCode:   row.stop_code,
      routeId:    row.route_id,
      routeName:  row.route_name,
      routeColor: row.route_color,
    });
  }

  // Step 2: Add edges between consecutive stops on the same line (bidirectional)
  const byRoute = {};
  for (const row of rows) {
    if (!byRoute[row.route_id]) byRoute[row.route_id] = [];
    byRoute[row.route_id].push(row);
  }

  for (const stops of Object.values(byRoute)) {
    for (let i = 0; i < stops.length - 1; i++) {
      const fromKey  = `${stops[i].stop_id}:${stops[i].route_id}`;
      const toKey    = `${stops[i + 1].stop_id}:${stops[i + 1].route_id}`;
      const time     = stops[i].travel_time_to_next || 2;

      adjacencyList.get(fromKey).push({ node: toKey,    travelTime: time, isTransfer: false, routeId: stops[i].route_id });
      adjacencyList.get(toKey).push({   node: fromKey,  travelTime: time, isTransfer: false, routeId: stops[i].route_id });
    }
  }

  for (const [stopId, routeIds] of stopRouteMap.entries()) {
    if (routeIds.length > 1) {
      for (let i = 0; i < routeIds.length; i++) {
        for (let j = i + 1; j < routeIds.length; j++) {
          const nodeA = `${stopId}:${routeIds[i]}`;
          const nodeB = `${stopId}:${routeIds[j]}`;
          adjacencyList.get(nodeA).push({ node: nodeB, travelTime: 0, isTransfer: true, routeId: null });
          adjacencyList.get(nodeB).push({ node: nodeA, travelTime: 0, isTransfer: true, routeId: null });
        }
      }
    }
  }

  graphCache = { adjacencyList, stopRouteMap, nodeMetaMap };
  console.log(`Graph built: ${adjacencyList.size} nodes, ${stopRouteMap.size} unique stops`);
  return graphCache;
}

export function getGraph() {
  return graphCache;
}

export async function rebuildGraph() {
  graphCache = null;
  return await buildGraph();
}