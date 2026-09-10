import { HttpTypes } from "@medusajs/types"
import { ChevronDown } from "@medusajs/icons"
import Markdown from "react-markdown"

export default function ProductTabs({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  return (
    <details
      open
      className="group/details rounded-[28px] bg-white px-6 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.025)] small:px-9"
    >
      <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold tracking-tight text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066cc] [&::-webkit-details-marker]:hidden">
        Product details
        <ChevronDown
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-[#86868b] transition-transform group-open/details:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="max-w-3xl border-t border-[#eeeef0] py-6 text-sm leading-relaxed text-[#6e6e73] [overflow-wrap:anywhere] [&_img]:h-auto [&_img]:max-w-full">
        {product.description ? (
          <Markdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              h2: ({ children }) => (
                <h2 className="mb-3 mt-5 text-lg font-semibold text-[#1d1d1f]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 font-semibold text-[#1d1d1f]">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 list-disc space-y-2 pl-5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 list-decimal space-y-2 pl-5">{children}</ol>
              ),
              a: ({ children, ...props }) => (
                <a {...props} className="text-[#0066cc] underline">
                  {children}
                </a>
              ),
            }}
          >
            {product.description}
          </Markdown>
        ) : (
          <p>Contact our team for more information about this product.</p>
        )}
      </div>
    </details>
  )
}
