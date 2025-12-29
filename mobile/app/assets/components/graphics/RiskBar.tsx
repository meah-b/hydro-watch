import React from 'react';
import { SvgXml } from 'react-native-svg';

const RiskBar = () => {
	const riskBar = `
        <svg width="12" height="1435" viewBox="0 0 12 1435" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_i_286_904)">
        <rect width="12" height="1435" rx="6" fill="url(#paint0_linear_286_904)"/>
        </g>
        <defs>
        <filter id="filter0_i_286_904" x="0" y="0" width="12" height="1439" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_286_904"/>
        </filter>
        <linearGradient id="paint0_linear_286_904" x1="6" y1="0" x2="6" y2="1435" gradientUnits="userSpaceOnUse">
        <stop stop-color="#00FF2F"/>
        <stop offset="0.283654" stop-color="#FFCC00"/>
        <stop offset="0.725962" stop-color="#FF5E00"/>
        <stop offset="1" stop-color="#FF0000"/>
        </linearGradient>
        </defs>
        </svg>
        `;
	return <SvgXml xml={riskBar} />;
};

export default RiskBar;
