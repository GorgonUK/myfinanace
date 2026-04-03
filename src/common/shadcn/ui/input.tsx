import * as React from "react"

import { cn } from "@/common/shadcn/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (type === "number") {
        // Restrict input for type "number"
        if (
          !/\d/.test(e.key) &&
          e.key !== "Backspace" &&
          e.key !== "Delete" &&
          e.key !== "ArrowLeft" &&
          e.key !== "ArrowRight" &&
          e.key !== "."
        ) {
          e.preventDefault();
        }
      }
      if (type === "time") {
        // Restrict input for type "time"
        if (
          !/\d/.test(e.key) &&
          e.key !== "Backspace" &&
          e.key !== "Delete" &&
          e.key !== "ArrowLeft" &&
          e.key !== "ArrowRight"
        ) {
          e.preventDefault();
        }
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === "time") {
        const value = e.target.value;
        const isValidTime = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value);

        if (!isValidTime && value) {
          alert("Please enter a valid 24-hour time (e.g., 00:00, 09:30, 17:45).");
          e.target.value = ""; // Clear the input if invalid
        }
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md bg-background px-4 py-2 text-base file:bg-transparent file:text-base file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
