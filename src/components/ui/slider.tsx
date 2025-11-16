import * as React from "react"

interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className = '', value = [0], onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.([Number(e.target.value)])
    }

    return (
      <div ref={ref} className={`relative flex items-center ${className}`} {...props}>
        <input
          type="range"
          value={value[0]}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d97757 0%, #e89b7e 100%);
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(217, 119, 87, 0.4);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(217, 119, 87, 0.5);
          }
          input[type="range"]::-moz-range-thumb {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d97757 0%, #e89b7e 100%);
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 8px rgba(217, 119, 87, 0.4);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(217, 119, 87, 0.5);
          }
        `}</style>
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
