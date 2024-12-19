import React, { useState } from 'react';
import '../App.css'

interface IntegerInputProps {
  output: (bet: number) => void;
  error: string;
}

export default function IntegerInput({ output, error }: IntegerInputProps) {
  const [value, setValue] = useState<string>("");

  // Parse value to IntString
  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue: string = e.target.value.replace(/[^0-9]/g, ''); // Replace anything that's not a digit
    output(parseInt(newValue) || 0); // Set the output variable usestate
    setValue(newValue); // Update displayed value
  }

  return (
  <>
    <input type="text" value={value} onChange={handleValueChange} />
    <p className="error">{error}</p>
  </> );
}
