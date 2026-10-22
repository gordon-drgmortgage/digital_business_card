Run `npm install` in this directory, then `npm run render-sharing-preview`.

The generator is adapted from the original `tmp/portrait-permanent/render-digital-card-assets.cjs`. It writes only the sharing image. It verifies the approved current portrait SHA-256 before composing it; cropping and scaling do not retouch or mirror the portrait. The existing white logo conversion, background, large circle geometry, and text are preserved. The two sweeping paths now remain below the text.

The versioned Open Graph image filename allows preview clients to request the replacement image after publication. Previously sent messages may retain their cached preview.
