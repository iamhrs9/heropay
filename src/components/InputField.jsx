import React from 'react'
import './InputField.css'

export default function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  icon: Icon,
  rightAction,
  className = '',
  disabled = false,
  autoComplete,
  ...props
}) {
  return (
    <div className={`hp-input-group ${className}`}>
      {Icon && (
        <div className="hp-input-icon-box">
          <Icon size={20} strokeWidth={2.2} className="hp-input-icon" />
        </div>
      )}

      <div className="hp-input-content">
        {label && <label className="hp-input-label">{label}</label>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="hp-input-control"
          {...props}
        />
      </div>

      {rightAction && (
        <div className="hp-input-right-action">
          {rightAction}
        </div>
      )}
    </div>
  )
}
