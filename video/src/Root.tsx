import React from 'react';
import { Composition } from 'remotion';
import { Legible } from './Legible';
import { SITE_DEMO_FRAMES, SiteDemo } from './SiteDemo';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Legible" component={Legible} durationInFrames={900} fps={30} width={1920} height={1080} />
    <Composition id="SiteDemo" component={SiteDemo} durationInFrames={SITE_DEMO_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
