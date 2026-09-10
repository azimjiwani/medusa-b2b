"use client"

import { ArrowLeftMini, ArrowRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, IconButton } from "@medusajs/ui"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
}

const ImageGallery = ({ product }: ImageGalleryProps) => {
  const thumbnail = product?.thumbnail
  const images = useMemo(() => product?.images || [], [product])

  const [selectedImage, setSelectedImage] = useState(
    images[0] || {
      url: thumbnail,
      id: "thumbnail",
    }
  )
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleArrowClick = useCallback(
    (direction: "left" | "right") => {
      if (
        images.length === 0 ||
        (selectedImageIndex === 0 && direction === "left") ||
        (selectedImageIndex === images.length - 1 && direction === "right")
      ) {
        return
      }

      if (direction === "left") {
        setSelectedImageIndex((prev) => prev - 1)
        setSelectedImage(images[selectedImageIndex - 1])
      } else {
        setSelectedImageIndex((prev) => prev + 1)
        setSelectedImage(images[selectedImageIndex + 1])
      }
    },
    [images, selectedImageIndex]
  )

  const handleImageClick = useCallback(
    (image: HttpTypes.StoreProductImage) => {
      setSelectedImage(image)
      setSelectedImageIndex(images.findIndex((img) => img.id === image.id))
    },
    [images]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement) {
        return
      }

      if (e.key === "ArrowLeft") {
        handleArrowClick("left")
      } else if (e.key === "ArrowRight") {
        handleArrowClick("right")
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleArrowClick])

  return (
    <div className="flex min-w-0 flex-col items-center rounded-[28px] bg-white p-5 small:p-7 gap-4 w-full shadow-[0_4px_20px_rgba(0,0,0,0.025)]">
      <div
        className="relative aspect-square w-full overflow-hidden"
        id={selectedImage.id}
      >
        <div className="absolute inset-0">
          {!!selectedImage.url && (
            <Image
              src={selectedImage.url}
              priority
              className="absolute inset-0 rounded-2xl p-2 small:p-5 object-contain mix-blend-multiply"
              alt={(selectedImage.metadata?.alt as string) || product.title}
              fill
              sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
            />
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        {images.length > 1 && (
          <div className="flex flex-row gap-x-2 self-end small:self-auto">
            <IconButton
              disabled={selectedImageIndex === 0}
              className="h-11 w-11 rounded-full items-center justify-center"
              aria-label="Previous product image"
              onClick={() => handleArrowClick("left")}
            >
              <ArrowLeftMini />
            </IconButton>
            <IconButton
              disabled={selectedImageIndex === images.length - 1}
              className="h-11 w-11 rounded-full items-center justify-center"
              aria-label="Next product image"
              onClick={() => handleArrowClick("right")}
            >
              <ArrowRightMini />
            </IconButton>
          </div>
        )}
        <ul className="flex min-w-0 max-w-full flex-row gap-x-2 overflow-x-auto">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                aria-label={`View product image ${index + 1}`}
                aria-pressed={index === selectedImageIndex}
                onClick={() => handleImageClick(image)}
                className={clx(
                  "flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066cc]",
                  index === selectedImageIndex
                    ? "border-[#b7cbe4] bg-[#f5f7fa]"
                    : "border-transparent bg-[#f5f5f7] hover:border-[#d2d2d7]"
                )}
              >
                <Image
                  src={image.url}
                  alt={(image.metadata?.alt as string) || ""}
                  height={44}
                  width={44}
                  className={clx(
                    index === selectedImageIndex ? "opacity-100" : "opacity-40",
                    "hover:opacity-100 object-contain"
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ImageGallery
