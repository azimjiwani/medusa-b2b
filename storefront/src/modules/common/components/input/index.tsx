import { clx, Label } from "@medusajs/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@/modules/common/icons/eye"
import EyeOff from "@/modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
  colSpan?: 1 | 2
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      name,
      label,
      touched,
      required,
      topLabel,
      colSpan = 1,
      className,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div
        className={clx(
          "flex min-w-0 flex-col w-full",
          colSpan === 2 && "xsmall:col-span-2"
        )}
      >
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            id={props.id || name}
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            className={clx(
              "pt-4 pb-1 block min-w-0 w-full h-11 px-4 text-base small:text-sm mt-0 bg-ui-bg-field rounded-full appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active shadow-borders-base hover:bg-ui-bg-field-hover",
              className
            )}
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={props.id || name}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-2 -z-1 origin-0 text-neutral-400"
          >
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-ui-fg-subtle min-h-11 px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-0"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
