# Character animation catalogue

The current character is Chasersgaming's **Adventure Series Character Agent SMS**, free CC0 edition. [Source and license declaration](https://opengameart.org/content/adventure-series-character-agent-sms) · [Local notice](cc0-agent/LICENSE.txt).

`animations.json` (`open-agent-02-run`) owns nine unmodified source PNGs (eight strips and one master sheet), 22 calibrated clip definitions and 29 action sequences. It records the source archive hash, original filenames, per-file SHA-256 values and frame indices. All runtime art resides in `cc0-agent/`; the menu, game, lab and editor share this catalogue.

The project adapts hoist/crouch poses for climbing and sliding, somersaults for rolling/pads, and grab/reach poses for ropes. Fixed scale, foot/pelvis/hand anchors and distance-driven running keep presentation separate from collision. Pixel artwork uses nearest-neighbor sampling. See [the current asset guide](../../Documents/Current/animation-assets.md) for mapping and visual limitations.

The earlier extracted Vector atlases and reference-guided generated sheets have been removed from the current public tree. Their source attribution was not evidence of redistribution permission. Earlier commits remain historical; they were not rewritten. `npm run check:art` verifies the current open-art subset without a private archive or network access.

The free archive has mislabeled standalone exports: `SMS_Adv_Run_strip4.png` contains standing poses and `SMS_Adv_Idle_strip4.png` contains an armed run. The game selects the unarmed top-row RUN poses directly from `SMS_Adv_Agent_Free_SpriteSheet.png`, using four 16 × 32 crops at x=176, 192, 208, 224 and y=24. The source PNG remains unchanged. `selectionNote` records this exception; the shared catalogue supplies both gameplay and the menu.
