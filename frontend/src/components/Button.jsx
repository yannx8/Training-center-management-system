import React from 'react';
import './Button.css';

// Reusable Button component with academic styling
const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false }) => {
    return (
        <button 
            className={`btn btn-${variant}`} 
            onClick={onClick} 
            type={type} 
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;
