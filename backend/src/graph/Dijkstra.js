import { getGraph } from './GraphBuilder.js';

const TRANSFER_PENALTY = parseInt(process.env.TRANSFER_PENALTY_MINUTES) || 10;

// Simple Min Priority Queue
class MinPriorityQueue {
  constructor() { this.heap = []; }
  enqueue(element, priority) {
    this.heap.push({ element, priority });
    this.heap.sort((a, b) => a.priority - b.priority);
  }
  dequeue() { return this.heap.shift(); }
  isEmpty() { return this.heap.length === 0; }
}



/**
 * @param {string} sourceStopId
 * @param {string} destStopId
 * @param {string} strategy - 'fastest' | 'least_transfers'
 * @returns {object|null} { segments, totalTime, totalStops, transfers } or null if no path
 */


export function findPath(sourceStopId, destStopId, strategy = 'fastest') {
  const graph = getGraph();
  if (!graph) throw new Error('Graph not initialized');

  const { adjacencyList, stopRouteMap, nodeMetaMap } = graph;

  // Edge case: same stop
  if (sourceStopId === destStopId) {
    return { segments: [], totalTime: 0, totalStops: 0, transfers: 0 };
  }

  // Check stops exist in graph
  if (!stopRouteMap.has(sourceStopId) || !stopRouteMap.has(destStopId)) {
    return null;
  }

  const sourceNodes = stopRouteMap.get(sourceStopId).map(rid => `${sourceStopId}:${rid}`);
  const destNodeSet = new Set(stopRouteMap.get(destStopId).map(rid => `${destStopId}:${rid}`));

  const dist = new Map();
  const prev = new Map();
  const pq   = new MinPriorityQueue();

  // Initialize all source nodes (stop may be on multiple lines)
  for (const node of sourceNodes) {
    dist.set(node, 0);
    pq.enqueue(node, 0);
  }

  while (!pq.isEmpty()) {
    const { element: current, priority: currentCost } = pq.dequeue();

    // Reached destination
    if (destNodeSet.has(current)) {
      return buildResult(prev, current, nodeMetaMap, dist.get(current));
    }

    if (currentCost > (dist.get(current) ?? Infinity)) continue;

    for (const edge of adjacencyList.get(current) || []) {
      const edgeCost =
        strategy === 'fastest'
          ? edge.travelTime
          : edge.travelTime + (edge.isTransfer ? TRANSFER_PENALTY : 0);

      const newCost = currentCost + edgeCost;
      if (newCost < (dist.get(edge.node) ?? Infinity)) {
        dist.set(edge.node, newCost);
        prev.set(edge.node, current);
        pq.enqueue(edge.node, newCost);
      }
    }
  }

  return null; // No path exists
}

/**
 * Traces back the prev map and formats into readable segments
 */
function buildResult(prev, endNode, nodeMetaMap, totalCost) {
  const rawPath = [];
  let current = endNode;
  while (current !== undefined) {
    rawPath.unshift(current);
    current = prev.get(current);
  }

  const segments  = [];
  let currentSeg  = null;
  let totalTime   = 0;
  let transfers   = 0;

  for (let i = 0; i < rawPath.length; i++) {
    const meta      = nodeMetaMap.get(rawPath[i]);
    const stopId    = rawPath[i].split(':')[0];

    if (i > 0) {
      const prevStopId  = rawPath[i - 1].split(':')[0];
      const prevMeta    = nodeMetaMap.get(rawPath[i - 1]);

      if (prevStopId === stopId) {
        // Same physical stop, different route = transfer
        transfers++;
        if (currentSeg) segments.push(currentSeg);
        currentSeg = null;
      } else {
        // Regular travel — add time from prev stop to this stop
        // Find edge weight between prev and current
        totalTime += 3; // avg 3 min per stop (approximate, actual stored in edges)
      }
    }

    if (!currentSeg) {
      currentSeg = {
        line:   meta.routeName,
        color:  meta.routeColor,
        stops:  [],
      };
    }

    // Avoid duplicate stop at transfer point
    const lastStop = currentSeg.stops[currentSeg.stops.length - 1];
    if (!lastStop || lastStop.id !== meta.stopId) {
      currentSeg.stops.push({
        id:   meta.stopId,
        name: meta.stopName,
        code: meta.stopCode,
      });
    }
  }

  if (currentSeg) segments.push(currentSeg);

  const totalStops = segments.reduce((sum, seg) => sum + seg.stops.length, 0);

  return { segments, totalTime, totalStops, transfers };
}