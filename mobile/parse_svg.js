const fs = require('fs');

const extractSvg = (brandName, filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match `brand_name == "Name"` then find `<svg ...>...</svg>`
  const startIdx = content.indexOf(`brand_name == "${brandName}"`);
  if (startIdx === -1) return null;
  const svgStart = content.indexOf('<svg', startIdx);
  const svgEnd = content.indexOf('</svg>', svgStart) + 6;
  let svg = content.substring(svgStart, svgEnd);
  
  // basic react-native-svg conversion
  svg = svg.replace(/<svg/g, '<Svg')
           .replace(/<\/svg>/g, '</Svg>')
           .replace(/<path/g, '<Path')
           .replace(/<g/g, '<G')
           .replace(/<\/g>/g, '</G>')
           .replace(/<defs/g, '<Defs')
           .replace(/<\/defs>/g, '</Defs>')
           .replace(/<clipPath/g, '<ClipPath')
           .replace(/<\/clipPath>/g, '</ClipPath>')
           .replace(/<style[\s\S]*?<\/style>/g, '') // remove style blocks
           .replace(/class="[^"]*"/g, '')
           .replace(/xmlns:[a-z]+="[^"]*"/g, '')
           .replace(/xmlns="[^"]*"/g, '')
           .replace(/clip-path/g, 'clipPath')
           .replace(/fill-rule/g, 'fillRule')
           .replace(/stroke-width/g, 'strokeWidth');
           
  // replace classes with inline fills
  svg = svg.replace(/class="st0-ugc"/g, 'fill="#1E2548"');
  svg = svg.replace(/class="st1-ugc"/g, 'fill="#41A5DD"');
  svg = svg.replace(/class="st0-il"/g, 'fill="#ED1D24"');
  return svg;
};

const pathe = extractSvg('Pathé', '../templates/film.html');
const ugc = extractSvg('UGC', '../templates/film.html');
const lumiere = extractSvg('Institut Lumière', '../templates/film.html');

const template = `import React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';

export const PatheLogo = ({ width = 50, height = 38 }: { width?: number, height?: number }) => (
${pathe.replace('<Svg', '<Svg width={width} height={height}')}
);

export const UgcLogo = ({ width = 50, height = 33 }: { width?: number, height?: number }) => (
${ugc.replace('<Svg', '<Svg width={width} height={height}')}
);

export const InstitutLumiereLogo = ({ width = 30, height = 30 }: { width?: number, height?: number }) => (
${lumiere.replace('<Svg', '<Svg width={width} height={height}')}
);
`;

fs.writeFileSync('src/components/ui/CinemaLogos.tsx', template);
