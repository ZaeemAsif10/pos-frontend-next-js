import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  ...props
}: React.ComponentProps<"input">) {
  const isNumber = type === "number"
  const [isFocused, setIsFocused] = React.useState(false)
  const [rawNumText, setRawNumText] = React.useState<string>(() =>
    value !== undefined && value !== null ? String(value) : ""
  )

  React.useEffect(() => {
    if (!isNumber) return
    if (!isFocused) {
      setRawNumText(value !== undefined && value !== null ? String(value) : "")
    } else if (value !== undefined && value !== null) {
      // Sync if parent changed value programmatically while focused (e.g. "Pay Full" button),
      // unless user currently has an empty box or trailing decimal/zeros that evaluate to 0.
      const parsedRaw = rawNumText === "" || rawNumText === "-" ? 0 : Number(rawNumText)
      const numericProp = Number(value)
      if (!Number.isNaN(numericProp) && parsedRaw !== numericProp) {
        setRawNumText(numericProp === 0 ? "" : String(value))
      }
    }
  }, [value, isFocused, isNumber, rawNumText])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumber) {
      setIsFocused(true)
      const currentStr =
        value !== undefined && value !== null ? String(value) : e.currentTarget.value
      if (currentStr === "0" || currentStr === "0.0" || currentStr === "0.00") {
        setRawNumText("")
        if (value === undefined) {
          e.currentTarget.value = ""
        }
      } else {
        setRawNumText(currentStr)
      }
    }
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumber) {
      setIsFocused(false)
      setRawNumText(value !== undefined && value !== null ? String(value) : e.currentTarget.value)
    }
    onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumber) {
      let nextVal = e.target.value
      // Strip leading zero when typing digits like "05" -> "5" (keep "0." for decimals)
      if (/^0\d+/.test(nextVal)) {
        nextVal = nextVal.replace(/^0+/, "")
        e.target.value = nextVal
      }
      setRawNumText(nextVal)
    }
    onChange?.(e)
  }

  const controlledProps =
    isNumber && value !== undefined
      ? { value: isFocused ? rawNumText : value }
      : value !== undefined
      ? { value }
      : {}

  return (
    <input
      type={type}
      data-slot="input"
      placeholder={placeholder ?? (isNumber ? "0" : undefined)}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none caret-[#2CA01C] file:inline-flex file:h-6 file:rounded-md file:border-0 file:bg-[#2CA01C] file:px-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#248417] placeholder:text-muted-foreground focus-visible:border-[#2CA01C] focus-visible:ring-3 focus-visible:ring-[#2CA01C]/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      {...controlledProps}
      {...props}
    />
  )
}

export { Input }
