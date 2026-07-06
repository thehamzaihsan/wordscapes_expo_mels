import React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

type BrandLogoProps = {
  size?: number;
};

/**
 * Wordgrove mark: three spruces in a thin ring over a gold horizon —
 * a small "grove" badge that pairs with the serif wordmark.
 */
const BrandLogo = ({ size = 120 }: BrandLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    {/* Outer ring */}
    <Circle cx="60" cy="60" r="56" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth="2.5" />
    <Circle cx="60" cy="60" r="50" stroke="#DFA02E" strokeOpacity={0.85} strokeWidth="1" />

    <G>
      {/* Center spruce */}
      <Path
        d="M60 26 L72 50 L66 50 L76 68 L64 68 L64 80 L56 80 L56 68 L44 68 L54 50 L48 50 Z"
        fill="#FFFFFF"
      />
      {/* Left spruce */}
      <Path
        d="M38 46 L46 62 L42 62 L49 74 L41 74 L41 80 L35 80 L35 74 L27 74 L34 62 L30 62 Z"
        fill="#FFFFFF"
        opacity={0.8}
      />
      {/* Right spruce */}
      <Path
        d="M82 46 L90 62 L86 62 L93 74 L85 74 L85 80 L79 80 L79 74 L71 74 L78 62 L74 62 Z"
        fill="#FFFFFF"
        opacity={0.8}
      />
      {/* Gold horizon line */}
      <Path d="M30 88 H90" stroke="#DFA02E" strokeWidth="2.5" strokeLinecap="round" />
    </G>
  </Svg>
);

export default BrandLogo;
