import React, { useState } from 'react';
import '../App.css'

type IntegerInputProps = {
  output: (bet: number) => void;
  error: string;
  isEditable: boolean;
}

export default function IntegerInput({ output, error, isEditable }: IntegerInputProps) {
  const [value, setValue] = useState<string>("");

  // Parse value to IntString
  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue: string = e.target.value.replace(/[^0-9]/g, ''); // Replace anything that's not a digit
    output(parseInt(newValue) || 0); // Set the output variable usestate
    setValue(newValue); // Update displayed value
  }

  return (
  <>
    <div className="integer-input">
    <p className="error">{error}</p>
    <input type="text" value={value} onChange={handleValueChange} readOnly={!isEditable} />
    </div>
  </> 
  );
}
