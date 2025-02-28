import React, { useState, useEffect } from 'react';
import '../App.css'

type IntegerInputProps = {
  output: React.Dispatch<React.SetStateAction<number>>;
  error: string;
  isEditable: boolean;
  reset: boolean;
}

export default function IntegerInput({ output, error, isEditable, reset }: IntegerInputProps) {
  const [value, setValue] = useState<string>("");

    // Reset the value when reset is true
    useEffect(() => {
      if (reset) {
        setValue(""); // Clear input value
      }
    }, [reset]);

  // Parse value to IntString
  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue: string = e.target.value.replace(/[^0-9]/g, ''); // Replace anything that's not a digit
    output(parseInt(newValue) || 0); // Output the closest valid int
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
