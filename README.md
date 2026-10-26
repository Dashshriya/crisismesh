# CrisisMesh — Emergency coordination demo

CrisisMesh explores how a response team could coordinate incidents when normal communication is unreliable. This repository currently contains an interactive **frontend simulation**, not a live emergency dispatch system.

## Demo
Open `demo/index.html` in a modern browser.

## Working interactions
- Search and filter incidents by severity
- Inspect an incident from its queue entry or map marker
- Assign an available response team to an unassigned incident
- Resolve assigned incidents and return the team to the available pool
- Report a new incident through a validated form
- Review the session activity timeline
- Export the incident list as CSV
- Responsive command-center layout with explicit simulation and map disclaimers

## Important limitations
- Incidents, map positions, response teams and events are simulated in the browser.
- The map is illustrative and is not suitable for navigation or operational emergency response.
- This repository does not currently contain a connected FastAPI backend, real WebSocket service, or live mesh-network transport. No emergency services are contacted.
