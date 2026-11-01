# Campaign and scene actions

Latest movement/audio rules: [continuous play, automatic high-edge climb and quick retry](continuous-play.md).


Updated 1 November 2026. Twelve authored campaign routes and three training views share the simulator and editor. The canonical route list is `content/game-flow.json`; layouts are in `content/parkour.json`.

| Route | Focus |
|---|---|
| Roof rhythm | Gap jump → slide → vault → climb |
| High water | Ledge catch/mantle → two low climbs |
| Wall signal | Wall rebound → vault → second wall |
| Soft landing | High drop/roll → tunnel → jump pad |
| Cable yard | Climb → cable → jump-pad gap |
| Crosscurrent | Pad → swing → cable → vault → high ledge |
| Skyline relay | Roof rhythm linked to High water |
| Antenna run | High water linked to Wall signal |
| Harbor express | Cable yard linked to Roof rhythm |
| Violet circuit | Crosscurrent linked to Cable yard |
| Gravity shift | Soft landing linked to High water |
| District marathon | Wall signal linked to Crosscurrent |

The six district courses reuse the source module instances with translated positions and unique instance IDs. Their data owns seam and checkpoint references. They are longer fixed combinations, not an endless generator. All twelve have recorded successful production runs and are selectable in Level Studio.

Space queues jumps/vaults/climbs in marked approaches. A committed Space jump catches a high ledge and automatically mantles after a short grip settle. S slides or buffers a hard-landing roll. E dashes. Q holds/releases swing or presses to attach/detach cable, selected by context. Jump pads launch on foot contact.

Climb/mantle ends in `TraverseExit` and running; true airborne impacts retain landing/roll recovery. Each section has a retry spawn. Retrying keeps the run timer; restarting resets the full route. Completion stores a device-local best time. See [game flow](game-flow.md) and [choreography](scene-choreography.md).
