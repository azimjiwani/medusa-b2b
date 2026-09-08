import { MinusMini, PlusMini } from "@medusajs/icons"
import { IconButton, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"

type BulkTableQuantityProps = {
  variantId: string
  maxQuantity: number
  onChange: (variantId: string, quantity: number) => void
}

const BulkTableQuantity = ({
  variantId,
  maxQuantity,
  onChange,
}: BulkTableQuantityProps) => {
  const [quantity, setQuantity] = useState("0")
  const [shiftPressed, setShiftPressed] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuantity = Math.min(
      Math.max(Number(e.target.value) || 0, 0),
      maxQuantity
    )
    setQuantity(nextQuantity.toString())
    onChange(variantId, nextQuantity)
  }

  const handleAdd = () => {
    const q = Math.min(
      Math.max(Number(quantity) + (shiftPressed ? 10 : 1), 0),
      maxQuantity
    )
    setQuantity(q.toString())
    onChange(variantId, q)
  }

  const handleSubtract = () => {
    const q = Math.max(Number(quantity) - (shiftPressed ? 10 : 1), 0)
    setQuantity(q.toString())
    onChange(variantId, q)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      handleAdd()
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      handleSubtract()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftPressed(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return (
    <div className="grid min-w-0 w-full grid-cols-[1.75rem_minmax(2rem,1fr)_1.75rem] items-center gap-1">
      <IconButton
        onClick={() => handleSubtract()}
        className="h-7 w-7 rounded-full hover:bg-neutral-200"
        variant="transparent"
        disabled={Number(quantity) === 0}
      >
        <MinusMini />
      </IconButton>
      <Input
        value={quantity}
        onChange={(e) => handleChange(e)}
        onKeyDown={handleKeyDown}
        type="number"
        min={0}
        max={maxQuantity}
        disabled={maxQuantity === 0}
        className="min-w-0 w-full px-1 text-center items-center justify-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <IconButton
        onClick={() => handleAdd()}
        className="h-7 w-7 rounded-full hover:bg-neutral-200"
        variant="transparent"
        disabled={Number(quantity) >= maxQuantity}
      >
        <PlusMini />
      </IconButton>
    </div>
  )
}

export default BulkTableQuantity
