import React from "react";

interface AssistantIconProps {
  size?: number | string;
  className?: string;
  bubbleFillColor?: string;
  botColor?: string;
  withBackground?: boolean;
}

export function AssistantIcon({
  size = 36,
  className = "",
  bubbleFillColor = "#10B981", // Bulle pleine vert de l'app (vendeur-emerald)
  botColor = "#0c0f0d",        // Bot découpé en transparence
  withBackground = false
}: AssistantIconProps) {
  // We use SVG mask so the robot shapes are 100% transparent cuts through the solid green bubble
  const maskId = React.useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="235 235 770 815"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <defs>
        {/* Mask: White = visible green bubble, Black = transparent cutout bot */}
        <mask id={maskId}>
          {/* 1. Everything white initially */}
          <rect x="0" y="0" width="1254" height="1254" fill="#ffffff" />

          {/* 2. Cutout Robot Helmet Outline (Black = hole) */}
          <path
            d="M 425,700
               C 425,525 505,480 622,480
               C 739,480 819,525 819,700
               C 819,815 735,845 622,845
               C 509,845 425,815 425,700 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="54"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Cutout Antenna */}
          <line x1="622" y1="480" x2="622" y2="395" stroke="#000000" strokeWidth="44" strokeLinecap="round" />
          <circle cx="622" cy="362" r="34" fill="#000000" />

          {/* 4. Cutout Left Ear */}
          <path
            d="M 412,595
               C 355,595 332,640 332,670
               C 332,700 355,745 412,745"
            fill="#000000"
          />

          {/* 5. Cutout Right Ear */}
          <path
            d="M 832,595
               C 889,595 912,640 912,670
               C 912,700 889,745 832,745"
            fill="#000000"
          />

          {/* 6. Cutout Microphone */}
          <path
            d="M 838,695
               C 855,770 805,830 732,834"
            fill="none"
            stroke="#000000"
            strokeWidth="40"
            strokeLinecap="round"
          />
          <ellipse cx="729" cy="834" rx="36" ry="30" fill="#000000" transform="rotate(-15 729 834)" />

          {/* 7. Cutout Eyes */}
          <path
            d="M 494,680
               C 506,648 550,648 562,680"
            fill="none"
            stroke="#000000"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <path
            d="M 681,680
               C 693,648 737,648 749,680"
            fill="none"
            stroke="#000000"
            strokeWidth="32"
            strokeLinecap="round"
          />

          {/* 8. Cutout Smile */}
          <path
            d="M 578,760
               C 595,788 648,788 665,760"
            fill="none"
            stroke="#000000"
            strokeWidth="30"
            strokeLinecap="round"
          />
        </mask>
      </defs>

      {/* Optional squircle background */}
      {withBackground && (
        <rect x="20" y="20" width="1214" height="1214" rx="275" ry="275" fill="#01524b" />
      )}

      {/* Solid Filled Green Speech Bubble: Exact 100% replica of assistant-vendeuria.png */}
      <path
        d="M 354,888
           A 372 372 0 1 1 500,984
           L 348,1028
           C 342,1030 338,1024 340,1018
           L 354,888
           Z"
        fill={bubbleFillColor}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
