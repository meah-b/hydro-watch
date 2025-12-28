import React from 'react';
import { SvgXml } from 'react-native-svg';

type Props = {
	color: string;
};

export const Exclamation = (props: Props) => {
	const { color } = props;
	const exclamation = `
        <svg width="54" height="56" viewBox="0 0 54 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_i_254_933)">
        <path d="M27 39.6665C27.6375 39.6665 28.1719 39.4429 28.6031 38.9957C29.0344 38.5485 29.25 37.9943 29.25 37.3332C29.25 36.6721 29.0344 36.1179 28.6031 35.6707C28.1719 35.2235 27.6375 34.9998 27 34.9998C26.3625 34.9998 25.8281 35.2235 25.3969 35.6707C24.9656 36.1179 24.75 36.6721 24.75 37.3332C24.75 37.9943 24.9656 38.5485 25.3969 38.9957C25.8281 39.4429 26.3625 39.6665 27 39.6665ZM24.75 30.3332H29.25V16.3332H24.75V30.3332ZM27 51.3332C23.8875 51.3332 20.9625 50.7207 18.225 49.4957C15.4875 48.2707 13.1062 46.6082 11.0812 44.5082C9.05625 42.4082 7.45313 39.9387 6.27188 37.0998C5.09062 34.261 4.5 31.2276 4.5 27.9998C4.5 24.7721 5.09062 21.7387 6.27188 18.8998C7.45313 16.0609 9.05625 13.5915 11.0812 11.4915C13.1062 9.3915 15.4875 7.729 18.225 6.504C20.9625 5.279 23.8875 4.6665 27 4.6665C30.1125 4.6665 33.0375 5.279 35.775 6.504C38.5125 7.729 40.8938 9.3915 42.9188 11.4915C44.9438 13.5915 46.5469 16.0609 47.7281 18.8998C48.9094 21.7387 49.5 24.7721 49.5 27.9998C49.5 31.2276 48.9094 34.261 47.7281 37.0998C46.5469 39.9387 44.9438 42.4082 42.9188 44.5082C40.8938 46.6082 38.5125 48.2707 35.775 49.4957C33.0375 50.7207 30.1125 51.3332 27 51.3332Z" fill="${color}"/>
        </g>
        <defs>
        <filter id="filter0_i_254_933" x="0" y="0" width="54" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_254_933"/>
        </filter>
        </defs>
        </svg>
        `;
	return <SvgXml xml={exclamation} />;
};
