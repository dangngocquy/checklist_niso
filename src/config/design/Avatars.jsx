import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export const colors = [
    // Primary Colors
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',

    // Secondary Colors
    '#FF7F00', '#7FFF00', '#7F00FF', '#FF007F', '#00FF Sabbath7F', '#7F7F00',

    // Pastel Colors
    '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFD700', '#98FB98', '#87CEFA',

    // Earth Tones
    '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2691E', '#B8860B',

    // Vibrant Colors
    '#FF4500', '#1E90FF', '#32CD32', '#FF69B4', '#BA55D3', '#FF8C00',

    // Cool Colors
    '#4169E1', '#20B2AA', '#48D1CC', '#00CED1', '#5F9EA0', '#008B8B',

    // Warm Colors
    '#DC143C', '#FF6347', '#FF4500', '#FF7F50', '#FF6347', '#FF8C00',

    // Muted Colors
    '#778899', '#708090', '#A9A9A9', '#696969', '#808080', '#C0C0C0'
];

export const getAvatarColor = (initial) => {
    // Find the first alphabetic character, ignoring spaces and non-alphabetic characters
    const firstAlphaChar = String(initial)
        .split('')
        .find(char => /[A-Za-z]/.test(char)) || initial;

    // Use the character code of the first alphabetic character to select a color
    const index = String(firstAlphaChar).toUpperCase().charCodeAt(0) % colors.length;
    return colors[index];
};

const Avatars = ({
    user = null,
    sizeImg = 40,
    CssClassname = '',
    sizeFont,
    FunctionClick,
    cssStyle = {}
}) => {
    // Function to extract the first valid alphabetic character
    const getDisplayInitials = (input) => {
        // Handle null or undefined input
        if (input == null) {
            return <UserOutlined />;
        }

        // If input is an object, safely access name
        if (typeof input === 'object' && input !== null) {
            const name = input.name;
            // Ensure name is a string before splitting
            if (typeof name === 'string' && name.trim()) {
                const alphaChar = name.split('').find(char => /[A-Za-z]/.test(char));
                return alphaChar ? alphaChar.toUpperCase() : <UserOutlined />;
            }
            return <UserOutlined />;
        }

        // If input is a string
        if (typeof input === 'string' && input.trim()) {
            const alphaChar = input.split('').find(char => /[A-Za-z]/.test(char));
            return alphaChar ? alphaChar.toUpperCase() : <UserOutlined />;
        }

        // Default to UserOutlined icon if no valid character found
        return <UserOutlined />;
    };

    // Get display initials
    const displayInitials = getDisplayInitials(user);

    // Get color based on the initial
    const color = getAvatarColor(displayInitials);

    // Determine avatar size
    const avatarSize = typeof sizeImg === 'string' ?
        (['large', 'small', 'default'].includes(sizeImg) ? sizeImg : 'default')
        : (typeof sizeImg === 'number' ? sizeImg : 40);

    return (
        <Avatar
            style={{
                backgroundColor: color,
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: sizeFont || '16px',
                boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
                border: '1px solid #d8d8d8',
                ...cssStyle
            }}
            alt={
                user && typeof user === 'object' && user.name 
                    ? user.name 
                    : (typeof user === 'string' ? user : 'Unknown')
            }
            size={avatarSize}
            className={CssClassname}
            onClick={FunctionClick}
        >
            {displayInitials}
        </Avatar>
    );
};

export default Avatars;