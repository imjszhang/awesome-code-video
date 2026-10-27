# Practical Reuse Guide

[Back to the list](../README.md)

Choose a starting point by how much you want to reuse, not just how similar a preview looks to your idea.

## Editing a Complete Film

**Ink Press** is the clearest full-film starting point in the first edition. Its [template guide](https://github.com/Vincentwei1021/video-shotcraft/blob/main/template/TEMPLATE.md) describes the ten-shot structure and replacement process.

You need product screenshots, individual interface element crops, page coordinates, copy, and branding. Keep the timing and motion structure initially, then adjust camera framing to fit the new interface. Replacing a screenshot without updating coordinates can break where elements land or where the camera points. The supplied product screenshots are demonstration assets; replace them before publishing your own film. Audio assets have their own attribution information, and [Remotion licensing terms](https://www.remotion.dev/docs/license) apply to the rendering framework.

## Adapting a Scene or Worked Example

**Paper-Cut Five-Layer Motion** provides a self-contained paper-collage scene. The [example notes](https://github.com/HeiGeAi/Paper-Cut/blob/main/examples/five-layer-motion/README.md) explain the five-layer structure and image-dependent extraction masks. A new image requires new layer boundaries, not just a filename change. The example is silent, so narration, sound, and full-film pacing are additional work.

**Butterfly Life** includes the film source and production tools. Reuse its structure for a lifecycle or process explainer, but expect to implement the new subject's drawing and transformations.

**Claude Quest** is a worked game-engine film. Its reusable parts include retro rendering, gameplay systems, and a recorded control sequence. A new narrative means changing levels, characters, or the sequence that drives the film.

## Reusing a Map Preset

Start from the closest [map-motion example](https://github.com/SpaceZephyr/map-motion/tree/main/assets/examples), then change locations, routes, labels, and timing. Verify coordinates and route data before styling. Map credentials and data requirements depend on the selected mode. The project’s code license does not grant rights to third-party map tiles; consult the upstream provider notes for AMap and Esri use. A geographic animation can look plausible while describing the wrong place, so validate the underlying geography as well as the render.

## Integrating a Shot Recipe

A Shotcraft card explains the motion; its corresponding demo supplies implementation references. Follow the [demo integration guide](https://github.com/Vincentwei1021/video-shotcraft/blob/main/demos/README.md), use the project's expected dimensions and dependencies, and connect the shot to your own timeline. Recheck entry, peak motion, and the final settled frame after replacing content. Long words, different card counts, and different screen layouts can change composition.

## Reusing a Visual Style

A Lemo `STYLE.md` is an art-direction and production specification. Give it to your coding agent together with the subject, audience, length, aspect ratio, and available assets. It helps preserve the visual language; it does not supply a ready-made film about a different subject. Review the generated scenes against the style's reference film and expect iteration.

## Understanding Commercial Use

Read the current terms of each selected project and any bundled assets. For example, OneTake's free repository is explicitly noncommercial, while some other projects distinguish source-code licensing from demonstration media or audio licensing. Lemo also distinguishes its code and documentation from sample films and stills; check its media attribution, third-party credits, and voice-track exceptions before reusing demonstration assets. The catalog's license applies to the catalog, not to those external resources.
