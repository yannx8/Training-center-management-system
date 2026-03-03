// FILE: /frontend/src/components/Button.jsx
// FIX: removed import of './Button.css' which doesn't exist — crashes the app

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