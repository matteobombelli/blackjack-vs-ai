import React, { useState } from 'react';
import './App.css'

export default function NumericInput() {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits (0-9)
    const newValue = e.target.value.replace(/[^0-9]/g, ''); // Replace anything that's not a digit
    setValue(newValue);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
    />
  );
}
